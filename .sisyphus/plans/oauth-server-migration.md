# OAuth Server Migration & Vercel Integration Plan

> **목표**: `oauth.dyad.sh` / `supabase-oauth.dyad.sh` 의존성 완전 제거하고, 자체 OAuth 프록시 서버 구축. Vercel OAuth 원클릭 로그인 추가.

---

## 1. 현재 아키텍처 (AS-IS)

```
[Dyad Electron App]
    ├── Neon 연결     → oauth.dyad.sh/api/integrations/neon/login
    ├── Supabase 연결 → supabase-oauth.dyad.sh/api/connect-supabase/login  
    └── Vercel 연결   → 수동 토큰 입력 (OAuth 없음)

[oauth.dyad.sh] (외부 서버 - 코드 없음)
    ├── POST /api/integrations/neon/login      → Neon OAuth 시작
    ├── POST /api/integrations/neon/refresh     → Neon 토큰 갱신
    ├── POST /api/connect-supabase/login        → Supabase OAuth 시작
    └── POST /api/connect-supabase/refresh      → Supabase 토큰 갱신
```

### 교체해야 할 URL 목록 (8곳)

| 파일 | 현재 URL | 용도 |
|------|----------|------|
| `src/components/NeonConnector.tsx:67` | `oauth.dyad.sh/api/integrations/neon/login` | Neon 로그인 시작 |
| `src/components/SupabaseConnector.tsx:145` | `supabase-oauth.dyad.sh/api/connect-supabase/login` | Supabase 로그인 시작 |
| `src/components/SupabaseHubConnector.tsx:89` | `supabase-oauth.dyad.sh/api/connect-supabase/login` | Supabase Hub 로그인 |
| `src/neon_admin/neon_management_client.ts:44` | `oauth.dyad.sh/api/integrations/neon/refresh` | Neon 토큰 갱신 |
| `src/supabase_admin/supabase_management_client.ts:125` | `supabase-oauth.dyad.sh/api/connect-supabase/refresh` | Supabase 토큰 갱신 |
| `src/supabase_admin/supabase_management_client.ts:254` | `supabase-oauth.dyad.sh/api/connect-supabase/refresh` | Supabase 토큰 갱신 (2) |
| `src/ipc/handlers/neon_handlers.ts:208` | `oauth.dyad.sh/api/integrations/neon/login` | Neon fake connect URL |
| `src/ipc/handlers/supabase_handlers.ts:271` | `supabase-oauth.dyad.sh/api/connect-supabase/login` | Supabase fake connect URL |

---

## 2. 목표 아키텍처 (TO-BE)

```
[포크된 Electron App]
    ├── Neon 연결     → {OUR_SERVER}/api/oauth/neon/login
    ├── Supabase 연결 → {OUR_SERVER}/api/oauth/supabase/login
    ├── Vercel 연결   → {OUR_SERVER}/api/oauth/vercel/login     ← 신규!
    └── dyad:// deep link 처리 (기존과 동일)

[/server 디렉토리] (이 레포에 추가)
    ├── /api/oauth/neon/login          → Neon OAuth 시작
    ├── /api/oauth/neon/callback       → Neon OAuth 콜백
    ├── /api/oauth/neon/refresh        → Neon 토큰 갱신
    ├── /api/oauth/supabase/login      → Supabase OAuth 시작
    ├── /api/oauth/supabase/callback   → Supabase OAuth 콜백
    ├── /api/oauth/supabase/refresh    → Supabase 토큰 갱신
    ├── /api/oauth/vercel/login        → Vercel OAuth 시작     ← 신규!
    ├── /api/oauth/vercel/callback     → Vercel OAuth 콜백     ← 신규!
    └── /api/oauth/vercel/refresh      → Vercel 토큰 갱신      ← 신규!
```

---

## 3. OAuth 플로우 (공통 패턴)

```
사용자                Electron App           우리 서버              Provider (Neon/Supabase/Vercel)
  │                      │                      │                         │
  │ "Connect" 클릭       │                      │                         │
  │─────────────────────>│                      │                         │
  │                      │ openExternalUrl()    │                         │
  │                      │─────────────────────>│                         │
  │                      │                      │ OAuth 시작               │
  │                      │                      │────────────────────────>│
  │                      │                      │                         │
  │ <───────── 브라우저에서 Provider 로그인 ──────────────────────────────>│
  │                      │                      │                         │
  │                      │                      │ callback (?code=...)     │
  │                      │                      │<────────────────────────│
  │                      │                      │                         │
  │                      │                      │ code → token 교환       │
  │                      │                      │────────────────────────>│
  │                      │                      │                         │
  │                      │                      │ access_token 수신       │
  │                      │                      │<────────────────────────│
  │                      │                      │                         │
  │                      │ dyad://xxx-oauth-return?token=...              │
  │                      │<─────────────────────│                         │
  │                      │                      │                         │
  │                      │ 토큰 저장 + UI 갱신  │                         │
  │<─────────────────────│                      │                         │
```

---

## 4. 서버 구현 상세 설계

### 4.1 기술 스택 (추천)

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | **Next.js (App Router)** | API Routes로 충분, Vercel 배포 편리 |
| 런타임 | Node.js | Neon/Supabase/Vercel SDK 모두 Node.js 지원 |
| 배포 | Vercel 또는 자체 서버 | Vercel이면 무료 + 빠른 배포 |
| 위치 | `/server` 디렉토리 | 모노레포 내 별도 프로젝트 |

### 4.2 필요한 환경변수

```env
# 서버 도메인 (deep link redirect용)
OAUTH_SERVER_URL=https://oauth.yourcompany.com

# Neon OAuth App
NEON_CLIENT_ID=xxx
NEON_CLIENT_SECRET=xxx

# Supabase OAuth App  
SUPABASE_CLIENT_ID=xxx
SUPABASE_CLIENT_SECRET=xxx

# Vercel OAuth App (Sign in with Vercel)
VERCEL_CLIENT_ID=xxx
VERCEL_CLIENT_SECRET=xxx
```

### 4.3 Provider별 OAuth 설정 필요사항

#### Neon
- Neon Console → Settings → OAuth Applications → 앱 생성
- Redirect URI: `{OAUTH_SERVER_URL}/api/oauth/neon/callback`

#### Supabase  
- Supabase Dashboard → Organization → OAuth Applications → 앱 생성
- Redirect URI: `{OAUTH_SERVER_URL}/api/oauth/supabase/callback`

#### Vercel (신규)
- Vercel Dashboard → Settings → OAuth Apps → 앱 생성
- Authorization Endpoint: `https://vercel.com/oauth/authorize`
- Token Endpoint: `https://api.vercel.com/login/oauth/token`
- Redirect URI: `{OAUTH_SERVER_URL}/api/oauth/vercel/callback`
- Scopes: `openid email profile offline_access user team project deployment`
- PKCE 필수: `code_challenge_method=S256`

### 4.4 API 엔드포인트 설계

#### `/api/oauth/[provider]/login` (GET)
```
역할: OAuth 시작. Provider의 Authorization URL로 리다이렉트
파라미터: 없음 (state, PKCE는 서버에서 생성)
응답: 302 Redirect → Provider OAuth 페이지

플로우:
1. state, nonce, code_verifier 생성
2. 쿠키/세션에 저장
3. Provider authorization URL로 리다이렉트
```

#### `/api/oauth/[provider]/callback` (GET)  
```
역할: Provider가 code를 보내주면, token으로 교환 후 Deep Link로 리다이렉트
파라미터: ?code=xxx&state=xxx
응답: 302 Redirect → dyad://[provider]-oauth-return?token=xxx&refreshToken=xxx&expiresIn=xxx

플로우:
1. state 검증
2. code → token 교환 (Provider Token Endpoint 호출)
3. dyad://[provider]-oauth-return?token=...&refreshToken=...&expiresIn=... 로 리다이렉트
```

#### `/api/oauth/[provider]/refresh` (POST)
```
역할: Refresh Token으로 새 Access Token 발급
Body: { refreshToken: "xxx" }
응답: { accessToken: "xxx", refreshToken: "xxx", expiresIn: 3600 }

플로우:
1. refreshToken으로 Provider Token Endpoint 호출 (grant_type=refresh_token)
2. 새 토큰 쌍 반환
```

---

## 5. 클라이언트 변경 상세

### 5.1 URL 교체 (설정 기반)

```typescript
// 새 파일: src/lib/oauthConfig.ts
export const OAUTH_SERVER_URL = process.env.OAUTH_SERVER_URL || "https://oauth.yourcompany.com";

export const oauthEndpoints = {
  neon: {
    login: `${OAUTH_SERVER_URL}/api/oauth/neon/login`,
    refresh: `${OAUTH_SERVER_URL}/api/oauth/neon/refresh`,
  },
  supabase: {
    login: `${OAUTH_SERVER_URL}/api/oauth/supabase/login`,
    refresh: `${OAUTH_SERVER_URL}/api/oauth/supabase/refresh`,
  },
  vercel: {
    login: `${OAUTH_SERVER_URL}/api/oauth/vercel/login`,
    refresh: `${OAUTH_SERVER_URL}/api/oauth/vercel/refresh`,
  },
} as const;
```

### 5.2 Vercel Deep Link 핸들러 추가 (main.ts)

```typescript
// main.ts에 추가
if (parsed.hostname === "vercel-oauth-return") {
  const token = parsed.searchParams.get("token");
  const refreshToken = parsed.searchParams.get("refreshToken");
  const expiresIn = Number(parsed.searchParams.get("expiresIn"));
  if (!token || !refreshToken || !expiresIn) {
    dialog.showErrorBox("Invalid URL", "Expected token, refreshToken, and expiresIn");
    return;
  }
  handleVercelOAuthReturn({ token, refreshToken, expiresIn });
  mainWindow?.webContents.send("deep-link-received", {
    type: parsed.hostname,
  });
  return;
}
```

### 5.3 Vercel 토큰 저장 방식 변경

```
현재: vercelAccessToken (수동 입력, refresh 없음)
목표: vercel.accessToken + vercel.refreshToken + vercel.expiresIn + vercel.tokenTimestamp
      (Neon/Supabase와 동일 패턴)
```

### 5.4 새 컴포넌트: VercelHubConnector

NeonConnector / SupabaseHubConnector와 동일 패턴으로 Hub 페이지에 추가.

### 5.5 기존 VercelConnector 수정

수동 토큰 입력 제거 → OAuth 연결 상태 확인하여 자동으로 토큰 사용.

---

## 6. 구현 단계 (Phase별)

### Phase 1: 서버 기본 구조 (2-3일)
```
[ ] /server 프로젝트 초기화 (Next.js)
[ ] 공통 OAuth 유틸리티 작성 (state 생성, PKCE, token 교환)
[ ] 환경변수 설정 구조
[ ] 로컬 개발 환경 (ngrok 또는 localhost)
```

### Phase 2: Neon OAuth 이관 (1-2일)
```
[ ] /api/oauth/neon/login 구현
[ ] /api/oauth/neon/callback 구현
[ ] /api/oauth/neon/refresh 구현
[ ] 클라이언트 URL 교체 (NeonConnector, neon_management_client)
[ ] 동작 검증
```

### Phase 3: Supabase OAuth 이관 (1-2일)
```
[ ] /api/oauth/supabase/login 구현
[ ] /api/oauth/supabase/callback 구현
[ ] /api/oauth/supabase/refresh 구현
[ ] 클라이언트 URL 교체 (SupabaseConnector, SupabaseHubConnector, supabase_management_client)
[ ] 동작 검증
```

### Phase 4: Vercel OAuth 신규 구현 (2-3일)
```
[ ] Vercel OAuth App 등록 (vercel.com/account/settings)
[ ] /api/oauth/vercel/login 구현 (PKCE 필수)
[ ] /api/oauth/vercel/callback 구현
[ ] /api/oauth/vercel/refresh 구현
[ ] main.ts에 vercel-oauth-return deep link 핸들러 추가
[ ] vercel_return_handler.ts 생성
[ ] settings 스키마에 vercel OAuth 토큰 필드 추가
[ ] VercelHubConnector 컴포넌트 생성 (Hub 페이지용)
[ ] Hub 페이지에 VercelHubConnector 추가
[ ] 기존 VercelConnector를 OAuth 토큰 연동으로 수정
[ ] 동작 검증 (로그인 → 프로젝트 생성 → 배포)
```

### Phase 5: 정리 및 테스트 (1-2일)
```
[ ] oauthConfig.ts로 URL 중앙 관리
[ ] oauth.dyad.sh / supabase-oauth.dyad.sh 참조 완전 제거 확인
[ ] E2E 테스트 업데이트
[ ] 서버 배포 (Vercel 또는 자체 인프라)
[ ] 전체 통합 테스트
```

---

## 7. 리스크 및 주의사항

| 리스크 | 대응 |
|--------|------|
| Neon/Supabase OAuth App 생성 권한 필요 | 각 Provider 대시보드에서 OAuth App 등록 필요 |
| Vercel PKCE 필수 | 서버에서 code_verifier/code_challenge 관리 필요 |
| Deep Link 프로토콜 (`dyad://`) 변경 여부 | 자사 브랜드명으로 변경 필요할 수 있음 (예: `yourapp://`) |
| 토큰 암호화 호환성 | 기존 Electron safeStorage 패턴 유지 |
| Vercel OAuth scope 범위 | `deployment` scope가 배포 권한 포함하는지 확인 필요 |
| 기존 수동 토큰 사용자 마이그레이션 | 기존 vercelAccessToken 있으면 그대로 사용, 새로 연결 시 OAuth |

---

## 8. 파일 구조 (TO-BE)

```
/server/                              ← 신규 OAuth 프록시 서버
  ├── package.json
  ├── next.config.js
  ├── .env.example
  └── app/
      └── api/
          └── oauth/
              ├── neon/
              │   ├── login/route.ts
              │   ├── callback/route.ts
              │   └── refresh/route.ts
              ├── supabase/
              │   ├── login/route.ts
              │   ├── callback/route.ts
              │   └── refresh/route.ts
              └── vercel/
                  ├── login/route.ts
                  ├── callback/route.ts
                  └── refresh/route.ts

/src/                                  ← 기존 Electron 앱 (수정)
  ├── lib/oauthConfig.ts               ← 신규: OAuth URL 중앙 관리
  ├── main.ts                          ← 수정: vercel-oauth-return 핸들러 추가
  ├── vercel_admin/                    ← 신규
  │   ├── vercel_return_handler.ts
  │   └── vercel_management_client.ts  ← 기존 vercel_handlers에서 분리
  ├── components/
  │   └── VercelHubConnector.tsx        ← 신규: Hub 페이지용
  ├── pages/
  │   └── hub.tsx                       ← 수정: VercelHubConnector 추가
  └── db/
      └── schema.ts                    ← 수정: vercel 관련 컬럼 추가 (필요시)
```

---

## 9. 예상 소요 시간

| Phase | 작업 | 소요 |
|-------|------|------|
| 1 | 서버 기본 구조 | 2-3일 |
| 2 | Neon OAuth 이관 | 1-2일 |
| 3 | Supabase OAuth 이관 | 1-2일 |
| 4 | Vercel OAuth 신규 | 2-3일 |
| 5 | 정리 및 테스트 | 1-2일 |
| **합계** | | **7-12일** |

---

*Plan created: 2025-02-06*
*Status: DRAFT - 검토 후 구현 시작*
