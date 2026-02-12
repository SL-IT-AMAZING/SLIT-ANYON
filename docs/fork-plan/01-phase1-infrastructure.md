# Phase 1: 인프라 연결

> 우선순위: P0
> 예상 공수: 1-2일
> 의존성: SLIT 프록시 서버가 준비되어야 완전 테스트 가능

## 개요

ANYON은 OpenCode CLI를 통해 LLM을 호출한다. SLIT 프록시 서버를 경유하도록 설정하여:

1. 유저 인증 (ANYON Pro API 키)
2. 사용량 추적
3. 구독 티어별 쿼터 관리

```
현재 ANYON 구조:
  앱 → OpenCode CLI → 직접 LLM 프로바이더 (유저 API 키)

목표 구조:
  앱 → OpenCode CLI → SLIT 프록시 (engine.any-on.dev)
                           ├── 유저 인증
                           ├── 사용량 추적
                           └── LLM 프로바이더 (SLIT API 키)
```

---

## TODO 1A: OpenCode 프로바이더 설정

> 난이도: 중간 | 공수: 4-6시간 | 의존성: SLIT 프록시 서버 URL 확정

### 방법 1: 환경변수로 기본 프로바이더 URL 오버라이드

OpenCode는 프로바이더별로 base URL을 환경변수로 오버라이드할 수 있다.

- [ ] `src/ipc/utils/opencode_server.ts` 수정

  ```typescript
  // 현재 (라인 162-167)
  this.process = spawn(opencodePath, args, {
    env: {
      ...process.env,
      OPENCODE_SERVER_USERNAME: "opencode",
      OPENCODE_SERVER_PASSWORD: password,
    },
    // ...
  });

  // 변경: SLIT 프록시 URL 추가
  this.process = spawn(opencodePath, args, {
    env: {
      ...process.env,
      OPENCODE_SERVER_USERNAME: "opencode",
      OPENCODE_SERVER_PASSWORD: password,
      // SLIT 프록시 URL 설정
      ANTHROPIC_BASE_URL: "https://engine.any-on.dev/v1/anthropic",
      OPENAI_BASE_URL: "https://engine.any-on.dev/v1/openai",
      // 또는 단일 엔드포인트 사용 시:
      // OPENCODE_PROXY_URL: "https://engine.any-on.dev",
    },
    // ...
  });
  ```

### 방법 2: ANYON Pro 전용 프로바이더 추가

OpenCode에 "anyon" 또는 "slit" 프로바이더를 커스텀 추가:

- [ ] `src/ipc/utils/opencode_config_setup.ts` 수정
  - ANYON Pro 활성화 시 `~/.config/opencode/config.json`에 SLIT 프록시 설정 추가
  - 비활성화 시 제거

### 방법 3: 앱 설정에서 동적 주입

- [ ] `src/lib/schemas.ts`의 UserSettings에 ANYON Pro API 키 필드 확인
  - 기존 `enableAnyonPro` → `enableAnyonPro`로 리네이밍 (Phase 2)
  - 기존 `providerSettings.auto.apiKey` → ANYON Pro API 키 저장 위치

### 권장 접근법

**방법 1 (환경변수)** 추천:

- 가장 간단하고 OpenCode 내부 수정 불필요
- SLIT 프록시가 모든 프로바이더를 단일 엔드포인트로 처리하면 더 깔끔

---

## TODO 1B: ANYON Pro 활성화 플로우

> 난이도: 중간 | 공수: 2-4시간 | 의존성: 결제 포탈 (pay.any-on.dev)

### 현재 Anyon Pro 플로우 (참고용)

```
1. 유저가 "Get Pro" 클릭
2. 브라우저에서 academy.anyon.sh/checkout 열림
3. 결제 완료
4. anyon://anyon-pro-return?key=<API_KEY> 딥링크로 앱에 전달
5. 앱이 키 저장 + Pro 활성화
```

### ANYON Pro 플로우

```
1. 유저가 "Get ANYON Pro" 클릭
2. 브라우저에서 pay.any-on.dev/checkout 열림
3. 결제 완료
4. anyon://pro-return?key=<API_KEY> 딥링크로 앱에 전달
5. 앱이 키 저장 + Pro 활성화
6. OpenCode에 SLIT 프록시 설정 주입
```

### 변경 파일

- [ ] `src/main/pro.ts` — `handleAnyonProReturn()` → `handleAnyonProReturn()`
  - 딥링크 hostname: `"anyon-pro-return"` → `"pro-return"`
  - API 키 저장 로직 유지

- [ ] `src/main.ts` — 딥링크 라우팅 (라인 441+)

  ```typescript
  // 현재
  if (parsed.hostname === "anyon-pro-return") { ... }

  // 변경
  if (parsed.hostname === "pro-return") { ... }
  ```

- [ ] API 키 저장 위치 확인
  - `src/lib/schemas.ts`의 `UserSettingsSchema` 내 `providerSettings.auto.apiKey`
  - 이 키가 OpenCode에 전달되어야 함

---

## TODO 1C: 딥링크 프로토콜 변경

> 난이도: 쉬움 | 공수: 1-2시간 | 의존성: 없음

`anyon://` → `anyon://` 전체 교체.

### Electron 앱 (프로토콜 등록)

- [ ] `forge.config.ts` (라인 75-76)

  ```typescript
  // 현재
  protocols: [{ name: "Anyon", schemes: ["anyon"] }];

  // 변경
  protocols: [{ name: "ANYON", schemes: ["anyon"] }];
  ```

- [ ] `forge.config.ts` — MakerDeb 설정

  ```typescript
  // 현재
  mimeType: ["x-scheme-handler/anyon"];

  // 변경
  mimeType: ["x-scheme-handler/anyon"];
  ```

- [ ] `src/main.ts` (라인 81, 86)

  ```typescript
  // 현재
  app.setAsDefaultProtocolClient("anyon", ...)

  // 변경
  app.setAsDefaultProtocolClient("anyon", ...)
  ```

- [ ] `src/main.ts` (라인 441, 444)

  ```typescript
  // 현재
  if (parsed.protocol !== "anyon:")

  // 변경
  if (parsed.protocol !== "anyon:")
  ```

### OAuth 콜백 (server/)

- [ ] `server/app/api/oauth/neon/callback/route.ts` (라인 30)

  ```typescript
  // 현재
  redirect(`anyon://neon-oauth-return?...`);

  // 변경
  redirect(`anyon://neon-oauth-return?...`);
  ```

- [ ] `server/app/api/oauth/supabase/callback/route.ts` (라인 30)
- [ ] `server/app/api/oauth/vercel/callback/route.ts` (라인 36)

---

## TODO 1D: API 서버 연동 (선택)

> 난이도: 낮음 | 공수: 1시간 | 의존성: api.any-on.dev 서버

Anyon 오리지널에서 `api.anyon.sh`가 하던 역할:

1. `/v1/user/info` — Pro 유저 크레딧/예산 조회
2. `/health` — 서버 시간 (무료 쿼터 치트 방지)
3. `/v1/templates` — 프로젝트 템플릿 목록

ANYON에서:

- 1번은 SLIT 프록시에서 처리 (engine.any-on.dev)
- 2번은 유지하려면 api.any-on.dev/health 필요
- 3번은 자체 템플릿 레포로 대체

### 변경 파일 (나중에)

- [ ] `src/ipc/handlers/free_agent_quota_handlers.ts` — 서버 시간 URL
- [ ] `src/ipc/utils/template_utils.ts` — 템플릿 API URL

---

## 검증 체크리스트

```
프로토콜 검증:
- [ ] 터미널에서: open "anyon://test" → 앱 활성화
- [ ] Pro 리턴: open "anyon://pro-return?key=test123" → 키 저장

Pro 플로우 검증:
- [ ] "Get ANYON Pro" 클릭 → pay.any-on.dev 열림
- [ ] 결제 완료 → 앱에 키 전달됨
- [ ] Pro 상태 표시됨

OpenCode 연결 검증:
- [ ] Pro 활성화 후 채팅 전송
- [ ] SLIT 프록시로 요청이 가는지 로그 확인
```
