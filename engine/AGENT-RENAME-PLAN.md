# Agent Name Rename Plan: Scientist Names → Functional Names (v2)

## 개요

**목표**: 현재 과학자/철학자 이름 기반의 에이전트명을 역할이 즉시 드러나는 기능 기반 이름으로 전환
**범위**: `engine/` 디렉토리 내부에만 한정 (모노레포 상위 앱/IPC에 에이전트명 참조 없음 확인됨)
**예상 영향 파일**: ~210개 파일, ~2,900+ 매치
**위험도**: HIGH — 일반 프로그래밍 용어와의 충돌 위험이 크므로 안전한 이름을 최종 선택

---

## 1. 최종 확정 네이밍

### 1.1 에이전트명 매핑

| 현재 이름 | 최종 이름 | 역할 | 영향 파일 수 | 매치 수 | 복잡도 | 충돌 위험 |
|-----------|----------|------|-------------|---------|--------|----------|
| `euler` | **`conductor`** | 메인 오케스트레이터, 계획 + 위임 | 102 | 659 | VERY HIGH | ZERO (기존 5 matches는 turing 파일 내 → 어차피 리네임) |
| `tesla` | **`craftsman`** | 자율적 딥 워커 (GPT-5.3 Codex) | 40 | 185 | HIGH | ZERO (기존 1 match는 tesla.ts 내 → 어차피 리네임) |
| `socrates` | **`advisor`** | 읽기전용 아키텍처 컨설턴트 | 61 | 282 | HIGH | ZERO |
| `curie` | **`researcher`** | 외부 문서/코드 검색 | 68 | 225 | HIGH | ZERO (10 matches, 모두 test 파일 내 설명 문자열) |
| `galileo`/`explore` | **`scout`** | 코드베이스 grep | 3(+82) | 3(+387) | MEDIUM | ZERO |
| `davinci` | **`inspector`** | PDF/이미지 시각 분석 | 26 | 86 | MEDIUM | ZERO |
| `lovelace` | **`analyst`** | 사전 계획 분석가 | 26 | 76 | MEDIUM | ZERO |
| `nietzsche` | **`critic`** | 플랜 리뷰어/비평가 | 29 | 78 | MEDIUM | ZERO (57 matches는 "critical" 등 형용사형) |
| `turing` | **`taskmaster`** | Todo 기반 태스크 실행기 | 62 | 229 | VERY HIGH | ZERO |
| `newton` | **`strategist`** | 전략적 플래너 | 55 | 283 | VERY HIGH | ZERO |
| `faraday` | **`worker`** | 카테고리 스폰 실행기 (주니어) | 40 | 120 | HIGH | LOW (16 matches — Bun Worker 스레드) |

### 1.2 충돌 회피로 변경된 이름 (기존 계획 대비)

| 기존 제안 | 최종 확정 | 변경 이유 |
|-----------|----------|----------|
| `executor` | **`taskmaster`** | `executor` 112 matches in 57 files — `command-executor.ts`, `action-executor.ts`, `ExecutorContext` type 등 인프라 전반에 사용. 구분 불가 |
| `orchestrator` | **`conductor`** | `orchestrator` 64 matches in 25 files — euler/turing 설명 문자열에서 이미 사용. agent name과 설명이 혼재되어 혼란 유발 |
| `builder` | **`craftsman`** | `builder` 50 matches in 39 files — `buildAgent()`, `agent-builder.ts`, `PromptSectionBuilder` 등 빌더 패턴 전반에 사용 |
| `planner` | **`strategist`** | `planner` 55 matches in 17 files — `turbo/planner.ts` 모듈 존재, keyword detection에서도 사용 |

### 1.3 Display Names 매핑

| 현재 Display Name | 새 Display Name |
|-------------------|----------------|
| `Euler (Turboer)` | `Conductor (Turbo)` |
| `Tesla (Deep Agent)` | `Craftsman (Deep)` |
| `socrates` | `Advisor` |
| `curie` | `Researcher` |
| `explore` | `Scout` |
| `davinci` | `Inspector` |
| `Lovelace (Plan Consultant)` | `Analyst` |
| `Nietzsche (Plan Critic)` | `Critic` |
| `Turing (Plan Executor)` | `Taskmaster` |
| `Newton (Plan Builder)` | `Strategist` |
| `Euler-Junior` | `Worker` |

### 1.4 이전 이름과의 전체 계보

```
oh-my-opencode (1세대)    →  anyon (2세대, 현재)  →  anyon (3세대, 이번 작업)
─────────────────────────────────────────────────────────────────────────────
sisyphus                  →  euler                →  conductor
sisyphus-junior           →  faraday              →  worker
hephaestus                →  tesla                →  craftsman
oracle                    →  socrates             →  advisor
librarian                 →  curie                →  researcher
explore                   →  galileo/explore      →  scout
multimodal-looker         →  davinci              →  inspector
prometheus                →  newton               →  strategist
metis                     →  lovelace             →  analyst
momus                     →  nietzsche            →  critic
atlas                     →  turing               →  taskmaster
```

---

## 2. 충돌 위험 상세 분석

### 2.1 CRITICAL — 기존 계획에서 제거된 이름

#### ❌ `executor` (112 matches in 57 files)

기존 코드에 executor 패턴이 인프라 전반에 걸쳐 사용됨. 에이전트명과 구분 불가능.

**충돌 파일 목록 (DO NOT TOUCH):**
| 파일 | 용도 |
|------|------|
| `src/hooks/anthropic-context-window-limit-recovery/executor.ts` | Compaction executor |
| `src/hooks/auto-slash-command/executor.ts` | Slash command executor |
| `src/tools/delegate-task/executor.ts` | Task delegation executor |
| `src/tools/delegate-task/executor-types.ts` | `ExecutorContext` type |
| `src/features/tmux-subagent/action-executor.ts` | Tmux action executor |
| `src/shared/command-executor.ts` | Command execution utility |
| `src/tools/call-anyon-agent/sync-executor.ts` | Sync execution |
| `src/tools/call-anyon-agent/background-executor.ts` | Background execution |

**충돌 식별자:** `ExecutorContext`, `executeAction`, `executor`, `CommandExecutor`, `SyncExecutor`, `BackgroundExecutor`

→ **`taskmaster`로 대체 (0 matches, 완전히 안전)**

#### ❌ `orchestrator` (64 matches in 25 files)

Euler와 Turing의 설명/프롬프트에서 "orchestrator"라는 일반 용어로 자주 사용됨. agent name과 설명이 혼재.

**충돌 예시:**
```typescript
// 이런 문맥에서 "orchestrator"가 agent name인지 설명인지 구분 불가
"Euler is the main orchestrator agent..."
"orchestrator pattern for task delegation..."
```

→ **`conductor`로 대체 (기존 5 matches는 모두 turing 파일 내 → 어차피 리네임됨)**

#### ❌ `builder` (50 matches in 39 files)

Builder 패턴이 코드베이스 전반에서 사용됨.

**충돌 파일 목록 (DO NOT TOUCH):**
| 파일 | 용도 |
|------|------|
| `src/agents/agent-builder.ts` | Agent build utility |
| `src/agents/dynamic-agent-prompt-builder.ts` | Prompt builder |
| `src/agents/newton/newton-agent-config-builder.ts` | Config builder |
| `src/plugin-handlers/newton-agent-config-builder.ts` | Plugin config builder |

**충돌 식별자:** `buildAgent()`, `PromptSectionBuilder`, `buildAvailableSkills()`, `AgentConfigBuilder`

→ **`craftsman`으로 대체 (기존 1 match는 tesla.ts의 "Legitimate Craftsman" 설명 → 어차피 리네임됨)**

#### ❌ `planner` (55 matches in 17 files)

`turbo/planner.ts` 모듈이 이미 존재하며, keyword detection에서도 planner 관련 로직이 있음.

**충돌 파일 목록 (DO NOT TOUCH):**
| 파일 | 용도 |
|------|------|
| `src/hooks/keyword-detector/turbo/planner.ts` | Planner keyword detection module |

→ **`strategist`로 대체 (0 matches, 완전히 안전)**

### 2.2 LOW RISK — 유지하되 주의 필요

#### ⚠️ `worker` (16 matches in 4 files)

Bun Worker 스레드에서 사용됨. 에이전트명 컨텍스트와 명확히 구분 가능.

**주의 파일 (DO NOT TOUCH):**
| 파일 | 용도 |
|------|------|
| `src/features/opencode-skill-loader/blocking.ts` | `new Worker(...)` Bun Worker 생성 |
| `src/features/opencode-skill-loader/discover-worker.ts` | Worker thread |
| `src/features/opencode-skill-loader/skill-worker.ts` | Skill Worker |
| `src/features/opencode-skill-loader/types.ts` | Worker type definitions |

**구분 규칙:** `Worker`(대문자, Bun class) ≠ `worker`(소문자, agent name string literal)

### 2.3 SAFE — 충돌 없음

| 이름 | 기존 매치 수 | 비고 |
|------|-------------|------|
| `conductor` | 5 (모두 turing 내 → 리네임됨) | 실질 0 |
| `craftsman` | 1 (tesla.ts 내 → 리네임됨) | 실질 0 |
| `taskmaster` | 0 | 완전 안전 |
| `strategist` | 0 | 완전 안전 |
| `advisor` | 0 | 완전 안전 |
| `researcher` | 0 (test 설명 10개 무시) | 완전 안전 |
| `scout` | 0 | 완전 안전 |
| `inspector` | 0 | 완전 안전 |
| `analyst` | 0 | 완전 안전 |
| `critic` | 0 (형용사 "critical" 57개 무시) | 완전 안전 |

---

## 3. Import 의존성 그래프 (리네임 순서 결정 근거)

### 3.1 의존성 피라미드

```
                    types.ts (14+ importers — FOUNDATION)
                         │
            ┌────────────┼────────────┐
            │            │            │
    agent-names.ts  builtin-agents.ts  agent-display-names.ts
       (4 imp)         (3 imp)           (27 imp — HIGHEST)
            │            │
    ┌───────┴───────┐    │
    │ migration.ts  │    │
    │ config-*.ts   │    │
    └───────────────┘    │
                    ┌────┴────────────────────────────┐
                    │ All 11 agent definition files    │
                    │ (각 1~3 importers)               │
                    └─────────────────────────────────┘
```

### 3.2 에이전트별 Import 카운트

| Source File | Imported By | Count |
|-------------|-------------|-------|
| `types.ts` | All 8 agents + 6 others | **14+ (foundation)** |
| `agent-display-names.ts` | 27 files (handlers, hooks, tools, plugins) | **27 (highest coupling)** |
| `builtin-agents.ts` | `agents/index.ts`, `utils.test.ts`, `agent-config-handler.ts` | 3 |
| `agent-names.ts` (migration) | `anyon-config.ts`, `config-migration.ts`, `migration.ts` | 4 |
| `euler.ts` | `builtin-agents.ts`, `euler-agent.ts`, `anyon-config.ts` | 3 |
| `tesla.ts` | `builtin-agents.ts`, `tesla-agent.ts` | 2 |
| `nietzsche.ts` | `builtin-agents.ts`, `nietzsche.test.ts`, `tool-restrictions.test.ts` | 3 |
| `turing/` | `builtin-agents.ts`, `hooks/index.ts`, `tool-restrictions.test.ts` | 3 |
| `newton/` | `agents/index.ts`, `newton-prompt.test.ts`, `newton-agent-config-builder.ts` | 3 |
| `faraday/` | `agent-config-handler.ts`, `config-handler.test.ts`, `faraday-agent.ts` | 3 |
| `davinci.ts` | `builtin-agents.ts` | **1 (lowest)** |

### 3.3 순환 의존성 분석

**결과: 완전 비순환 (ACYCLIC) ✅**
- 에이전트 간 상호 import 없음
- 모든 에이전트가 `types.ts`를 단방향으로 import
- `builtin-agents.ts`가 유일한 레지스트리 (단방향)
- `agent-display-names.ts`는 순수 데이터 파일

→ **어떤 순서로든 리네임 가능. 순환 의존성으로 인한 deadlock 위험 없음.**

---

## 4. 특수 처리 필요 사항

### 4.1 `explore` → `scout` 특수 처리

`explore`는 코드에서 에이전트명과 `subagent_type` 양쪽으로 사용됨.

**에이전트명 컨텍스트 (MUST 변경):**
- `BuiltinAgentNameSchema` Zod enum의 `"explore"` 값
- `BuiltinAgentName` type union의 `"explore"` 멤버
- `agentSources` Record 키의 `"explore"`
- `AGENT_DISPLAY_NAMES` Record 키의 `"explore"`
- `AGENT_NAME_MAP`의 `"explore"` 값
- `createExploreAgent` 함수명
- `galileo.ts` → `scout.ts` 파일명

**subagent_type 컨텍스트 (MUST 함께 변경):**
- `src/tools/delegate-task/` — `subagent_type="explore"` → `subagent_type="scout"`
- `src/tools/call-anyon-agent/constants.ts` — `ALLOWED_AGENTS` 리스트의 `"explore"`
- 각종 hook/handler에서 agent name으로 `"explore"` 비교하는 곳

**문자열 컨텍스트 (DO NOT TOUCH):**
- 일반 영어 동사 "explore"가 주석/프롬프트에서 사용되는 곳
- `"Let me explore the codebase"` 같은 프롬프트 텍스트

**구분 규칙:**
```typescript
// MUST 변경: agent name으로서의 "explore"
const agent: BuiltinAgentName = "explore";  // → "scout"
subagent_type: "explore"                     // → "scout"
ALLOWED_AGENTS.includes("explore")           // → "scout"

// DO NOT TOUCH: 일반 영어 동사로서의 "explore"
"Let me explore the codebase"                // 유지
"I'll explore different approaches"          // 유지
```

### 4.2 `conductor` — 기존 `orchestrator` 참조 처리

현재 코드에서 "orchestrator"라는 단어가 설명 문맥에서 사용되는 곳이 있음.
새 agent name이 `conductor`이므로 이 설명들은 수정 불필요.

**단, 프롬프트/설명에서 "conductor"로 업데이트해야 할 곳:**
- euler agent의 자기 소개 프롬프트
- README/docs에서 euler를 설명하는 부분

### 4.3 `craftsman` — 기존 `builder` 참조 처리

`agent-builder.ts`, `buildAgent()` 등 기존 builder 패턴은 agent name과 무관하므로 변경 불필요.

**구분 규칙:**
```typescript
// MUST 변경: agent name으로서의 "tesla"/"builder"
const agent: BuiltinAgentName = "tesla";     // → "craftsman"
createTeslaAgent(...)                         // → createCraftsmanAgent(...)

// DO NOT TOUCH: builder 패턴
agent-builder.ts                              // 유지
buildAgent(config)                            // 유지
PromptSectionBuilder                          // 유지
```

### 4.4 `worker` — Bun Worker 구분

**구분 규칙:**
```typescript
// MUST 변경: agent name으로서의 "faraday"/"worker"
const agent: BuiltinAgentName = "faraday";   // → "worker"
createFaradayAgent(...)                       // → createWorkerAgent(...)

// DO NOT TOUCH: Bun Worker 스레드
new Worker("./discover-worker.ts")            // 유지
import type { WorkerMessage } from "./types"  // 유지
```

### 4.5 `OpenCode-Builder` — 절대 변경 금지

`OpenCode-Builder`는 OpenCode 호스트 빌더 에이전트의 참조명이며, 플러그인 에이전트명이 아님.
이번 리네임에서 절대 건드리지 않음.

---

## 5. 롤백 전략

### 5.1 Git 기반 롤백

각 Phase 시작 전에 git commit 또는 stash를 생성하여 롤백 포인트 확보.

```bash
# Phase 시작 전
git stash push -m "pre-phase-N-rename"

# 또는 WIP 커밋
git add -A && git commit -m "WIP: pre-phase-N checkpoint"
```

### 5.2 Phase별 검증 체크포인트

**각 Phase 완료 후 반드시 실행:**
```bash
bun run typecheck    # tsc --noEmit — 타입 에러 0 확인
```

**Phase 2, 3, 4, 5 완료 후 추가 실행:**
```bash
bun test             # 테스트 스위트 통과 확인
```

**전체 완료 후 (Phase 9):**
```bash
bun run typecheck && bun test && bun run build
```

### 5.3 실패 시 복구 절차

1. 현재 Phase의 변경사항 확인: `git diff --stat`
2. 타입 에러 발생 시: 해당 파일만 수정 시도
3. 3회 이상 실패 시: `git stash pop` 또는 `git reset --hard HEAD~1`로 롤백
4. 원인 분석 후 계획 수정하여 재시도

---

## 6. 실행 계획 (Phase별)

### Phase 0: 하위 호환성 기반 구축

**영향 파일:** ~5개
**검증:** `bun run typecheck`

#### 0-1. 마이그레이션 맵 확장

**파일:** `src/shared/migration/agent-names.ts`

`AGENT_NAME_MAP`에 2세대 → 3세대 매핑 추가:

```typescript
// 기존 1세대 → 3세대 매핑 (직접)
sisyphus: "conductor",
"sisyphus-junior": "worker",
hephaestus: "craftsman",
oracle: "advisor",
librarian: "researcher",
explore: "scout",
"multimodal-looker": "inspector",
prometheus: "strategist",
metis: "analyst",
momus: "critic",
atlas: "taskmaster",

// 신규 2세대 → 3세대 매핑
euler: "conductor",
faraday: "worker",
tesla: "craftsman",
socrates: "advisor",
curie: "researcher",
galileo: "scout",
davinci: "inspector",
lovelace: "analyst",
nietzsche: "critic",
turing: "taskmaster",
newton: "strategist",
```

#### 0-2. BUILTIN_AGENT_NAMES 업데이트

```typescript
export const BUILTIN_AGENT_NAMES = new Set([
  "conductor",
  "craftsman",
  "advisor",
  "researcher",
  "scout",
  "inspector",
  "analyst",
  "critic",
  "taskmaster",
  "strategist",
  "worker",
  "build",
]);
```

#### 0-3. 설정 스키마 alias 검증

Zod enum이 마이그레이션 레이어 이후에 검증되므로, 새 이름만 enum에 넣고
마이그레이션이 먼저 돌아가는지 확인.

---

### Phase 1: 타입 시스템 (Source of Truth)

**영향 파일:** ~5개
**검증:** `bun run typecheck` (많은 에러가 나오지만 이후 Phase에서 해결)

#### 1-1. Zod 스키마 enum

**파일:** `src/config/schema/agent-names.ts`

```typescript
export const BuiltinAgentNameSchema = z.enum([
  "conductor", "craftsman", "strategist", "advisor", "researcher",
  "scout", "inspector", "analyst", "critic", "taskmaster",
]);
```

#### 1-2. TypeScript union

**파일:** `src/agents/types.ts`

```typescript
export type BuiltinAgentName =
  | "conductor" | "craftsman" | "advisor" | "researcher"
  | "scout" | "inspector" | "analyst" | "critic" | "taskmaster";
```

> **참고:** `worker`와 `strategist`가 `BuiltinAgentName`에 포함되는지는 기존 코드 구조 확인 필요.
> `faraday`(worker)는 euler-junior의 내부 스폰이므로 타입에 포함 여부가 다를 수 있음.

#### 1-3. Display Names

**파일:** `src/shared/agent-display-names.ts`

```typescript
export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  conductor: "Conductor (Turbo)",
  craftsman: "Craftsman (Deep)",
  strategist: "Strategist",
  taskmaster: "Taskmaster",
  worker: "Worker",
  analyst: "Analyst",
  critic: "Critic",
  advisor: "Advisor",
  researcher: "Researcher",
  scout: "Scout",
  inspector: "Inspector",
};
```

---

### Phase 2: 에이전트 구현 파일 리네임

**영향 파일:** ~30개
**검증:** `bun run typecheck`

#### 2-1. 에이전트 정의 파일

```
src/agents/euler.ts                    → src/agents/conductor.ts
src/agents/tesla.ts                    → src/agents/craftsman.ts
src/agents/socrates.ts                 → src/agents/advisor.ts
src/agents/curie.ts                    → src/agents/researcher.ts
src/agents/galileo.ts                  → src/agents/scout.ts
src/agents/davinci.ts                  → src/agents/inspector.ts
src/agents/lovelace.ts                 → src/agents/analyst.ts
src/agents/nietzsche.ts                → src/agents/critic.ts
src/agents/euler-gemini-overlays.ts    → src/agents/conductor-gemini-overlays.ts
```

#### 2-2. 에이전트 서브디렉토리 리네임

```
src/agents/newton/                     → src/agents/strategist/
src/agents/turing/                     → src/agents/taskmaster/
src/agents/faraday/                    → src/agents/worker/
```

#### 2-3. 에이전트 빌더 파일 리네임

```
src/agents/builtin-agents/euler-agent.ts   → src/agents/builtin-agents/conductor-agent.ts
src/agents/builtin-agents/tesla-agent.ts   → src/agents/builtin-agents/craftsman-agent.ts
src/agents/builtin-agents/turing-agent.ts  → src/agents/builtin-agents/taskmaster-agent.ts
```

#### 2-4. 에이전트 레지스트리 업데이트

**파일:** `src/agents/builtin-agents.ts`

```typescript
const agentSources: Record<BuiltinAgentName, AgentSource> = {
  conductor: createConductorAgent,
  craftsman: createCraftsmanAgent,
  advisor: createAdvisorAgent,
  researcher: createResearcherAgent,
  scout: createScoutAgent,
  inspector: createInspectorAgent,
  analyst: createAnalystAgent,
  critic: createCriticAgent,
  taskmaster: createTaskmasterAgent as AgentFactory,
};
```

#### 2-5. 함수명/상수명 일괄 변경

| 현재 | 새 이름 |
|------|---------|
| `createEulerAgent` | `createConductorAgent` |
| `createTeslaAgent` | `createCraftsmanAgent` |
| `createSocratesAgent` | `createAdvisorAgent` |
| `createCurieAgent` | `createResearcherAgent` |
| `createExploreAgent` | `createScoutAgent` |
| `createDavinciAgent` | `createInspectorAgent` |
| `createLovelaceAgent` | `createAnalystAgent` |
| `createNietzscheAgent` | `createCriticAgent` |
| `createTuringAgent` | `createTaskmasterAgent` |
| `createNewtonAgent` (내부) | `createStrategistAgent` (내부) |
| `maybeCreateEulerConfig` | `maybeCreateConductorConfig` |
| `maybeCreateTeslaConfig` | `maybeCreateCraftsmanConfig` |
| `maybeCreateTuringConfig` | `maybeCreateTaskmasterConfig` |
| `SOCRATES_PROMPT_METADATA` | `ADVISOR_PROMPT_METADATA` |
| `CURIE_PROMPT_METADATA` | `RESEARCHER_PROMPT_METADATA` |
| `EXPLORE_PROMPT_METADATA` | `SCOUT_PROMPT_METADATA` |
| `DAVINCI_PROMPT_METADATA` | `INSPECTOR_PROMPT_METADATA` |
| `lovelacePromptMetadata` | `analystPromptMetadata` |
| `nietzschePromptMetadata` | `criticPromptMetadata` |
| `turingPromptMetadata` | `taskmasterPromptMetadata` |
| `newtonPromptMetadata` | `strategistPromptMetadata` |

---

### Phase 3: 훅(Hook) 디렉토리 및 파일 리네임

**영향 파일:** ~25개
**검증:** `bun run typecheck`

#### 3-1. 훅 디렉토리 리네임

```
src/hooks/turing/                      → src/hooks/taskmaster/
src/hooks/no-euler-gpt/                → src/hooks/no-conductor-gpt/
src/hooks/no-tesla-non-gpt/            → src/hooks/no-craftsman-non-gpt/
src/hooks/newton-md-only/              → src/hooks/strategist-md-only/
src/hooks/faraday-notepad/             → src/hooks/worker-notepad/
```

#### 3-2. 관련 상수/참조 변경

**주요 파일:**
- `src/hooks/no-conductor-gpt/hook.ts` — euler 참조 교체
- `src/hooks/no-craftsman-non-gpt/hook.ts` — tesla 참조 교체
- `src/hooks/strategist-md-only/constants.ts` — newton 참조 교체
- `src/hooks/strategist-md-only/agent-matcher.ts` — newton 참조 교체
- `src/hooks/strategist-md-only/agent-resolution.ts` — newton 참조 교체
- `src/hooks/taskmaster/*.ts` — turing 참조 교체

---

### Phase 4: 플러그인 핸들러 & 도구(Tools) 변경

**영향 파일:** ~20개
**검증:** `bun run typecheck && bun test`

#### 4-1. 플러그인 핸들러

```
src/plugin-handlers/newton-agent-config-builder.ts → src/plugin-handlers/strategist-agent-config-builder.ts
```

내부 참조 변경:
- `src/plugin-handlers/agent-config-handler.ts` — 에이전트명 참조
- `src/plugin-handlers/agent-key-remapper.ts` — 에이전트 키 매핑
- `src/plugin-handlers/agent-priority-order.ts` — 에이전트 순서
- `src/plugin-handlers/plan-model-inheritance.ts` — newton/strategist 참조

#### 4-2. 도구 파일 변경

```
src/tools/delegate-task/faraday-agent.ts → src/tools/delegate-task/worker-agent.ts
```

내부 참조 변경:
- `src/tools/delegate-task/subagent-resolver.ts` — 에이전트명 리졸버
- `src/tools/delegate-task/constants.ts` — 에이전트 상수
- `src/tools/call-anyon-agent/constants.ts` — `ALLOWED_AGENTS` 목록 (`"explore"` → `"scout"` 포함)
- `src/tools/look-at/multimodal-agent-metadata.ts` — davinci → inspector 참조

#### 4-3. 설정 스키마 파일

```
src/config/schema/euler.ts          → src/config/schema/conductor.ts
src/config/schema/euler-agent.ts    → src/config/schema/conductor-agent.ts
```

---

### Phase 5: Shared 유틸리티 변경

**영향 파일:** ~15개
**검증:** `bun run typecheck && bun test`

#### 5-1. 에이전트 관련 공유 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/shared/agent-display-names.ts` | Phase 1에서 완료 |
| `src/shared/agent-tool-restrictions.ts` | 제한 맵 키 교체 |
| `src/shared/agent-variant.ts` | 에이전트명 참조 교체 |
| `src/shared/model-requirements.ts` | 에이전트별 모델 폴백 체인 키 교체 |
| `src/shared/migration/agent-names.ts` | Phase 0에서 완료 |
| `src/shared/migration/agent-category.ts` | 카테고리 마이그레이션 키 교체 |

#### 5-2. 모델 해석 파이프라인

| 파일 | 변경 내용 |
|------|----------|
| `src/shared/model-resolver.ts` | 에이전트명 기반 분기 로직 |
| `src/shared/model-requirements.ts` | `AGENT_MODEL_REQUIREMENTS` 키 교체 |
| `src/shared/fallback-model-availability.ts` | 폴백 체인 에이전트명 |

---

### Phase 6: 프롬프트 & 키워드 변경

**영향 파일:** ~20개
**검증:** `bun run typecheck`

#### 6-1. 에이전트 시스템 프롬프트

에이전트 `.ts` 파일 내 `instructions` 문자열에서 에이전트명 참조 교체.
특히 Conductor(구 Euler) 프롬프트에서 다른 에이전트를 참조하는 부분 전부 업데이트.

**주요 파일:**
- `src/agents/conductor.ts` — 모든 서브에이전트 이름 참조
- `src/agents/strategist/system-prompt.ts` — 전략가 프롬프트
- `src/agents/taskmaster/agent.ts` — 태스크마스터 프롬프트
- `src/agents/taskmaster/default.ts`, `gpt.ts`, `gemini.ts` — 모델별 변형

**주의:** 프롬프트 내에서 에이전트를 설명하는 일반 영어 텍스트는 내용상 적절히 수정.
예: "Euler orchestrates tasks" → "Conductor coordinates tasks"

#### 6-2. 프롬프트 파일 리네임

```
euler-prompt.md → conductor-prompt.md
```

#### 6-3. 키워드 디텍터

`src/hooks/keyword-detector/` 내 에이전트명 참조 교체:
- `turbo/default.ts` — curie/researcher 키 트리거
- `turbo/gpt5.2.ts` — curie/researcher 키 트리거
- `turbo/gemini.ts` — 에이전트명 참조
- `turbo/planner.ts` — newton/strategist 참조

**⚠️ `turbo/planner.ts` 파일 자체는 리네임하지 않음** — 이 파일은 "planner" 키워드를 감지하는 모듈이지, 에이전트 파일이 아님. 내부의 newton → strategist 참조만 변경.

---

### Phase 7: 테스트 파일 업데이트

**영향 파일:** ~45개
**검증:** `bun test`

#### 7-1. 파일 이동 + 내용 변경

| 현재 | 새 경로 |
|------|---------|
| `src/agents/nietzsche.test.ts` | `src/agents/critic.test.ts` |
| `src/agents/newton-prompt.test.ts` | `src/agents/strategist-prompt.test.ts` |
| `src/agents/faraday/index.test.ts` | `src/agents/worker/index.test.ts` |
| `src/hooks/turing/index.test.ts` | `src/hooks/taskmaster/index.test.ts` |
| `src/hooks/no-euler-gpt/index.test.ts` | `src/hooks/no-conductor-gpt/index.test.ts` |
| `src/hooks/no-tesla-non-gpt/index.test.ts` | `src/hooks/no-craftsman-non-gpt/index.test.ts` |
| `src/hooks/newton-md-only/index.test.ts` | `src/hooks/strategist-md-only/index.test.ts` |
| `src/plugin-handlers/plan-model-inheritance.test.ts` | 내용만 변경 |

#### 7-2. 내용만 변경 (파일 이동 없음)

에이전트명을 하드코딩한 테스트 파일 ~40개:
- `src/agents/tool-restrictions.test.ts`
- `src/agents/utils.test.ts`
- `src/agents/dynamic-agent-prompt-builder.test.ts`
- `src/shared/migration.test.ts`
- `src/shared/agent-display-names.test.ts`
- `src/shared/agent-config-integration.test.ts`
- `src/tools/delegate-task/tools.test.ts`
- `src/tools/call-anyon-agent/*.test.ts`
- `src/hooks/keyword-detector/index.test.ts`
- `src/cli/model-fallback.test.ts`
- `src/config/schema.test.ts`
- 그 외 ~25개

---

### Phase 8: 문서 업데이트

**영향 파일:** ~47개
**검증:** 수동 검토

#### 8-1. AGENTS.md (32개)

루트 `AGENTS.md` 및 하위 디렉토리 `AGENTS.md` 파일에서 에이전트명 참조 전부 교체.

**주요 파일:**
- `engine/AGENTS.md` (루트)
- `engine/src/AGENTS.md`
- `engine/src/agents/AGENTS.md`
- `engine/src/hooks/AGENTS.md`
- `engine/src/tools/AGENTS.md`
- `engine/src/shared/AGENTS.md`
- `engine/src/config/AGENTS.md`
- 기타 ~25개

#### 8-2. README (4개 언어)

- `README.md`, `README.ko.md`, `README.ja.md`, `README.zh-cn.md`
- 에이전트 소개 섹션, 테이블, 예시 교체

**특별 주의:**
- README의 "Euler Labs" 외부 링크/로고는 변경하지 않음 (외부 서비스명)
- "Euler orchestrates Tesla, Socrates, Curie, Explore" → "Conductor coordinates Craftsman, Advisor, Researcher, Scout"

#### 8-3. 가이드 문서

- `docs/guide/overview.md`
- `docs/guide/orchestration.md`
- `docs/reference/features.md`
- `docs/reference/configuration.md`

#### 8-4. 기존 계획 문서

- `REBRANDING-PLAN.md` — 에이전트명 테이블을 3세대 이름으로 업데이트

---

### Phase 9: 빌드 검증 & 최종 확인

#### 9-1. 전체 검증 스위트

```bash
bun run typecheck    # tsc --noEmit, 에러 0 확인
bun run lint         # eslint 에러 확인
bun run lint:fix     # 자동 수정 가능한 항목 처리
bun test             # 전체 테스트 스위트 통과 확인
bun run build        # ESM 빌드 + 스키마 생성 확인
```

#### 9-2. 기능 검증 체크리스트

- [ ] `bun run typecheck` 통과
- [ ] `bun test` 통과
- [ ] `bun run build` 통과
- [ ] 마이그레이션 테스트: `{ agents: { euler: {...} } }` → `{ agents: { conductor: {...} } }` 자동 변환 확인
- [ ] 마이그레이션 테스트: `{ agents: { sisyphus: {...} } }` → `{ agents: { conductor: {...} } }` 자동 변환 확인 (1세대→3세대 직접)
- [ ] 마이그레이션 테스트: `{ agents: { turing: {...} } }` → `{ agents: { taskmaster: {...} } }` 자동 변환 확인
- [ ] 새 이름으로 에이전트 호출 정상 동작 확인
- [ ] Display name이 CLI/로그에 올바르게 표시되는지 확인
- [ ] `subagent_type="scout"` 동작 확인 (구 `explore`)
- [ ] `ALLOWED_AGENTS`에 `"scout"` 포함 확인

---

## 7. 실행 순서 (의존성 기반)

```
Phase 0 (호환성)
  ↓
Phase 1 (타입 시스템) ← 모든 Phase의 기반
  ↓                     ★ typecheck (에러 많이 나옴 — 정상)
Phase 2 (에이전트 파일) + Phase 3 (훅 파일) ← 병렬 가능
  ↓                     ★ typecheck
Phase 4 (핸들러/도구) + Phase 5 (shared) ← 병렬 가능
  ↓                     ★ typecheck + test
Phase 6 (프롬프트/키워드)
  ↓                     ★ typecheck
Phase 7 (테스트) + Phase 8 (문서) ← 병렬 가능
  ↓                     ★ test
Phase 9 (빌드 검증)     ★ typecheck + test + build + lint
```

### 병렬화 전략

| 단계 | 작업 | 병렬 에이전트 수 | 체크포인트 |
|------|------|--------------|----------|
| 1단계 | Phase 0 + 1 | 1 (순차, 기반 작업) | typecheck |
| 2단계 | Phase 2 + 3 | 2 (에이전트 파일 vs 훅 파일) | typecheck |
| 3단계 | Phase 4 + 5 | 2 (핸들러/도구 vs shared) | typecheck + test |
| 4단계 | Phase 6 | 1 (프롬프트 변경은 세심한 주의 필요) | typecheck |
| 5단계 | Phase 7 + 8 | 2 (테스트 vs 문서) | test |
| 6단계 | Phase 9 | 1 (빌드/테스트 검증) | full suite |

---

## 8. DO NOT TOUCH 종합 목록

리네임 과정에서 **절대 변경하면 안 되는** 파일/식별자 목록.

### 파일 (변경 금지)

| 파일 | 이유 |
|------|------|
| `src/hooks/anthropic-context-window-limit-recovery/executor.ts` | Compaction executor |
| `src/hooks/auto-slash-command/executor.ts` | Slash command executor |
| `src/tools/delegate-task/executor.ts` | Task delegation executor |
| `src/tools/delegate-task/executor-types.ts` | ExecutorContext type |
| `src/features/tmux-subagent/action-executor.ts` | Tmux action executor |
| `src/shared/command-executor.ts` | Command execution utility |
| `src/tools/call-anyon-agent/sync-executor.ts` | Sync execution |
| `src/tools/call-anyon-agent/background-executor.ts` | Background execution |
| `src/agents/agent-builder.ts` | Agent build utility (NOT agent name) |
| `src/agents/dynamic-agent-prompt-builder.ts` | Prompt builder (NOT agent name) |
| `src/agents/newton/newton-agent-config-builder.ts` | Config builder (파일 자체는 리네임하지만, builder 접미사 유지) |
| `src/features/opencode-skill-loader/blocking.ts` | Bun Worker thread |
| `src/features/opencode-skill-loader/discover-worker.ts` | Bun Worker |
| `src/features/opencode-skill-loader/skill-worker.ts` | Skill Worker |
| `src/hooks/keyword-detector/turbo/planner.ts` | Keyword detection module (파일명 유지, 내부 newton→strategist만 변경) |

### 식별자 (변경 금지)

| 식별자 | 이유 |
|--------|------|
| `ExecutorContext` | delegate-task 인프라 타입 |
| `CommandExecutor` | 명령어 실행 유틸리티 |
| `SyncExecutor` / `BackgroundExecutor` | call-anyon-agent 실행기 |
| `buildAgent()` | 에이전트 빌드 함수 (NOT agent name) |
| `PromptSectionBuilder` | 프롬프트 빌드 클래스 |
| `buildAvailableSkills()` | 스킬 빌드 함수 |
| `AgentConfigBuilder` | 설정 빌드 클래스 |
| `OpenCode-Builder` | OpenCode 호스트 빌더 에이전트명 |
| `new Worker(...)` | Bun Worker 생성자 |
| `WorkerMessage` / `WorkerResponse` | Bun Worker 타입 |

---

## 9. 핵심 주의사항 요약

### 1. Blind Replace 금지
새 에이전트 이름이 안전하게 선택되었지만, 여전히 에이전트명 컨텍스트에서만 치환해야 함.
특히 `worker`는 Bun Worker와 겹치므로 소문자 문자열 리터럴 vs `new Worker()` 구분 필수.

### 2. 치환 순서
긴 문자열부터 치환하여 부분 매칭 방지:
```
conductor-gemini-overlays  (먼저)
conductor                   (나중)
```

### 3. explore → scout 특수 처리
`subagent_type="explore"` 컨텍스트도 함께 `"scout"`로 변경.
일반 영어 동사 "explore"는 그대로 유지.

### 4. OpenCode SDK 호환성
`@opencode-ai/sdk`의 `AgentConfig` 타입에는 에이전트 이름 제약이 없으므로 SDK 변경 불필요.

### 5. 기존 사용자 설정 보호
마이그레이션 레이어(`AGENT_NAME_MAP`)가 자동으로 구 이름 → 신 이름 변환.
1세대(sisyphus), 2세대(euler), 3세대(conductor) 모든 이름 호환.

### 6. Euler Labs 외부 서비스
README의 "Euler Labs" 브랜딩, 로고, 외부 링크는 변경하지 않음.
이것은 회사/제품명이지 에이전트명이 아님.

---

## 10. 작업량 요약

| Phase | 설명 | 파일 수 | 자동화 가능성 |
|-------|------|---------|-------------|
| 0 | 하위 호환성 기반 | ~5 | 수동 |
| 1 | 타입 시스템 (Source of Truth) | ~5 | 수동 |
| 2 | 에이전트 구현 파일 리네임 | ~30 | 70% 자동 (LSP rename + 파일 이동) |
| 3 | 훅 디렉토리/파일 리네임 | ~25 | 70% 자동 |
| 4 | 플러그인 핸들러/도구 | ~20 | 70% 자동 |
| 5 | Shared 유틸리티 | ~15 | 60% 자동 (컨텍스트 치환 필요) |
| 6 | 프롬프트/키워드 | ~20 | 50% 자동 (프롬프트 수동 검수) |
| 7 | 테스트 파일 | ~45 | 80% 자동 |
| 8 | 문서 | ~47 | 50% 자동 |
| 9 | 빌드 검증 | — | 수동 |
| **합계** | | **~210개 파일** | |
