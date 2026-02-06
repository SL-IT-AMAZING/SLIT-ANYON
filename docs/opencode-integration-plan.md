# Dyad ← OpenCode 풀 기능 통합 계획서

> **목표**: Dyad 데스크탑 앱에서 OpenCode CLI의 모든 기능을 UI로 제어할 수 있도록 한다.
> **작성일**: 2026-02-06
> **현재 상태**: Dyad는 OpenCode 서버에 연결되어 있으나, 93개 API 중 4개만 사용 중

---

## 현재 상태 분석

### 연결 구조 (이미 작동 중)

```
Dyad Electron App
  └─ opencode_server.ts    → `opencode serve` 프로세스 스폰 (127.0.0.1:4096)
  └─ opencode_provider.ts  → LanguageModelV2 인터페이스로 래핑
  └─ get_model_client.ts   → OpenCode만 유일한 프로바이더로 강제
```

### 현재 사용 중인 API (4개)

| API                         | 용도          | 파일                   |
| --------------------------- | ------------- | ---------------------- |
| `GET /global/health`        | 서버 헬스체크 | `opencode_server.ts`   |
| `POST /session`             | 세션 생성     | `opencode_provider.ts` |
| `POST /session/:id/message` | 메시지 전송   | `opencode_provider.ts` |
| `GET /event` (SSE)          | 스트리밍 응답 | `opencode_provider.ts` |

### 현재 제한 사항

1. **모델 1개 하드코딩**: `claude-sonnet-4-20250514`만 존재 (`language_model_constants.ts`)
2. **프로바이더 1개 하드코딩**: `opencode` (OpenCode CLI)만 존재
3. **에이전트 선택 불가**: 모드(build/ask/plan 등)는 Dyad 자체 시스템
4. **프로바이더 설정 불가**: API 키 입력, OAuth 인증 UI 없음
5. **모델 피커**: 단순 드롭다운, 검색/그룹핑/상세정보 없음

### 기술 스택 차이 (OpenCode App vs Dyad)

|               | OpenCode App             | Dyad                       |
| ------------- | ------------------------ | -------------------------- |
| 프레임워크    | SolidJS                  | React                      |
| UI 라이브러리 | @kobalte/core            | shadcn/ui + @base-ui/react |
| 라우팅        | @solidjs/router          | TanStack Router            |
| 데이터 패칭   | 커스텀 globalSync (SSE)  | TanStack Query + IPC       |
| 상태 관리     | createStore/createSignal | useState/Jotai atoms       |

→ **직접 복사 불가, 로직 참고 + React 재구현 필요**

---

## 참고할 OpenCode App 소스

```
packages/app/src/
├── hooks/use-providers.ts              # 프로바이더 데이터 가공
├── context/models.tsx                  # 모델 상태 (즐겨찾기, 최근, 가시성)
├── utils/agent.ts                      # 에이전트 유틸리티
├── components/
│   ├── dialog-select-model.tsx         # 모델 피커 UI
│   ├── dialog-select-provider.tsx      # 프로바이더 선택
│   ├── dialog-connect-provider.tsx     # 프로바이더 연결 (API키/OAuth)
│   ├── dialog-custom-provider.tsx      # 커스텀 프로바이더 추가
│   ├── dialog-manage-models.tsx        # 모델 표시/숨김 관리
│   ├── dialog-settings.tsx             # 설정 메인 다이얼로그
│   ├── settings-providers.tsx          # 프로바이더 설정 탭
│   ├── settings-models.tsx             # 모델 설정 탭
│   ├── settings-agents.tsx             # 에이전트 설정 탭
│   ├── settings-mcp.tsx                # MCP 설정 탭
│   ├── settings-commands.tsx           # 커맨드 설정 탭
│   ├── settings-keybinds.tsx           # 키바인드 설정 탭
│   ├── settings-permissions.tsx        # 권한 설정 탭
│   ├── settings-general.tsx            # 일반 설정 탭
│   └── model-tooltip.tsx               # 모델 상세 툴팁
```

---

## 사용할 OpenCode 서버 API (전체 목록)

### 프로바이더/모델 (Wave 1에서 사용)

| Method | Path                            | operationId                | 설명                                         |
| ------ | ------------------------------- | -------------------------- | -------------------------------------------- |
| GET    | `/provider`                     | `provider.list`            | 모든 프로바이더 + 모델 목록 (연결 상태 포함) |
| GET    | `/provider/auth`                | `provider.auth`            | 프로바이더 인증 방법 목록                    |
| POST   | `/provider/:id/oauth/authorize` | `provider.oauth.authorize` | OAuth 인증 시작                              |
| POST   | `/provider/:id/oauth/callback`  | `provider.oauth.callback`  | OAuth 콜백                                   |
| POST   | `/auth/set`                     | `auth.set`                 | API 키 저장                                  |
| POST   | `/auth/remove`                  | `auth.remove`              | API 키 삭제                                  |

### 에이전트 (Wave 2에서 사용)

| Method | Path          | operationId  | 설명          |
| ------ | ------------- | ------------ | ------------- |
| GET    | `/app/agents` | `app.agents` | 에이전트 목록 |
| GET    | `/app/skills` | `app.skills` | 스킬 목록     |

### 설정 (Wave 3에서 사용)

| Method | Path                | operationId            | 설명               |
| ------ | ------------------- | ---------------------- | ------------------ |
| GET    | `/global/config`    | `global.config.get`    | 전역 설정          |
| PATCH  | `/global/config`    | `global.config.update` | 전역 설정 변경     |
| GET    | `/config`           | `config.get`           | 프로젝트 설정      |
| PATCH  | `/config`           | `config.update`        | 프로젝트 설정 변경 |
| GET    | `/config/providers` | `config.providers`     | 설정된 프로바이더  |

### 세션 관리 고급 (Wave 3에서 사용)

| Method | Path                 | operationId      | 설명      |
| ------ | -------------------- | ---------------- | --------- |
| GET    | `/session`           | `session.list`   | 세션 목록 |
| GET    | `/session/:id`       | `session.get`    | 세션 상세 |
| PATCH  | `/session/:id`       | `session.update` | 세션 수정 |
| DELETE | `/session/:id`       | `session.delete` | 세션 삭제 |
| POST   | `/session/:id/abort` | `session.abort`  | 세션 중단 |
| POST   | `/session/:id/fork`  | `session.fork`   | 세션 포크 |
| GET    | `/session/:id/todo`  | `session.todo`   | TODO 목록 |
| GET    | `/session/:id/diff`  | `session.diff`   | Diff 뷰   |

### MCP (Wave 4에서 사용)

| Method | Path              | operationId      | 설명          |
| ------ | ----------------- | ---------------- | ------------- |
| GET    | `/mcp/status`     | `mcp.status`     | MCP 서버 상태 |
| POST   | `/mcp/connect`    | `mcp.connect`    | MCP 연결      |
| POST   | `/mcp/disconnect` | `mcp.disconnect` | MCP 해제      |
| POST   | `/mcp/add`        | `mcp.add`        | MCP 서버 추가 |

### 기타 (Wave 4에서 사용)

| Method | Path                | operationId        | 설명        |
| ------ | ------------------- | ------------------ | ----------- |
| GET    | `/tool/list`        | `tool.list`        | 도구 목록   |
| GET    | `/command/list`     | `command.list`     | 커맨드 목록 |
| GET    | `/permission`       | `permission.list`  | 권한 목록   |
| POST   | `/permission/reply` | `permission.reply` | 권한 응답   |

---

## 구현 계획

### Wave 1: 모델/프로바이더 동적 로딩 + 모델 피커 개편

> **목표**: 하드코딩된 모델 1개 → OpenCode 서버의 전체 모델 카탈로그 표시
> **예상 난이도**: ★★★☆☆
> **예상 작업량**: 중간

#### 1-1. OpenCode 서버 API 클라이언트 생성

- **새 파일**: `src/ipc/utils/opencode_api.ts`
- **역할**: OpenCode 서버 HTTP API를 호출하는 범용 클라이언트
- **참고**: `opencode_provider.ts`의 `fetchOpenCode()` 패턴 재활용
- **핵심**: `openCodeServer.ensureRunning()` 후 인증 헤더 포함 fetch

```typescript
// 예시 구조
export class OpenCodeAPI {
  async getProviders(): Promise<ProviderListResponse>;
  async getAgents(): Promise<AgentListResponse>;
  async getConfig(): Promise<ConfigResponse>;
  async updateConfig(patch: Partial<Config>): Promise<void>;
  // ...
}
```

#### 1-2. IPC 계약 수정 - 프로바이더/모델

- **수정 파일**: `src/ipc/types/language-model.ts`
- **변경**: 기존 계약 유지하면서, 응답 데이터가 OpenCode API에서 오도록 핸들러 변경
- **핵심**: `getProviders`, `getModels`, `getModelsByProviders` 핸들러가 하드코딩 대신 OpenCode API 호출

#### 1-3. 핸들러 수정 - 동적 모델 로딩

- **수정 파일**: `src/ipc/shared/language_model_helpers.ts`
- **변경**: `getLanguageModelProviders()` → OpenCode `GET /provider` API 호출
- **변경**: `getLanguageModels()` → 응답에서 프로바이더별 모델 파싱
- **삭제**: `language_model_constants.ts`의 하드코딩된 `MODEL_OPTIONS`, `LOCAL_PROVIDERS`

#### 1-4. 모델 클라이언트 수정

- **수정 파일**: `src/ipc/utils/get_model_client.ts`
- **변경**: `"opencode" only` 제한 제거
- **변경**: 선택된 프로바이더+모델 ID를 OpenCode 세션에 전달
- **핵심**: `opencode_provider.ts`의 세션 생성 시 모델 지정

#### 1-5. 세션 생성 시 모델/에이전트 지정

- **수정 파일**: `src/ipc/utils/opencode_provider.ts`
- **변경**: `POST /session` 호출 시 `model`, `agent` 파라미터 추가
- **변경**: `POST /session/:id/message` 호출 시 모델 정보 포함
- **참고**: OpenCode `session.create` API 스키마 확인 필요

#### 1-6. 모델 피커 UI 개편

- **수정 파일**: `src/components/ModelPicker.tsx`
- **변경사항**:
  - 단순 드롭다운 → 검색 가능한 다이얼로그
  - 프로바이더별 그룹핑 (Anthropic, OpenAI, Google...)
  - 모델 상세 정보 표시 (가격, 컨텍스트 크기, 기능)
  - 연결된 프로바이더 vs 미연결 프로바이더 구분
  - "Free" 태그 (OpenCode 무료 모델)
- **참고**: OpenCode `dialog-select-model.tsx` 로직

#### 1-7. 프로바이더 연결 UI

- **새 파일**: `src/components/ProviderConnectDialog.tsx`
- **역할**: API 키 입력 또는 OAuth 인증으로 프로바이더 연결
- **사용 API**: `provider.auth`, `auth.set`, `provider.oauth.authorize`
- **참고**: OpenCode `dialog-connect-provider.tsx`

---

### Wave 2: 에이전트 시스템 연동

> **목표**: OpenCode의 에이전트(build, plan, explore, custom...)를 Dyad UI에서 선택 가능
> **예상 난이도**: ★★☆☆☆
> **예상 작업량**: 작음
> **의존성**: Wave 1-5 완료 필요 (세션에 에이전트 전달)

#### 2-1. 에이전트 IPC 계약 추가

- **새 파일**: `src/ipc/types/opencode-agent.ts`
- **계약**: `getAgents` → `GET /app/agents` 호출
- **스키마**: Agent { name, description, mode, model?, prompt?, color? }

#### 2-2. 에이전트 목록 훅

- **새 파일**: `src/hooks/useOpenCodeAgents.ts`
- **역할**: TanStack Query로 에이전트 목록 캐싱

#### 2-3. 에이전트 피커 UI

- **새 파일**: `src/components/AgentPicker.tsx`
- **위치**: 채팅 입력 영역 근처 (모델 피커 옆)
- **기능**: 에이전트 목록 드롭다운, 현재 선택된 에이전트 표시
- **참고**: OpenCode TUI의 Tab 키로 에이전트 전환 패턴

#### 2-4. 세션-에이전트 연결

- **수정 파일**: `src/ipc/utils/opencode_provider.ts`
- **변경**: 세션 생성/메시지 전송 시 선택된 에이전트 전달

---

### Wave 3: 설정 패널 + 세션 관리

> **목표**: OpenCode 설정을 Dyad UI에서 관리, 세션 고급 기능
> **예상 난이도**: ★★★☆☆
> **예상 작업량**: 중간
> **의존성**: Wave 1 완료 필요

#### 3-1. 설정 다이얼로그 개편

- **수정/새 파일**: `src/components/SettingsDialog.tsx` (또는 기존 설정 페이지 확장)
- **탭 구조**:
  - General (일반)
  - Providers (프로바이더 관리)
  - Models (모델 표시/숨김, 즐겨찾기)
  - Agents (에이전트 목록)
- **참고**: OpenCode `dialog-settings.tsx`

#### 3-2. 프로바이더 설정 탭

- **새 파일**: `src/components/settings/SettingsProviders.tsx`
- **기능**: 연결된 프로바이더 목록, 연결/해제, API 키 관리
- **사용 API**: `provider.list`, `provider.auth`, `auth.set`, `auth.remove`
- **참고**: OpenCode `settings-providers.tsx`

#### 3-3. 모델 설정 탭

- **새 파일**: `src/components/settings/SettingsModels.tsx`
- **기능**: 모델 표시/숨김, 기본 모델 설정
- **사용 API**: `config.update` (모델 설정 변경)
- **참고**: OpenCode `settings-models.tsx`

#### 3-4. 세션 관리 개선

- **수정 파일**: 기존 세션 목록/관리 컴포넌트
- **추가 기능**: 세션 이름 변경, 삭제, 포크
- **사용 API**: `session.list`, `session.update`, `session.delete`, `session.fork`

---

### Wave 4: 고급 기능 (선택적)

> **목표**: MCP, 권한, 커맨드, 도구 관리 등 파워유저 기능
> **예상 난이도**: ★★★★☆
> **예상 작업량**: 큼
> **의존성**: Wave 1~3 완료 필요

#### 4-1. MCP 서버 관리

- MCP 서버 목록, 연결 상태, 추가/제거
- `mcp.status`, `mcp.connect`, `mcp.disconnect`, `mcp.add`

#### 4-2. 권한 관리

- 도구별 허용/거부/확인 설정
- `permission.list`, `permission.reply`

#### 4-3. 커맨드 시스템

- 슬래시 커맨드 목록, 실행
- `command.list`, `session.command`

#### 4-4. 도구 관리

- 사용 가능한 도구 목록 표시
- `tool.list`, `tool.ids`

#### 4-5. 프로젝트/워크트리 관리

- 프로젝트 전환, 워크트리 생성/관리
- `project.list`, `project.current`, `worktree.*`

---

## 파일 변경 요약

### 수정할 기존 파일

| 파일                                         | Wave | 변경 내용                     |
| -------------------------------------------- | ---- | ----------------------------- |
| `src/ipc/shared/language_model_helpers.ts`   | 1    | 하드코딩 → OpenCode API 호출  |
| `src/ipc/shared/language_model_constants.ts` | 1    | 하드코딩 데이터 제거/최소화   |
| `src/ipc/utils/get_model_client.ts`          | 1    | "opencode only" 제한 제거     |
| `src/ipc/utils/opencode_provider.ts`         | 1    | 세션에 모델/에이전트 전달     |
| `src/components/ModelPicker.tsx`             | 1    | 완전 재작성                   |
| `src/ipc/types/language-model.ts`            | 1    | 스키마 확장 (프로바이더 상세) |

### 새로 생성할 파일

| 파일                                            | Wave | 역할                              |
| ----------------------------------------------- | ---- | --------------------------------- |
| `src/ipc/utils/opencode_api.ts`                 | 1    | OpenCode 서버 API 범용 클라이언트 |
| `src/components/ProviderConnectDialog.tsx`      | 1    | 프로바이더 연결 다이얼로그        |
| `src/hooks/useOpenCodeProviders.ts`             | 1    | 프로바이더 목록 훅                |
| `src/hooks/useOpenCodeAgents.ts`                | 2    | 에이전트 목록 훅                  |
| `src/components/AgentPicker.tsx`                | 2    | 에이전트 선택 UI                  |
| `src/ipc/types/opencode-agent.ts`               | 2    | 에이전트 IPC 계약                 |
| `src/components/settings/SettingsProviders.tsx` | 3    | 프로바이더 설정 탭                |
| `src/components/settings/SettingsModels.tsx`    | 3    | 모델 설정 탭                      |

---

## 검증 기준

### Wave 1 완료 조건

- [ ] 모델 피커에 OpenCode 서버의 전체 모델 목록이 프로바이더별로 표시됨
- [ ] 모델 검색 가능
- [ ] 모델 선택 후 해당 모델로 채팅이 작동함
- [ ] 미연결 프로바이더에 "Connect" 버튼 표시
- [ ] API 키 입력으로 프로바이더 연결 가능
- [ ] `npm run ts` 타입 체크 통과
- [ ] `npm run lint` 통과
- [ ] 기존 E2E 테스트 통과

### Wave 2 완료 조건

- [ ] 에이전트 피커에 OpenCode 에이전트 목록 표시
- [ ] 에이전트 선택 후 해당 에이전트로 세션 생성됨
- [ ] build/plan/explore 등 에이전트 전환 가능

### Wave 3 완료 조건

- [ ] 설정 다이얼로그에 Providers/Models 탭 존재
- [ ] 프로바이더 연결/해제 가능
- [ ] 세션 이름 변경/삭제/포크 가능

---

## 리스크 및 고려사항

1. **OpenCode 세션 API 스키마**: 세션 생성 시 모델/에이전트를 어떻게 지정하는지 정확한 스키마 확인 필요
2. **Dyad 자체 모드 시스템과의 충돌**: Dyad의 build/ask/plan 모드와 OpenCode의 에이전트 시스템이 겹침 → 어떻게 공존/대체할지 결정 필요
3. **인증 보안**: API 키가 Electron 프로세스에서 관리되므로 보안 고려
4. **OpenCode CLI 의존성**: 사용자 머신에 `opencode` CLI가 설치되어 있어야 함
5. **버전 호환성**: OpenCode 서버 API가 버전마다 다를 수 있음
