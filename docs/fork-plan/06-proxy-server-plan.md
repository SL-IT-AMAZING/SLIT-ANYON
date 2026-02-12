# SLIT 프록시 서버 구축 계획

> 우선순위: P0 (앱과 병렬 진행)
> 예상 공수: 3-5일
> 배포 위치: engine.any-on.dev

## 목표

ANYON 앱 → OpenCode CLI → **SLIT 프록시** → LLM 프로바이더

프록시가 하는 일:

1. **유저 인증**: ANYON Pro API 키 검증
2. **사용량 추적**: 토큰 사용량 기록
3. **쿼터 관리**: 구독 티어별 한도 적용
4. **비용 처리**: SLIT의 API 키로 실제 LLM 호출

---

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                     engine.any-on.dev                                │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      API Gateway                               │   │
│  │  • Authorization: Bearer <ANYON_PRO_API_KEY>                  │   │
│  │  • Rate limiting                                               │   │
│  │  • Request logging                                             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Auth & Quota Service                        │   │
│  │  • API 키 검증 → 유저 식별                                    │   │
│  │  • 구독 상태 확인 (active/expired/trial)                      │   │
│  │  • 잔여 크레딧 확인                                           │   │
│  │  • 쿼터 초과 시 429 반환                                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Provider Router                              │   │
│  │  • 요청 URL 파싱 → 프로바이더 식별                            │   │
│  │  • /v1/anthropic/* → Anthropic API                            │   │
│  │  • /v1/openai/*    → OpenAI API                               │   │
│  │  • /v1/google/*    → Google AI API                            │   │
│  │  • SLIT의 API 키 주입                                         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Usage Tracking                               │   │
│  │  • 응답에서 토큰 사용량 추출                                  │   │
│  │  • 유저별 사용량 DB 기록                                      │   │
│  │  • 크레딧 차감                                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## TODO 서버-1: API 스펙 설계

### 필수 엔드포인트

| 엔드포인트                               | 메서드 | 용도                                |
| ---------------------------------------- | ------ | ----------------------------------- |
| `/v1/anthropic/v1/messages`              | POST   | Anthropic Claude 호출               |
| `/v1/openai/v1/chat/completions`         | POST   | OpenAI GPT 호출                     |
| `/v1/google/v1/models/*/generateContent` | POST   | Google Gemini 호출                  |
| `/health`                                | GET    | 헬스체크 + 서버 시간                |
| `/v1/user/info`                          | GET    | 유저 크레딧/구독 정보 (앱에서 호출) |

### 인증 방식

```
Authorization: Bearer <ANYON_PRO_API_KEY>
```

API 키 형식 예시: `anyon_pro_xxxxxxxxxxxxxxxxxxxxxxxx`

### 응답 스키마

#### `/v1/user/info` 응답 (앱 호환)

```json
{
  "usedCredits": 150,
  "totalCredits": 1000,
  "budgetResetDate": "2025-03-01T00:00:00Z",
  "userId": "user_abc1234",
  "isTrial": false,
  "subscription": {
    "status": "active",
    "plan": "pro",
    "expiresAt": "2025-03-01T00:00:00Z"
  }
}
```

#### 쿼터 초과 시 에러

```json
HTTP 429 Too Many Requests
{
  "error": {
    "type": "quota_exceeded",
    "message": "Monthly credit limit exceeded",
    "usedCredits": 1000,
    "totalCredits": 1000,
    "resetDate": "2025-03-01T00:00:00Z"
  }
}
```

앱에서 이 에러를 인식하여 "크레딧 소진" UI 표시 (기존 Anyon 로직 재활용).

---

## TODO 서버-2: 데이터베이스 스키마

### users 테이블

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(64) UNIQUE NOT NULL,  -- anyon_pro_xxx...
  created_at TIMESTAMP DEFAULT NOW()
);
```

### subscriptions 테이블

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan VARCHAR(50) NOT NULL,  -- 'trial', 'pro', 'enterprise'
  status VARCHAR(20) NOT NULL,  -- 'active', 'expired', 'cancelled'
  credits_total INT NOT NULL DEFAULT 1000,
  credits_used INT NOT NULL DEFAULT 0,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### usage_logs 테이블

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,  -- 'anthropic', 'openai', 'google'
  model VARCHAR(100) NOT NULL,
  input_tokens INT NOT NULL,
  output_tokens INT NOT NULL,
  cost_usd DECIMAL(10, 6),  -- 실제 비용 (선택)
  credits_charged INT NOT NULL,
  request_id VARCHAR(64),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## TODO 서버-3: 프록시 로직 구현

### 의사코드

```typescript
async function handleLLMRequest(req: Request) {
  // 1. 인증
  const apiKey = extractBearerToken(req.headers.authorization);
  const user = await validateApiKey(apiKey);
  if (!user) {
    return errorResponse(401, "Invalid API key");
  }

  // 2. 구독 확인
  const subscription = await getActiveSubscription(user.id);
  if (!subscription || subscription.status !== "active") {
    return errorResponse(403, "No active subscription");
  }

  // 3. 쿼터 확인
  if (subscription.credits_used >= subscription.credits_total) {
    return errorResponse(429, "Quota exceeded", {
      usedCredits: subscription.credits_used,
      totalCredits: subscription.credits_total,
      resetDate: subscription.period_end,
    });
  }

  // 4. 프로바이더 라우팅
  const provider = parseProvider(req.url); // /v1/anthropic/... → "anthropic"
  const upstreamUrl = buildUpstreamUrl(provider, req.url);

  // 5. SLIT API 키 주입
  const slitApiKey = getSlitApiKey(provider); // 환경변수에서

  // 6. 업스트림 호출
  const response = await fetch(upstreamUrl, {
    method: req.method,
    headers: {
      ...req.headers,
      Authorization: `Bearer ${slitApiKey}`,
      "X-Request-Id": generateRequestId(),
    },
    body: req.body,
  });

  // 7. 사용량 추적
  const usage = extractUsage(response); // 응답에서 토큰 수 추출
  const credits = calculateCredits(usage);
  await recordUsage(user.id, provider, usage, credits);
  await updateSubscriptionCredits(subscription.id, credits);

  // 8. 응답 반환
  return response;
}
```

### 스트리밍 처리

LLM 응답은 대부분 SSE (Server-Sent Events) 스트리밍:

```typescript
async function handleStreamingRequest(req, res) {
  const upstreamResponse = await fetch(upstreamUrl, { ... });

  // 스트림 파이프
  const reader = upstreamResponse.body.getReader();
  let totalTokens = { input: 0, output: 0 };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    // 클라이언트에 청크 전달
    res.write(value);

    // 마지막 청크에서 사용량 추출
    const chunk = decodeChunk(value);
    if (chunk.usage) {
      totalTokens = chunk.usage;
    }
  }

  // 스트림 종료 후 사용량 기록
  await recordUsage(user.id, provider, totalTokens, ...);
  res.end();
}
```

---

## TODO 서버-4: 크레딧 시스템 설계

### 크레딧 계산 공식

```typescript
function calculateCredits(
  usage: { inputTokens: number; outputTokens: number },
  provider: string,
): number {
  // 토큰 → 크레딧 변환 (예시)
  // 1 크레딧 ≈ $0.001 가치로 설정

  const rates = {
    anthropic: { input: 0.003, output: 0.015 }, // Claude Sonnet
    openai: { input: 0.005, output: 0.015 }, // GPT-4
    google: { input: 0.00125, output: 0.005 }, // Gemini Pro
  };

  const rate = rates[provider];
  const costUsd =
    (usage.inputTokens * rate.input + usage.outputTokens * rate.output) / 1000;

  // $0.001 = 1 크레딧
  return Math.ceil(costUsd * 1000);
}
```

### 구독 티어

| 플랜       | 월 크레딧 | 가격 (예시) |
| ---------- | --------- | ----------- |
| Trial      | 100       | 무료 (1회)  |
| Pro        | 1,000     | $10/월      |
| Pro Plus   | 5,000     | $40/월      |
| Enterprise | 무제한    | 문의        |

---

## TODO 서버-5: 결제 연동 (pay.any-on.dev)

### Stripe 웹훅 플로우

```
1. 유저가 pay.any-on.dev에서 결제
2. Stripe 웹훅 → 서버
3. 서버가:
   - users 테이블에 유저 생성 (또는 조회)
   - API 키 발급 (anyon_pro_xxx...)
   - subscriptions 테이블에 구독 생성
4. 결제 완료 페이지에서 딥링크:
   anyon://pro-return?key=<API_KEY>
5. 앱이 키 저장 → Pro 활성화
```

### 웹훅 핸들러

```typescript
app.post("/webhook/stripe", async (req, res) => {
  const event = verifyStripeSignature(req);

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const email = session.customer_email;

      // 유저 + 구독 생성
      const user = await createOrGetUser(email);
      const apiKey = generateApiKey(); // anyon_pro_xxx...
      await updateUserApiKey(user.id, apiKey);
      await createSubscription(user.id, session);

      // 결제 완료 페이지에서 사용할 키 저장
      await storeKeyForRedirect(session.id, apiKey);
      break;

    case "customer.subscription.deleted":
      await cancelSubscription(event.data.object);
      break;

    case "invoice.payment_failed":
      await suspendSubscription(event.data.object);
      break;
  }

  res.json({ received: true });
});
```

---

## TODO 서버-6: 배포

### 기술 스택 추천

| 컴포넌트   | 추천                                      |
| ---------- | ----------------------------------------- |
| 런타임     | Node.js / Bun / Go                        |
| 프레임워크 | Hono / Fastify / Fiber                    |
| DB         | PostgreSQL (Supabase / Neon)              |
| 캐시       | Redis (API 키 캐싱)                       |
| 호스팅     | Cloudflare Workers / Vercel Edge / Fly.io |

### 환경변수

```env
# SLIT의 LLM API 키들
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
GOOGLE_API_KEY=xxx

# DB
DATABASE_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# 서버
PORT=3000
```

### 모니터링

- 요청/응답 로깅
- 에러 알림 (Sentry, PagerDuty)
- 비용 대시보드 (일별 LLM API 비용)

---

## 검증 체크리스트

```
API 검증:
- [ ] curl -H "Authorization: Bearer test_key" https://engine.any-on.dev/health
- [ ] 유효 키로 /v1/user/info 호출 → 크레딧 정보 반환
- [ ] 무효 키 → 401

LLM 프록시 검증:
- [ ] Anthropic 요청 → Claude 응답
- [ ] OpenAI 요청 → GPT 응답
- [ ] 사용량이 DB에 기록됨
- [ ] 크레딧 차감됨

쿼터 검증:
- [ ] 크레딧 소진 시 429 반환
- [ ] 앱에서 "크레딧 소진" UI 표시

결제 검증:
- [ ] Stripe 결제 완료 → 웹훅 수신
- [ ] API 키 발급 → 딥링크로 앱에 전달
- [ ] 앱에서 Pro 활성화됨
```

---

## 타임라인

```
Day 1-2:
  - DB 스키마 생성
  - 기본 API 엔드포인트 (/health, /v1/user/info)
  - API 키 인증 미들웨어

Day 3-4:
  - LLM 프록시 구현 (Anthropic, OpenAI)
  - 스트리밍 처리
  - 사용량 추적

Day 5:
  - Stripe 웹훅 연동
  - 결제 완료 → 키 발급 플로우
  - E2E 테스트
```
