# Phase 2: 브랜딩 교체 (Dyad → ANYON)

> 우선순위: P1
> 예상 공수: 2-3일
> 의존성: Phase 1 완료 후

## 개요

모든 "Dyad" 텍스트와 URL을 "ANYON"으로 교체한다.

| 교체 대상       | 변경           |
| --------------- | -------------- |
| Dyad            | ANYON          |
| Dyad Pro        | ANYON Pro      |
| dyad.sh         | any-on.dev     |
| academy.dyad.sh | pay.any-on.dev |
| dyad://         | anyon://       |

---

## TODO 2A: UI 텍스트 교체

### 2A-1. 윈도우 타이틀

- [ ] `index.html` (라인 5)

  ```html
  <!-- 현재 -->
  <title>Dyad</title>

  <!-- 변경 -->
  <title>ANYON</title>
  ```

### 2A-2. 채팅 플레이스홀더

- [ ] `src/components/chat/ChatInput.tsx` (라인 562)

  ```
  현재: "Ask Dyad to build..."
  변경: "Ask ANYON to build..."
  ```

- [ ] `src/components/chat/HomeChatInput.tsx` (라인 41)

  ```
  현재: "Ask Dyad to build ${typingText}"
  변경: "Ask ANYON to build ${typingText}"
  ```

- [ ] `src/components/chat/LexicalChatInput.tsx` (라인 274)

### 2A-3. Pro 관련 텍스트

> "Dyad Pro" → "ANYON Pro" 전체 교체

#### ProBanner.tsx

- [ ] "Manage Dyad Pro" → "Manage ANYON Pro"
- [ ] "Get Dyad Pro" → "Get ANYON Pro"
- [ ] "Subscribe to Dyad Pro" → "Subscribe to ANYON Pro"

#### ChatErrorBox.tsx

- [ ] "Upgrade to Dyad Pro" (x4)
- [ ] "Access with Dyad Pro"
- [ ] "valid Dyad Pro key" → "valid ANYON Pro key"
- [ ] "Dyad AI credits" → "ANYON credits"

#### 설정 페이지

- [ ] `src/components/settings/ProviderSettingsPage.tsx`
  - "Enable Dyad Pro" → "Enable ANYON Pro"
  - "Toggle to enable Dyad Pro"
  - "Error toggling Dyad Pro"

- [ ] `src/components/settings/ProviderSettingsHeader.tsx`
  - "Manage Dyad Pro Subscription" → "Manage ANYON Pro Subscription"

#### ProModeSelector.tsx

- [ ] "Dyad Pro" (x5)
- [ ] "Configure Dyad Pro settings"
- [ ] "Uses Dyad Pro AI credits..."

#### 기타 컴포넌트

- [ ] `DyadProSuccessDialog.tsx` — "Welcome to Dyad Pro!" → "Welcome to ANYON Pro!"
- [ ] `DyadProTrialDialog.tsx` — "Unlock Dyad Pro"
- [ ] `FreeAgentQuotaBanner.tsx` — "Upgrade to Dyad Pro"
- [ ] `PromoMessage.tsx` — "Get Dyad Pro", "Dyad Pro's Smart Context"
- [ ] `AnnotatorOnlyForPro.tsx` — "with Dyad Pro", "Get Dyad Pro"
- [ ] `SetupBanner.tsx` — "Start with Dyad Pro free trial"
- [ ] `TokenBar.tsx` — "Dyad Pro's Smart Context"

### 2A-4. 일반 UI 텍스트

- [ ] `src/components/HelpBotDialog.tsx`
  - "Dyad Help Bot" → "ANYON Help Bot"
  - "Ask a question about using Dyad" → "Ask a question about using ANYON"

- [ ] `src/components/ErrorBoundary.tsx`
  - "Try closing and re-opening Dyad" → "Try closing and re-opening ANYON"

- [ ] `src/components/SetupBanner.tsx`
  - "Setup Dyad" → "Setup ANYON"
  - `alt="Dyad Logo"` → `alt="ANYON Logo"`

- [ ] `src/components/ReleaseChannelSelector.tsx`
  - "Restart Dyad" → "Restart ANYON"

- [ ] `src/components/AutoUpdateSwitch.tsx`
  - "Restart Dyad" → "Restart ANYON"

- [ ] `src/components/settings/AzureConfiguration.tsx`
  - "Restart Dyad after changing..." → "Restart ANYON after changing..."

- [ ] `src/app/TitleBar.tsx`
  - `alt="Dyad Logo"` → `alt="ANYON Logo"`

- [ ] `src/hooks/useStreamChat.ts`
  - `app?.name ?? "Dyad"` → `app?.name ?? "ANYON"`

- [ ] `src/lib/toast.tsx`
  - "Files changed outside of Dyad" → "Files changed outside of ANYON"

- [ ] `src/components/ContextFilesPicker.tsx`
  - "Dyad uses Smart Context..." → "ANYON uses Smart Context..."

- [ ] `src/components/CommunityCodeConsentDialog.tsx`
  - "created by a Dyad community member" → "created by an ANYON community member"

- [ ] `src/components/AppUpgrades.tsx`
  - "has all Dyad capabilities enabled" → "has all ANYON capabilities enabled"

### 2A-5. 에러 메시지 (백엔드)

- [ ] `src/pro/main/ipc/handlers/local_agent/local_agent_handler.ts`
  - "Agent v2 requires Dyad Pro..." → "Agent v2 requires ANYON Pro..."

- [ ] `src/pro/main/ipc/handlers/themes_handlers.ts`
  - "Dyad Pro is required for AI theme generation..." (x2)

- [ ] `src/pro/main/ipc/handlers/local_agent/tools/engine_fetch.ts`
  - "Dyad Pro API key is required" → "ANYON Pro API key is required"

- [ ] `src/ipc/handlers/pro_handlers.ts`
  - "LLM Gateway API key (Dyad Pro) is not configured." → "ANYON Pro API key is not configured."

---

## TODO 2B: URL 교체

### 2B-1. Pro/구독 관련 URL

> `dyad.sh/pro` → `any-on.dev/pro` 또는 `pay.any-on.dev`

- [ ] `src/components/ProBanner.tsx` (라인 51, 68, 83, 149, 190)
  - `academy.dyad.sh/subscription` → `pay.any-on.dev/subscription`
  - `academy.dyad.sh/settings` → `pay.any-on.dev/settings`
  - `dyad.sh/pro` → `any-on.dev/pro`

- [ ] `src/components/DyadProTrialDialog.tsx` (라인 17, 24)
  - `academy.dyad.sh/redirect-to-checkout` → `pay.any-on.dev/checkout`

- [ ] `src/components/chat/ChatErrorBox.tsx` (라인 34, 62, 82, 98, 125, 143)
  - `dyad.sh/pro` → `any-on.dev/pro`
  - `academy.dyad.sh/subscription` → `pay.any-on.dev/subscription`

- [ ] `src/components/ProModeSelector.tsx` (라인 90)
- [ ] `src/components/chat/FreeAgentQuotaBanner.tsx` (라인 42)
- [ ] `src/components/chat/PromoMessage.tsx` (라인 59, 70)
- [ ] `src/components/chat/TokenBar.tsx` (라인 142)
- [ ] `src/components/preview_panel/AnnotatorOnlyForPro.tsx` (라인 11)
- [ ] `src/components/chat/ChatInput.tsx` (라인 527)

### 2B-2. 문서 링크

> `dyad.sh/docs/*` → `docs.any-on.dev/*` 또는 제거

- [ ] `src/ipc/handlers/release_note_handlers.ts` (라인 24)
- [ ] `src/ipc/handlers/app_upgrade_handlers.ts` (라인 23, 30)
- [ ] `src/components/HelpDialog.tsx` (라인 403)
- [ ] `src/components/SetupBanner.tsx` (라인 402)
- [ ] `src/components/chat/ChatErrorBox.tsx` (라인 68, 163)
- [ ] `src/components/chat/PromoMessage.tsx` (라인 141, 156, 180)
- [ ] `src/components/CapacitorControls.tsx` (라인 140)
- [ ] `src/components/GitHubConnector.tsx` (라인 382)
- [ ] `src/components/TelemetryBanner.tsx` (라인 35)
- [ ] `src/components/ReleaseChannelSelector.tsx` (라인 30)
- [ ] `src/components/PortalMigrate.tsx` (라인 44)
- [ ] `src/components/preview_panel/SecurityPanel.tsx` (라인 257)
- [ ] `src/components/chat/TokenBar.tsx` (라인 140)
- [ ] `src/supabase_admin/supabase_context.ts` (라인 43)
- [ ] `src/components/AppUpgrades.tsx` (라인 135)

### 2B-3. GitHub/커뮤니티 링크 — 제거

> 사용 안 함 — UI에서 제거하거나 ANYON 사이트로 대체

- [ ] `src/components/chat/PromoMessage.tsx` (라인 94) — Reddit 제거
- [ ] `src/components/chat/PromoMessage.tsx` (라인 123) — YouTube 제거
- [ ] `src/components/chat/PromoMessage.tsx` (라인 197) — GitHub 제거
- [ ] `src/components/home/OnboardingBanner.tsx` (라인 20) — YouTube 제거
- [ ] `src/components/ErrorBoundary.tsx` — GitHub Issues 링크 제거
- [ ] `src/components/HelpDialog.tsx` — GitHub Issues 링크 제거

### 2B-4. Scaffold 템플릿

- [ ] `scaffold/src/components/made-with-dyad.tsx`
  - "Made with Dyad" → "Made with ANYON"
  - `https://www.dyad.sh/` → `https://any-on.com/`

---

## TODO 2C: 시스템 프롬프트 (AI 정체성)

- [ ] `src/prompts/system_prompt.ts`

  ```
  현재: "You are Dyad, an AI editor..."
  변경: "You are ANYON, an AI editor..."
  ```

  - "Dyad Environment" → "ANYON Environment"
  - "You are working inside **Dyad**" → "You are working inside **ANYON**"

- [ ] `src/prompts/local_agent_prompt.ts`

  ```
  현재: "You are Dyad, an AI assistant..." (x2)
  변경: "You are ANYON, an AI assistant..."
  ```

- [ ] `src/prompts/plan_mode_prompt.ts`
  ```
  현재: "You are Dyad Plan Mode..."
  변경: "You are ANYON Plan Mode..."
  ```

---

## TODO 2D: 기타 인프라 문자열

### Git 커밋 author (선택)

- [ ] `src/ipc/utils/git_author.ts` (라인 12)
  ```
  현재: name: "[dyad]", email: "git@dyad.sh"
  변경: name: "[anyon]", email: "git@any-on.dev"
  ```

### HTTP 헤더 (선택)

- [ ] `src/ipc/utils/llm_engine_provider.ts` — `X-Dyad-Request-Id` → `X-Anyon-Request-Id`
- [ ] `src/pro/main/ipc/handlers/local_agent/tools/engine_fetch.ts` — 동일
- [ ] `src/pro/main/ipc/handlers/themes_handlers.ts` — 동일
- [ ] `src/ipc/handlers/createFromTemplate.ts` — `"User-Agent": "Dyad"` → `"User-Agent": "ANYON"`

### 로그 업로드 (비활성화 또는 대체)

- [ ] `src/components/HelpDialog.tsx` (라인 163)
  - `upload-logs.dyad.sh` → 제거 또는 자체 URL

### 헬프봇 (비활성화 또는 대체)

- [ ] `src/ipc/handlers/help_bot_handlers.ts` (라인 48)
  - `helpchat.dyad.sh/v1` → 제거 또는 자체 URL

---

## 검증 체크리스트

```
UI 검증:
- [ ] 타이틀바에 "ANYON" 표시
- [ ] 채팅 입력란에 "Ask ANYON to build..." 표시
- [ ] Pro 관련 모든 UI에 "ANYON Pro" 표시
- [ ] 모든 외부 링크가 any-on.dev로 연결

프롬프트 검증:
- [ ] AI가 "I am ANYON"으로 자기 소개
- [ ] 에러 메시지에 "ANYON" 표시

링크 검증:
- [ ] "Get ANYON Pro" → pay.any-on.dev 열림
- [ ] GitHub/Reddit/YouTube 링크 없음 (또는 ANYON 것으로 대체)
```
