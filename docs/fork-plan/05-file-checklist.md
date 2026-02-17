# 파일별 변경 체크리스트 (ANYON)

> 전체 Phase 1-4의 파일 변경 사항을 **파일 단위**로 정리.
> 같은 파일에 여러 Phase의 변경이 겹치면 한 번에 처리.

---

## 범례

- **P0**: Phase 1 (인프라 연결) — 차단. 없으면 서비스 불가
- **P1**: Phase 2-3 (브랜딩/빌드) — 런치 필수
- **P2+**: Phase 4 (선택적 정리) — 점진적 처리

---

## 빌드/설정 파일 (루트)

### forge.config.ts

| Phase | 변경 내용                                                               |
| ----- | ----------------------------------------------------------------------- |
| P0    | `schemes: ["anyon"]` → `["anyon"]`                                      |
| P0    | `name: "Anyon"` → `"ANYON"`                                             |
| P0    | `mimeType: ["x-scheme-handler/anyon"]` → `anyon`                        |
| P1    | publisher `owner: "anyon-sh"` → `"SL-IT-AMAZING"`, `name: "SLIT-ANYON"` |
| P1    | `iconUrl` → 자체 아이콘 URL                                             |

### package.json

| Phase | 변경 내용                                   |
| ----- | ------------------------------------------- |
| P1    | `"name": "anyon"` → `"anyon"`               |
| P1    | `"productName": "anyon"` → `"ANYON"`        |
| P1    | repository URL → `SL-IT-AMAZING/SLIT-ANYON` |

### index.html

| Phase | 변경 내용                                       |
| ----- | ----------------------------------------------- |
| P1    | `<title>Anyon</title>` → `<title>ANYON</title>` |

---

## 메인 프로세스 (src/)

### main.ts

| Phase | 변경 내용                                                           | 라인    |
| ----- | ------------------------------------------------------------------- | ------- |
| P0    | `app.setAsDefaultProtocolClient("anyon")` → `anyon`                 | 81, 86  |
| P0    | `parsed.protocol !== "anyon:"` → `anyon:`                           | 441     |
| P0    | 에러 메시지 `Expected anyon://` → `anyon://`                        | 444     |
| P1    | 자동 업데이트 `repo: "anyon-sh/anyon"` → `SL-IT-AMAZING/SLIT-ANYON` | 145-154 |
| P1    | `host` URL 제거 (GitHub Releases 사용)                              | 145-154 |

### main/pro.ts

| Phase | 변경 내용                                                  |
| ----- | ---------------------------------------------------------- |
| P0    | `handleAnyonProReturn()` → `handleAnyonProReturn()` (선택) |
| P0    | 딥링크 hostname `"anyon-pro-return"` → `"pro-return"`      |

---

## OpenCode 연결 (src/ipc/utils/)

### opencode_server.ts

| Phase | 변경 내용                                                      | 라인    |
| ----- | -------------------------------------------------------------- | ------- |
| P0    | 환경변수에 SLIT 프록시 URL 추가                                | 162-167 |
|       | `ANTHROPIC_BASE_URL: "https://engine.any-on.dev/v1/anthropic"` |         |
|       | `OPENAI_BASE_URL: "https://engine.any-on.dev/v1/openai"`       |         |

### opencode_config_setup.ts

| Phase | 변경 내용                                   |
| ----- | ------------------------------------------- |
| P0    | ANYON Pro 활성화 시 프록시 설정 주입 (선택) |

### llm_engine_provider.ts

| Phase | 변경 내용                                          |
| ----- | -------------------------------------------------- |
| P2+   | `X-Anyon-Request-Id` 헤더명 → `X-Anyon-Request-Id` |

### git_author.ts

| Phase | 변경 내용                                    |
| ----- | -------------------------------------------- |
| P2+   | `name: "[anyon]"` → `"[anyon]"`              |
| P2+   | `email: "git@anyon.sh"` → `"git@any-on.dev"` |

---

## IPC 핸들러 (src/ipc/handlers/)

### pro_handlers.ts

| Phase | 변경 내용                                          | 라인 |
| ----- | -------------------------------------------------- | ---- |
| P0    | (프록시 사용 시) URL 변경 불필요 — OpenCode가 처리 |      |
| P1    | "Anyon Pro" → "ANYON Pro" 에러 메시지              | 44   |

### free_agent_quota_handlers.ts

| Phase | 변경 내용                                              | 라인 |
| ----- | ------------------------------------------------------ | ---- |
| P0    | `api.anyon.sh/health` → `api.any-on.dev/health` (선택) | 34   |

### help_bot_handlers.ts

| Phase | 변경 내용                                   | 라인 |
| ----- | ------------------------------------------- | ---- |
| P1    | `helpchat.anyon.sh/v1` → 제거 또는 자체 URL | 48   |

### release_note_handlers.ts

| Phase | 변경 내용                            | 라인 |
| ----- | ------------------------------------ | ---- |
| P1    | 릴리스 노트 URL → 자체 URL 또는 제거 | 24   |

### app_upgrade_handlers.ts

| Phase | 변경 내용                     | 라인   |
| ----- | ----------------------------- | ------ |
| P1    | 문서 URL → 자체 URL 또는 제거 | 23, 30 |

### createFromTemplate.ts

| Phase | 변경 내용                           |
| ----- | ----------------------------------- |
| P2+   | `"User-Agent": "Anyon"` → `"ANYON"` |

---

## 프롬프트 (src/prompts/)

### system_prompt.ts

| Phase | 변경 내용                                               |
| ----- | ------------------------------------------------------- |
| P1    | "You are Anyon" → "You are ANYON"                       |
| P1    | "Anyon Environment" → "ANYON Environment"               |
| P1    | "working inside **Anyon**" → "working inside **ANYON**" |

### local_agent_prompt.ts

| Phase | 변경 내용                                       |
| ----- | ----------------------------------------------- |
| P1    | "You are Anyon, an AI assistant" (x2) → "ANYON" |

### plan_mode_prompt.ts

| Phase | 변경 내용                             |
| ----- | ------------------------------------- |
| P1    | "Anyon Plan Mode" → "ANYON Plan Mode" |

---

## 컴포넌트 (src/components/)

### ProBanner.tsx

| Phase | 변경 내용                                                       |
| ----- | --------------------------------------------------------------- |
| P0    | `academy.anyon.sh/subscription` → `pay.any-on.dev/subscription` |
| P0    | `academy.anyon.sh/settings` → `pay.any-on.dev/settings`         |
| P1    | "Anyon Pro" (x10+) → "ANYON Pro"                                |
| P1    | `anyon.sh/pro` → `any-on.dev/pro`                               |

### AnyonProTrialDialog.tsx

| Phase | 변경 내용                                                           |
| ----- | ------------------------------------------------------------------- |
| P0    | `academy.anyon.sh/redirect-to-checkout` → `pay.any-on.dev/checkout` |
| P1    | "Anyon Pro" → "ANYON Pro"                                           |
| P1    | 파일명 → `AnyonProTrialDialog.tsx` (선택)                           |

### AnyonProSuccessDialog.tsx

| Phase | 변경 내용                                         |
| ----- | ------------------------------------------------- |
| P1    | "Welcome to Anyon Pro!" → "Welcome to ANYON Pro!" |
| P1    | 파일명 → `AnyonProSuccessDialog.tsx` (선택)       |

### chat/ChatInput.tsx

| Phase | 변경 내용                                         |
| ----- | ------------------------------------------------- |
| P1    | "Ask Anyon to build..." → "Ask ANYON to build..." |
| P1    | `anyon.sh/pro` URL → `any-on.dev/pro`             |

### chat/HomeChatInput.tsx

| Phase | 변경 내용                                   |
| ----- | ------------------------------------------- |
| P1    | "Ask Anyon to build" → "Ask ANYON to build" |

### chat/LexicalChatInput.tsx

| Phase | 변경 내용                                         |
| ----- | ------------------------------------------------- |
| P1    | "Ask Anyon to build..." → "Ask ANYON to build..." |

### chat/ChatErrorBox.tsx

| Phase | 변경 내용                                                       |
| ----- | --------------------------------------------------------------- |
| P0    | `academy.anyon.sh/subscription` → `pay.any-on.dev/subscription` |
| P1    | "Anyon Pro" (x8+) → "ANYON Pro"                                 |
| P1    | `anyon.sh/pro` URL → `any-on.dev/pro`                           |
| P1    | `anyon.sh/docs/*` URL → `docs.any-on.dev/*` 또는 제거           |

### chat/FreeAgentQuotaBanner.tsx

| Phase | 변경 내용                             |
| ----- | ------------------------------------- |
| P1    | "Upgrade to Anyon Pro" → "ANYON Pro"  |
| P1    | `anyon.sh/pro` URL → `any-on.dev/pro` |

### chat/PromoMessage.tsx

| Phase | 변경 내용                         |
| ----- | --------------------------------- |
| P1    | "Anyon Pro" → "ANYON Pro"         |
| P1    | `anyon.sh/*` URL → `any-on.dev/*` |
| P1    | Reddit/YouTube/GitHub 링크 → 제거 |

### chat/TokenBar.tsx

| Phase | 변경 내용                                                 |
| ----- | --------------------------------------------------------- |
| P1    | "Anyon Pro's Smart Context" → "ANYON Pro's Smart Context" |
| P1    | `anyon.sh/*` URL → `any-on.dev/*`                         |

### ProModeSelector.tsx

| Phase | 변경 내용                             |
| ----- | ------------------------------------- |
| P1    | "Anyon Pro" (x5) → "ANYON Pro"        |
| P1    | `anyon.sh/pro` URL → `any-on.dev/pro` |

### settings/ProviderSettingsPage.tsx

| Phase | 변경 내용                                     |
| ----- | --------------------------------------------- |
| P1    | "Enable/Toggle/Error Anyon Pro" → "ANYON Pro" |

### settings/ProviderSettingsHeader.tsx

| Phase | 변경 내용                                                        |
| ----- | ---------------------------------------------------------------- |
| P1    | "Manage/Setup Anyon Pro Subscription" → "ANYON Pro Subscription" |

### HelpDialog.tsx

| Phase | 변경 내용                                   |
| ----- | ------------------------------------------- |
| P1    | `upload-logs.anyon.sh` → 제거 또는 자체 URL |
| P1    | `anyon.sh/docs/*` → `docs.any-on.dev/*`     |
| P1    | GitHub Issues 링크 → 제거                   |

### HelpBotDialog.tsx

| Phase | 변경 내용                                 |
| ----- | ----------------------------------------- |
| P1    | "Anyon Help Bot" → "ANYON Help Bot"       |
| P1    | "about using Anyon" → "about using ANYON" |

### ErrorBoundary.tsx

| Phase | 변경 내용                               |
| ----- | --------------------------------------- |
| P1    | "re-opening Anyon" → "re-opening ANYON" |
| P1    | GitHub Issues 링크 → 제거               |

### SetupBanner.tsx

| Phase | 변경 내용                                       |
| ----- | ----------------------------------------------- |
| P1    | "Setup Anyon" → "Setup ANYON"                   |
| P1    | "Anyon Pro free trial" → "ANYON Pro free trial" |
| P1    | `alt="Anyon Logo"` → `alt="ANYON Logo"`         |
| P1    | `anyon.sh/docs/*` URL → `docs.any-on.dev/*`     |

### ReleaseChannelSelector.tsx

| Phase | 변경 내용                         |
| ----- | --------------------------------- |
| P1    | "Restart Anyon" → "Restart ANYON" |
| P1    | 다운로드 페이지 URL → 자체 URL    |

### AutoUpdateSwitch.tsx

| Phase | 변경 내용                         |
| ----- | --------------------------------- |
| P1    | "Restart Anyon" → "Restart ANYON" |

### settings/AzureConfiguration.tsx

| Phase | 변경 내용                                              |
| ----- | ------------------------------------------------------ |
| P1    | "Restart Anyon after changing..." → "Restart ANYON..." |

### app/TitleBar.tsx

| Phase | 변경 내용                               |
| ----- | --------------------------------------- |
| P1    | `alt="Anyon Logo"` → `alt="ANYON Logo"` |

### ContextFilesPicker.tsx

| Phase | 변경 내용                                           |
| ----- | --------------------------------------------------- |
| P1    | "Anyon uses/will use..." → "ANYON uses/will use..." |

### preview_panel/AnnotatorOnlyForPro.tsx

| Phase | 변경 내용                             |
| ----- | ------------------------------------- |
| P1    | "with/Get Anyon Pro" → "ANYON Pro"    |
| P1    | `anyon.sh/pro` URL → `any-on.dev/pro` |

### home/OnboardingBanner.tsx

| Phase | 변경 내용                        |
| ----- | -------------------------------- |
| P1    | YouTube URL → 제거 또는 자체 URL |

### TelemetryBanner.tsx

| Phase | 변경 내용                    |
| ----- | ---------------------------- |
| P1    | 개인정보 정책 URL → 자체 URL |

### 기타 컴포넌트

| 파일                            | Phase | 변경 내용                             |
| ------------------------------- | ----- | ------------------------------------- |
| CommunityCodeConsentDialog.tsx  | P1    | "Anyon community member" → "ANYON..." |
| AppUpgrades.tsx                 | P1    | "Anyon capabilities" → "ANYON..."     |
| CapacitorControls.tsx           | P1    | 문서 URL 변경                         |
| GitHubConnector.tsx             | P1    | 문서 URL 변경                         |
| PortalMigrate.tsx               | P1    | URL 변경                              |
| preview_panel/SecurityPanel.tsx | P1    | 문서 URL 변경                         |

---

## Hooks & Lib

### hooks/useSettings.ts

| Phase | 변경 내용                                                |
| ----- | -------------------------------------------------------- |
| P2+   | `anyonTelemetryConsent` → `anyonTelemetryConsent` (선택) |

### hooks/useStreamChat.ts

| Phase | 변경 내용                          |
| ----- | ---------------------------------- |
| P1    | `app?.name ?? "Anyon"` → `"ANYON"` |

### lib/sentry.ts & lib/sentry-renderer.ts

| Phase | 변경 내용                              |
| ----- | -------------------------------------- |
| P1    | Sentry 비활성화 또는 자체 DSN          |
| P2+   | `release: "anyon@..."` → `"anyon@..."` |

### lib/oauthConfig.ts

| Phase | 변경 내용                                       |
| ----- | ----------------------------------------------- |
| P1    | `OAUTH_SERVER_URL` → `https://oauth.any-on.dev` |

### lib/rollout.ts

| Phase | 변경 내용                     |
| ----- | ----------------------------- |
| P1    | 롤아웃 URL 변경 또는 비활성화 |

### lib/toast.tsx

| Phase | 변경 내용                               |
| ----- | --------------------------------------- |
| P1    | "outside of Anyon" → "outside of ANYON" |

### lib/schemas.ts

| Phase | 변경 내용                                 |
| ----- | ----------------------------------------- |
| P2+   | `isAnyonProEnabled` 등 함수명 변경 (선택) |

---

## Pro 핸들러 (src/pro/)

### pro/main/ipc/handlers/themes_handlers.ts

| Phase | 변경 내용                                        |
| ----- | ------------------------------------------------ |
| P1    | "Anyon Pro is required..." (x2) → "ANYON Pro..." |
| P2+   | `X-Anyon-Request-Id` → `X-Anyon-Request-Id`      |

### pro/main/ipc/handlers/local_agent/local_agent_handler.ts

| Phase | 변경 내용                                         |
| ----- | ------------------------------------------------- |
| P1    | "Agent v2 requires Anyon Pro..." → "ANYON Pro..." |

### pro/main/ipc/handlers/local_agent/tools/engine_fetch.ts

| Phase | 변경 내용                                        |
| ----- | ------------------------------------------------ |
| P1    | "Anyon Pro API key is required" → "ANYON Pro..." |
| P2+   | `X-Anyon-Request-Id` → `X-Anyon-Request-Id`      |

---

## OAuth 서버 (server/)

### server/package.json

| Phase | 변경 내용                                               |
| ----- | ------------------------------------------------------- |
| P1    | `"name": "anyon-oauth-server"` → `"anyon-oauth-server"` |

### server/app/api/oauth/\*/callback/route.ts

| Phase | 변경 내용                                       |
| ----- | ----------------------------------------------- |
| P0    | `anyon://neon-oauth-return` → `anyon://...`     |
| P0    | `anyon://supabase-oauth-return` → `anyon://...` |
| P0    | `anyon://vercel-oauth-return` → `anyon://...`   |

---

## Scaffold

### scaffold/src/components/made-with-anyon.tsx

| Phase | 변경 내용                                       |
| ----- | ----------------------------------------------- |
| P1    | "Made with Anyon" → "Made with ANYON"           |
| P1    | `https://www.anyon.sh/` → `https://any-on.com/` |

### scaffold/package.json & vite.config.ts

| Phase | 변경 내용                                                |
| ----- | -------------------------------------------------------- |
| P2+   | `@anyon-sh/react-vite-component-tagger` → 포크 또는 유지 |

---

## 에셋

### assets/

| Phase | 변경 내용                           |
| ----- | ----------------------------------- |
| P1    | `icon.icns` — ANYON 아이콘으로 교체 |
| P1    | `icon.ico` — ANYON 아이콘으로 교체  |
| P1    | `icon.png` — ANYON 아이콘으로 교체  |

### src/assets/

| Phase | 변경 내용               |
| ----- | ----------------------- |
| P1    | 인앱 로고 이미지들 교체 |

---

## 통계 요약

| 우선순위         | 파일 수 (대략) | 주요 작업                           |
| ---------------- | -------------- | ----------------------------------- |
| P0 (인프라)      | ~10            | 딥링크, OAuth 콜백, OpenCode 프록시 |
| P1 (브랜딩/빌드) | ~50            | UI 텍스트, URL, 아이콘, 패키지      |
| P2+ (선택)       | ~10            | 변수명, 헤더, localStorage 키       |
| **총합**         | **~70**        |                                     |

---

## 작업 순서 권장

```
1단계: P0 (인프라) — 약 10개 파일
   → 딥링크 + OAuth 콜백 변경
   → OpenCode 프록시 설정
   → 서비스 가동 가능 상태

2단계: P1 (브랜딩/빌드) — 약 50개 파일
   → UI 텍스트 일괄 치환 (Anyon → ANYON)
   → URL 일괄 치환 (anyon.sh → any-on.dev)
   → 아이콘 교체
   → 패키지 설정

3단계: 빌드 테스트
   → npm run build && npm run e2e
   → 에러 발생 시 누락 파일 수정

4단계: P2+ (선택) — 점진적
   → 내부 변수명 정리
   → 헤더명, localStorage 키 등
```
