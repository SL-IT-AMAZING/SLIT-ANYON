# Anyon - Full Rebranding Plan (v2)

## Overview

**현재 프로젝트**: oh-my-opencode (OmO) v3.9.0
**새 프로젝트**: Anyon
**목표**: 완전한 리브랜딩 후 새 OpenCode 플러그인으로 배포

### 변경 이력

- v1: 초안 작성
- v2: 코드베이스 전수 감사 기반 전면 개정
  - `darwin` → `euler` (macOS 플랫폼명 충돌 해소)
  - Phase 0 (호환성/마이그레이션) 신설
  - Phase 2 (타입/Export명) 신설
  - Phase 9 (CI/CD 워크플로) 신설
  - 파일 수 전면 재산정 (~185 → ~300)
  - 누락 항목 60+ 추가
  - Phase 실행 순서 재정렬

---

## 확정된 네이밍

### 서비스/패키지명

| 항목            | 현재                         | 새 이름             |
| --------------- | ---------------------------- | ------------------- |
| npm 패키지명    | `oh-my-opencode`             | `anyon`             |
| 약어            | `omo`                        | `an`                |
| PascalCase      | `OhMyOpenCode`               | `Anyon`             |
| camelCase       | `ohMyOpenCode`               | `anyon`             |
| 환경변수 prefix | `OH_MY_OPENCODE_`            | `ANYON_`            |
| 설정 파일       | `oh-my-opencode.jsonc`       | `anyon.jsonc`       |
| 상태 디렉토리   | `.sisyphus/`                 | `.anyon/`           |
| 로그 파일       | `/tmp/oh-my-opencode.log`    | `/tmp/anyon.log`    |
| 캐시 디렉토리   | `~/.cache/oh-my-opencode/`   | `~/.cache/anyon/`   |
| 스키마 파일     | `oh-my-opencode.schema.json` | `anyon.schema.json` |

### 변경하지 않는 항목 (명시적 유지)

| 항목                                  | 이유                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| `.opencode/` 디렉토리                 | OpenCode 호스트 플랫폼의 디렉토리. 플러그인 소유가 아님 |
| `~/.config/opencode/` 경로            | OpenCode 호스트 플랫폼의 설정 경로                      |
| `src/features/opencode-skill-loader/` | OpenCode 스킬 로더 기능 설명 (플러그인명이 아님)        |
| `src/features/claude-code-*` 디렉토리 | Claude Code 호환 레이어 설명 (플러그인명이 아님)        |
| `OpenCode-Builder` 에이전트명         | OpenCode 호스트 빌더 에이전트 참조 (플러그인명이 아님)  |

### 에이전트명 (11개)

| 현재                | 새 이름     | 인물              | 역할                  |
| ------------------- | ----------- | ----------------- | --------------------- |
| `sisyphus`          | `euler`     | 레온하르트 오일러 | 메인 오케스트레이터   |
| `sisyphus-junior`   | `faraday`   | 마이클 패러데이   | 포커스 실행기         |
| `hephaestus`        | `tesla`     | 니콜라 테슬라     | 딥 에이전트           |
| `oracle`            | `socrates`  | 소크라테스        | 아키텍처 컨설턴트     |
| `librarian`         | `curie`     | 마리 퀴리         | 리서치/검색           |
| `explore`           | `galileo`   | 갈릴레오          | 코드베이스 탐색       |
| `multimodal-looker` | `davinci`   | 레오나르도 다빈치 | 비전 분석             |
| `prometheus`        | `newton`    | 아이작 뉴턴       | 전략 플래너           |
| `metis`             | `lovelace`  | 에이다 러브레이스 | 사전 분석가           |
| `momus`             | `nietzsche` | 니체              | 플랜 리뷰어           |
| `atlas`             | `turing`    | 앨런 튜링         | 태스크 오케스트레이터 |

> **v1→v2 변경**: `sisyphus → darwin`에서 `sisyphus → euler`로 수정.
> `darwin`은 macOS 플랫폼 식별자(`darwin-arm64`, `darwin-x64`)와 충돌하여
> 플랫폼 바이너리명(`anyon-darwin-arm64`)에서 오치환 위험.

### 슬래시 커맨드

| 현재                 | 새 이름                     | alias (호환)                        |
| -------------------- | --------------------------- | ----------------------------------- |
| `/ralph-loop`        | `/persist-loop`             | `/ralph-loop` → 1 major 버전 유지   |
| `/cancel-ralph`      | `/cancel-persist`           | `/cancel-ralph` → 1 major 버전 유지 |
| `/ulw-loop`          | `/anyon-loop`               | `/ulw-loop` → 1 major 버전 유지     |
| `/init-deep`         | `/init-deep` (유지)         | —                                   |
| `/refactor`          | `/refactor` (유지)          | —                                   |
| `/start-work`        | `/start-work` (유지)        | —                                   |
| `/stop-continuation` | `/stop-continuation` (유지) | —                                   |
| `/handoff`           | `/handoff` (유지)           | —                                   |

### 키워드 & 메타포

| 현재                      | 새 이름                     | alias (호환)                           |
| ------------------------- | --------------------------- | -------------------------------------- |
| `ultrawork` / `ulw`       | `turbo` / `tb`              | `ultrawork`, `ulw` → 1 major 버전 유지 |
| `boulder` (메타포)        | `thesis`                    | —                                      |
| `call_omo_agent`          | `call_anyon_agent`          | `call_omo_agent` → 1 major 버전 유지   |
| "The boulder never stops" | "The experiment never ends" | —                                      |

### 타입/Export명 (v2 신규)

| 현재                       | 새 이름                | 파일                                              |
| -------------------------- | ---------------------- | ------------------------------------------------- |
| `OhMyOpenCodePlugin`       | `AnyonPlugin`          | `src/index.ts`                                    |
| `OhMyOpenCodeConfig`       | `AnyonConfig`          | 20+ 파일                                          |
| `OhMyOpenCodeConfigSchema` | `AnyonConfigSchema`    | `src/config/schema/oh-my-opencode-config.ts`      |
| `GeneratedOmoConfig`       | `GeneratedAnyonConfig` | `src/cli/model-fallback-types.ts`                 |
| `OmoConfig`                | `AnyonConfig`          | `src/cli/doctor/checks/model-resolution-types.ts` |

### 상수/마커 (v2 신규)

| 현재                              | 새 이름                             | 파일                                              |
| --------------------------------- | ----------------------------------- | ------------------------------------------------- |
| `<omo-env>`                       | `<anyon-env>`                       | `src/agents/env-context.ts`                       |
| `OMO_INTERNAL_INITIATOR_MARKER`   | `ANYON_INTERNAL_INITIATOR_MARKER`   | `src/shared/internal-initiator-marker.ts`         |
| `<!-- OMO_INTERNAL_INITIATOR -->` | `<!-- ANYON_INTERNAL_INITIATOR -->` | 동일 파일                                         |
| `OMO_SESSION_PREFIX = "omo-"`     | `ANYON_SESSION_PREFIX = "anyon-"`   | `src/hooks/interactive-bash-session/constants.ts` |
| `"omo-session"`                   | `"anyon-session"`                   | `src/tools/interactive-bash/tools.ts`             |
| `"omo-subagent-"`                 | `"anyon-subagent-"`                 | `src/shared/tmux/tmux-utils/`                     |
| `OH_MY_OPENCODE_FORCE_BASELINE`   | `ANYON_FORCE_BASELINE`              | `bin/oh-my-opencode.js`                           |
| `getOmoOpenCodeCacheDir()`        | `getAnyonCacheDir()`                | `src/shared/data-path.ts`                         |

---

## 위험 요소 & 충돌 방지

### 에이전트명 충돌 위험

| 새 이름                                  | 위험                                       | 대응                                                 |
| ---------------------------------------- | ------------------------------------------ | ---------------------------------------------------- |
| ~~`darwin`~~                             | ~~macOS 플랫폼명과 충돌~~                  | **`euler`로 변경 (v2)**                              |
| `davinci`                                | OpenAI 구 모델명 `text-davinci-003`과 유사 | 에이전트명 컨텍스트에서만 치환 (문자열 리터럴, enum) |
| `socrates`, `curie`, `galileo`, `turing` | 일반 영단어/고유명사                       | 에이전트명 컨텍스트에서만 치환                       |
| `newton`                                 | Newton 물리 엔진 등 가능                   | 에이전트명 컨텍스트에서만 치환                       |

### `omo` 약어 치환 위험

- `omo`는 `promotion`, `chromosome` 등 단어에 포함될 수 있음
- **대응**: blind sed 금지. Phase 6에서 **식별자 단위로만** 치환 (함수명, 변수명, 상수명 목록 기반)

### `.opencode/` 디렉토리

- `.opencode/`는 OpenCode 호스트 플랫폼 디렉토리 → **변경하지 않음**
- 단, 디렉토리 내 플러그인 설정 파일명만 변경: `oh-my-opencode.jsonc` → `anyon.jsonc`

---

## Phase 0: 호환성 & 마이그레이션 전략 (v2 신규)

이후 Phase에서 이름을 변경하기 전에, 하위 호환성 기반을 먼저 구축.

### 0-1. 설정 파일 마이그레이션 로직

| 파일                                | 변경                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `src/plugin-config.ts`              | 구 경로(`oh-my-opencode.jsonc`) 탐색 → 신 경로(`anyon.jsonc`)로 fallback 체인 구성 |
| `src/shared/opencode-config-dir.ts` | `omoConfig` 키를 `anyonConfig`로 변경 + 구 경로 호환 유지                          |

**동작**: 신 경로 없으면 구 경로에서 읽기. 쓰기는 항상 신 경로에.

### 0-2. 에이전트명 마이그레이션 맵 확장

| 파일                                  | 변경                                                           |
| ------------------------------------- | -------------------------------------------------------------- |
| `src/shared/migration/agent-names.ts` | 기존 `"omo" → "sisyphus"` 맵에 11개 구→신 에이전트명 매핑 추가 |

```
sisyphus        → euler
sisyphus-junior → faraday
hephaestus      → tesla
oracle          → socrates
librarian       → curie
explore         → galileo
multimodal-looker → davinci
prometheus      → newton
metis           → lovelace
momus           → nietzsche
atlas           → turing
```

### 0-3. 커맨드/키워드 alias

| 파일                                        | 변경                                                       |
| ------------------------------------------- | ---------------------------------------------------------- |
| `src/features/builtin-commands/commands.ts` | 구 커맨드명을 alias로 등록                                 |
| `src/hooks/keyword-detector/constants.ts`   | `ultrawork`/`ulw` 키워드 유지 + `turbo`/`tb` 추가          |
| `src/hooks/auto-slash-command/constants.ts` | 구 패턴 유지 + 신 패턴 추가                                |
| `src/plugin/tool-registry.ts`               | `call_omo_agent` → `call_anyon_agent` 등록 + 구 이름 alias |

### 0-4. 상태 디렉토리 마이그레이션

| 파일                                      | 변경                                                                                |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `src/features/boulder-state/constants.ts` | `.sisyphus/` 경로 → `.anyon/` + 구 경로 fallback 읽기                               |
| `src/hooks/ralph-loop/constants.ts`       | `.sisyphus/ralph-loop.local.md` → `.anyon/persist-loop.local.md` + 구 경로 fallback |

### 0-5. 환경변수 호환

| 파일                    | 변경                                                                   |
| ----------------------- | ---------------------------------------------------------------------- |
| `bin/oh-my-opencode.js` | `ANYON_FORCE_BASELINE` 읽기 + `OH_MY_OPENCODE_FORCE_BASELINE` fallback |

### 0-6. npm 패키지 전환 준비

- 구 패키지 `oh-my-opencode`에 deprecation notice 추가 (npm deprecate)
- 구 패키지의 마지막 버전에서 `anyon` 설치 안내 메시지 출력
- `anyon` 패키지명 npm 가용 여부 사전 확인

### 영향 파일: ~15개

---

## Phase 1: 서비스명 일괄 치환

자동화 가능. `sed` / find-replace로 처리. **긴 문자열부터 치환.**

### 1-1. 문자열 치환 (순서 중요)

```
OH_MY_OPENCODE  → ANYON
OhMyOpenCode    → Anyon
ohMyOpenCode    → anyon
oh-my-opencode  → anyon
oh_my_opencode  → anyon
```

### 1-2. 영향 파일 (전수 목록)

| 카테고리         | 파일 수 | 상세                                                                                                 |
| ---------------- | ------- | ---------------------------------------------------------------------------------------------------- |
| 패키지 메타      | 12      | `package.json` + 11개 플랫폼 패키지                                                                  |
| 바이너리/CLI     | 4       | `bin/oh-my-opencode.js`, `bin/platform.js`, `bin/platform.d.ts`, `postinstall.mjs`                   |
| 빌드 스크립트    | 2       | `script/build-binaries.ts`, `script/build-schema.ts`                                                 |
| 설정 스키마      | 5       | `src/config/schema/oh-my-opencode-config.ts`, config dir, config context, schema.ts, schema.test.ts  |
| 설정 로딩        | 3       | `src/plugin-config.ts`, `src/plugin-config.test.ts`, `src/shared/opencode-config-dir.ts`             |
| CLI              | 6       | `src/cli/cli-program.ts`, `cli-installer.ts`, `tui-installer.ts`, `config-manager.ts`, doctor checks |
| 로거/캐시        | 3       | `src/shared/logger.ts`, `src/shared/data-path.ts`, `src/tools/ast-grep/downloader.ts`                |
| 도구 에러 메시지 | 3       | `src/tools/call-omo-agent/tools.ts`, `src/tools/delegate-task/category-resolver.ts`                  |
| 스키마 파일      | 2       | `assets/oh-my-opencode.schema.json`, `dist/oh-my-opencode.schema.json`                               |
| 소스코드 기타    | ~70     | 나머지 모든 `oh-my-opencode` 문자열 참조                                                             |

### 1-3. 파일명 변경

```
bin/oh-my-opencode.js                           → bin/anyon.js
assets/oh-my-opencode.schema.json               → assets/anyon.schema.json
src/config/schema/oh-my-opencode-config.ts       → src/config/schema/anyon-config.ts
```

### 영향 파일: ~110개 (561 매치)

---

## Phase 2: 타입/Export명 변경 (v2 신규)

Public API를 구성하는 타입과 export 심볼 변경. Phase 1의 일괄 치환과 별도로 **수동 확인 필요**.

### 2-1. 핵심 타입명 변경

| 현재                       | 새 이름                | 파일                                                | 참조 수    |
| -------------------------- | ---------------------- | --------------------------------------------------- | ---------- |
| `OhMyOpenCodePlugin`       | `AnyonPlugin`          | `src/index.ts:16, 95`                               | 1 (export) |
| `OhMyOpenCodeConfig`       | `AnyonConfig`          | `src/config/schema/oh-my-opencode-config.ts` 외 20+ | ~25        |
| `OhMyOpenCodeConfigSchema` | `AnyonConfigSchema`    | `src/config/schema/oh-my-opencode-config.ts:23`     | ~5         |
| `GeneratedOmoConfig`       | `GeneratedAnyonConfig` | `src/cli/model-fallback-types.ts`                   | ~3         |
| `OmoConfig`                | `AnyonConfig`          | `src/cli/doctor/checks/model-resolution-types.ts`   | ~2         |

### 2-2. package.json exports 경로

```json
// 변경 전
"./schema.json": "./dist/oh-my-opencode.schema.json"
// 변경 후
"./schema.json": "./dist/anyon.schema.json"
```

### 2-3. 스키마 $id URL

```json
// 변경 전 (assets/oh-my-opencode.schema.json)
"$id": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/.../oh-my-opencode.schema.json"
// 변경 후
"$id": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/.../anyon.schema.json"
```

> GitHub 리포가 리네임되면 이 URL도 함께 변경 필요. 리포 리네임 여부는 별도 결정.

### 영향 파일: ~30개

---

## Phase 3: 에이전트 이름 변경

### 3-1. 타입 시스템 (Source of Truth — 반드시 먼저)

| 파일                                  | 변경                                                                |
| ------------------------------------- | ------------------------------------------------------------------- |
| `src/config/schema/agent-names.ts`    | `BuiltinAgentNameSchema` enum 값 전부 교체 (10개)                   |
| `src/config/schema/agent-names.ts`    | `OverridableAgentNameSchema` enum 값 교체 (`OpenCode-Builder` 유지) |
| `src/agents/types.ts`                 | TypeScript union 교체                                               |
| `src/shared/migration/agent-names.ts` | Phase 0에서 추가한 마이그레이션 맵 검증                             |

### 3-2. 에이전트 레지스트리 & 메타데이터

| 파일                                    | 변경                                    |
| --------------------------------------- | --------------------------------------- |
| `src/agents/builtin-agents.ts`          | `agentSources`, `agentMetadata` 키 교체 |
| `src/shared/agent-display-names.ts`     | 디스플레이 이름 맵 교체                 |
| `src/shared/agent-tool-restrictions.ts` | 제한 맵 키 교체                         |

### 3-3. 에이전트 구현 파일 리네임

```
src/agents/sisyphus.ts                → src/agents/euler.ts
src/agents/sisyphus-junior/           → src/agents/faraday/
src/agents/hephaestus.ts              → src/agents/tesla.ts
src/agents/oracle.ts                  → src/agents/socrates.ts
src/agents/librarian.ts               → src/agents/curie.ts
src/agents/explore.ts                 → src/agents/galileo.ts
src/agents/multimodal-looker.ts       → src/agents/davinci.ts
src/agents/prometheus/                → src/agents/newton/
src/agents/metis.ts                   → src/agents/lovelace.ts
src/agents/momus.ts                   → src/agents/nietzsche.ts
src/agents/atlas/                     → src/agents/turing/
```

### 3-4. 에이전트별 설정 빌더 리네임

```
src/agents/builtin-agents/sisyphus-agent.ts        → src/agents/builtin-agents/euler-agent.ts
src/agents/builtin-agents/hephaestus-agent.ts      → src/agents/builtin-agents/tesla-agent.ts
src/agents/builtin-agents/atlas-agent.ts            → src/agents/builtin-agents/turing-agent.ts
src/plugin-handlers/prometheus-agent-config-builder.ts → src/plugin-handlers/newton-agent-config-builder.ts
```

### 3-5. 에이전트별 훅 디렉토리 리네임

```
src/hooks/atlas/                      → src/hooks/turing/
src/hooks/sisyphus-junior-notepad/    → src/hooks/faraday-notepad/
src/hooks/no-sisyphus-gpt/            → src/hooks/no-euler-gpt/
src/hooks/no-hephaestus-non-gpt/      → src/hooks/no-tesla-non-gpt/
src/hooks/prometheus-md-only/         → src/hooks/newton-md-only/
src/hooks/ralph-loop/                 → src/hooks/persist-loop/
```

### 3-6. delegate-task 도구 파일

```
src/tools/delegate-task/sisyphus-junior-agent.ts → src/tools/delegate-task/faraday-agent.ts
```

### 3-7. 설정 스키마 파일

```
src/config/schema/sisyphus.ts          → src/config/schema/euler.ts
src/config/schema/sisyphus-agent.ts    → src/config/schema/euler-agent.ts
src/config/schema/ralph-loop.ts        → src/config/schema/persist-loop.ts
```

### 3-8. 소스코드 내 에이전트명 문자열 치환

**치환 순서 (긴 것부터, 충돌 방지)**:

```
sisyphus-junior    → faraday
sisyphus           → euler          (sisyphus-junior를 먼저 치환!)
hephaestus         → tesla
multimodal-looker  → davinci
prometheus         → newton
metis              → lovelace
momus              → nietzsche
atlas              → turing         (주의: 일반 단어, 에이전트 컨텍스트만)
oracle             → socrates       (주의: 일반 단어, 에이전트 컨텍스트만)
librarian          → curie          (주의: 일반 단어, 에이전트 컨텍스트만)
explore            → galileo        (주의: 일반 동사, 에이전트 컨텍스트만)
```

**컨텍스트 제한 치환 대상** (`oracle`, `librarian`, `explore`, `atlas`, `davinci`):
→ Zod enum 값, 문자열 리터럴 (`"oracle"`, `'explore'`), 타입 유니온, 에이전트 메타데이터 키에서만 치환
→ 일반 영어 텍스트, 주석, 문서의 일반적 용법은 치환하지 않음

### 3-9. 프롬프트 파일

```
sisyphus-prompt.md → euler-prompt.md (파일명 + 내부 Sisyphus/OhMyOpenCode 참조)
```

### 영향 파일: ~80개

---

## Phase 4: 커맨드 & 키워드 변경

### 4-1. 커맨드 정의

| 파일                                        | 변경                                              |
| ------------------------------------------- | ------------------------------------------------- |
| `src/features/builtin-commands/types.ts`    | `BuiltinCommandName` union 교체 + alias 타입 추가 |
| `src/features/builtin-commands/commands.ts` | 커맨드 등록명 교체 + Phase 0의 alias 연결         |
| `src/config/schema/commands.ts`             | `BuiltinCommandNameSchema` Zod enum 값 교체       |

### 4-2. 커맨드 템플릿

| 파일                                                           | 변경                                                             |
| -------------------------------------------------------------- | ---------------------------------------------------------------- |
| `src/features/builtin-commands/templates/ralph-loop.ts`        | 파일명 → `persist-loop.ts`, 내용 교체, `/cancel-ralph` 참조 교체 |
| `src/features/builtin-commands/templates/stop-continuation.ts` | `ralph`, `boulder` 참조 교체                                     |
| `src/features/builtin-commands/templates/start-work.ts`        | `.sisyphus`, `boulder` 참조 교체                                 |

### 4-3. 키워드 디텍터

```
src/hooks/keyword-detector/ultrawork/ → src/hooks/keyword-detector/turbo/
```

| 파일                                                  | 변경                                                                  |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `src/hooks/keyword-detector/constants.ts`             | 디텍터명 교체 + 구 키워드 alias 유지                                  |
| `src/hooks/keyword-detector/turbo/`                   | 키워드 `ultrawork`/`ulw` → `turbo`/`tb` (alias로 구 키워드 병행 인식) |
| `src/hooks/keyword-detector/turbo/source-detector.ts` | 내부 참조 교체                                                        |
| `src/hooks/keyword-detector/turbo/default.ts`         | 내부 참조 교체                                                        |
| `src/hooks/keyword-detector/turbo/gemini.ts`          | 내부 참조 교체                                                        |
| `src/hooks/keyword-detector/turbo/gpt5.2.ts`          | 내부 참조 교체                                                        |
| `src/hooks/keyword-detector/turbo/planner.ts`         | 내부 참조 교체                                                        |
| `src/hooks/auto-slash-command/constants.ts`           | 패턴 교체 + 구 패턴 유지                                              |

### 4-4. ultrawork 관련 모듈

| 파일                                             | 변경                                          |
| ------------------------------------------------ | --------------------------------------------- |
| `src/plugin/ultrawork-model-override.ts`         | 파일명 → `turbo-model-override.ts`, 내용 교체 |
| `src/plugin/ultrawork-model-override.test.ts`    | 파일명 → `turbo-model-override.test.ts`       |
| `src/plugin/ultrawork-db-model-override.ts`      | 파일명 → `turbo-db-model-override.ts`         |
| `src/plugin/ultrawork-db-model-override.test.ts` | 파일명 → `turbo-db-model-override.test.ts`    |
| `src/config/schema/agent-overrides.ts`           | `ultrawork` 참조 교체                         |

### 영향 파일: ~25개

---

## Phase 5: 메타포 & 철학 변경

### 5-1. "Boulder" → "Thesis" 시스템

```
boulder-state    → thesis-state    (디렉토리명)
BoulderState     → ThesisState     (타입명)
boulder          → thesis          (변수/상수명)
```

| 파일                                                         | 변경                                       |
| ------------------------------------------------------------ | ------------------------------------------ |
| `src/features/boulder-state/` → `src/features/thesis-state/` | 디렉토리명                                 |
| `src/features/boulder-state/constants.ts`                    | 상수명, `.sisyphus/` 경로 → `.anyon/`      |
| `src/features/boulder-state/types.ts`                        | 타입명                                     |
| `src/features/boulder-state/storage.ts`                      | 변수명 + 경로                              |
| `src/features/boulder-state/storage.test.ts`                 | 테스트 내용                                |
| `src/hooks/turing/boulder-continuation-injector.ts`          | 파일명 → `thesis-continuation-injector.ts` |

### 5-2. `.sisyphus/` → `.anyon/`

| 파일                                               | 변경                                                       |
| -------------------------------------------------- | ---------------------------------------------------------- |
| `.sisyphus/` 디렉토리                              | `.anyon/`으로 리네임                                       |
| `src/hooks/atlas/sisyphus-path.ts`                 | 파일명 → `src/hooks/turing/anyon-path.ts`, regex 패턴 교체 |
| `src/hooks/atlas/system-reminder-templates.ts`     | `.sisyphus/` 경로 → `.anyon/`                              |
| `src/hooks/atlas/verification-reminders.ts`        | `.sisyphus` 참조 교체                                      |
| `src/features/run-continuation-state/constants.ts` | `.sisyphus` 경로 교체                                      |
| `src/features/claude-tasks/storage.ts`             | `.sisyphus/tasks` 경로 교체                                |
| `src/hooks/rules-injector/constants.ts`            | `.sisyphus/rules` 경로 교체                                |
| `src/hooks/ralph-loop/constants.ts`                | `.sisyphus/ralph-loop.local.md` 경로 교체                  |
| 코드 내 모든 `.sisyphus` 경로 참조 (~60 파일)      | `.anyon`으로 교체                                          |

### 5-3. 프롬프트 재작성

| 파일                                     | 변경        |
| ---------------------------------------- | ----------- |
| `euler-prompt.md` (Phase 3에서 리네임됨) | 철학 재작성 |

**새 철학**:

- "The experiment never ends." (실험은 끝나지 않는다)
- "Standing on the shoulders of giants." (거인의 어깨 위에 서서)
- Thesis = 현재 진행 중인 연구/프로젝트 (boulder 대체)

### 영향 파일: ~70개 (boulder 188매치 + .sisyphus 323매치, 파일 중복 제거)

---

## Phase 6: 내부 약어/상수/경로 치환

> **주의**: 이 Phase는 blind sed 금지. 아래 목록의 **식별자 단위로만** 치환.

### 6-1. 디렉토리명 변경

```
src/tools/call-omo-agent/  → src/tools/call-anyon-agent/
```

### 6-2. 함수/변수명 치환

```
call_omo_agent          → call_anyon_agent
createCallOmoAgent      → createCallAnyonAgent
CALL_OMO_AGENT_DESCRIPTION → CALL_ANYON_AGENT_DESCRIPTION
writeOmoConfig          → writeAnyonConfig
generateOmoConfig       → generateAnyonConfig
getOmoConfigPath        → getAnyonConfigPath
loadOmoConfig           → loadAnyonConfig
omoConfig               → anyonConfig
omoConfigPath           → anyonConfigPath
getOmoOpenCodeCacheDir  → getAnyonCacheDir
```

### 6-3. 파일명 변경

```
src/cli/config-manager/write-omo-config.ts      → src/cli/config-manager/write-anyon-config.ts
src/cli/config-manager/write-omo-config.test.ts  → src/cli/config-manager/write-anyon-config.test.ts
src/cli/config-manager/generate-omo-config.ts    → src/cli/config-manager/generate-anyon-config.ts
```

### 6-4. 상수/마커 치환 (Phase에서 명시된 목록)

```
OMO_INTERNAL_INITIATOR_MARKER  → ANYON_INTERNAL_INITIATOR_MARKER
"<!-- OMO_INTERNAL_INITIATOR -->"  → "<!-- ANYON_INTERNAL_INITIATOR -->"
OMO_SESSION_PREFIX             → ANYON_SESSION_PREFIX
"omo-"                         → "anyon-"  (세션 prefix)
"omo-session"                  → "anyon-session"
"omo-subagent-"                → "anyon-subagent-"
<omo-env>                      → <anyon-env>
```

### 6-5. 캐시/로그 경로 (v2 신규)

| 파일                                      | 변경                                         |
| ----------------------------------------- | -------------------------------------------- |
| `src/shared/logger.ts`                    | `/tmp/oh-my-opencode.log` → `/tmp/anyon.log` |
| `src/shared/data-path.ts`                 | `~/.cache/oh-my-opencode` → `~/.cache/anyon` |
| `src/tools/ast-grep/downloader.ts`        | `oh-my-opencode/bin` → `anyon/bin` 캐시 경로 |
| `src/hooks/comment-checker/downloader.ts` | `oh-my-opencode/bin` → `anyon/bin` 캐시 경로 |

### 6-6. git-master 커밋 템플릿

| 파일                                                                  | 변경                                                                 |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/features/opencode-skill-loader/git-master-template-injection.ts` | `Sisyphus(https://github.com/...)` → `Anyon(https://github.com/...)` |

### 영향 파일: ~55개

---

## Phase 7: 문서 업데이트

### 7-1. README (5개 언어 + 1 보안 경고)

- `README.md`, `README.ko.md`, `README.ja.md`, `README.zh-cn.md`, `README.ru.md`
- 프로젝트명, 에이전트명, 설치 명령어, 배지, 링크 전부 교체
- `ohmyopencode.com` 보안 경고 → 새 도메인에 맞게 수정 또는 제거
- Discord/X 링크 업데이트

### 7-2. 가이드 & 레퍼런스

- `docs/manifesto.md` — 철학 재작성
- `docs/guide/installation.md` — 설치 명령어 교체 (`bunx @anyon-cli/anyon install`)
- `docs/guide/overview.md` — 에이전트명, 구조 설명 교체
- `docs/guide/orchestration.md` — 에이전트 협업 설명 교체
- `docs/reference/configuration.md` — 설정 파일 경로, 스키마 URL, 예제 교체
- `docs/reference/features.md` — 기능 설명 교체
- `docs/reference/cli.md` — CLI 명령어 교체

### 7-3. AGENTS.md (32개 — v1에서 16개로 과소 계수)

- 루트 `AGENTS.md`
- `src/AGENTS.md`
- `src/agents/AGENTS.md`
- `src/cli/AGENTS.md`, `src/cli/run/AGENTS.md`, `src/cli/config-manager/AGENTS.md`
- `src/config/AGENTS.md`
- `src/features/AGENTS.md` + 하위 7개
- `src/hooks/AGENTS.md` + 하위 7개
- `src/mcp/AGENTS.md`
- `src/plugin/AGENTS.md`
- `src/plugin-handlers/AGENTS.md`
- `src/shared/AGENTS.md`
- `src/tools/AGENTS.md` + 하위 5개

### 7-4. 기타

- `CONTRIBUTING.md` — clone URL, 프로젝트명 교체
- `CLA.md` — 프로젝트명 참조 교체

### 영향 파일: ~47개

---

## Phase 8: 테스트 파일 업데이트

에이전트명, 도구명, 상수명, 경로 문자열 치환.

### 8-1. 파일 이동 + 내용 변경

| 현재                                                         | 새 경로                                             |
| ------------------------------------------------------------ | --------------------------------------------------- |
| `src/agents/sisyphus-junior/index.test.ts`                   | `src/agents/faraday/index.test.ts`                  |
| `src/agents/momus.test.ts`                                   | `src/agents/nietzsche.test.ts`                      |
| `src/agents/prometheus-prompt.test.ts`                       | `src/agents/newton-prompt.test.ts`                  |
| `src/hooks/atlas/index.test.ts`                              | `src/hooks/turing/index.test.ts`                    |
| `src/hooks/ralph-loop/index.test.ts`                         | `src/hooks/persist-loop/index.test.ts`              |
| `src/hooks/ralph-loop/reset-strategy-race-condition.test.ts` | `src/hooks/persist-loop/...`                        |
| `src/features/boulder-state/storage.test.ts`                 | `src/features/thesis-state/storage.test.ts`         |
| `src/hooks/prometheus-md-only/index.test.ts`                 | `src/hooks/newton-md-only/index.test.ts`            |
| `src/cli/config-manager/write-omo-config.test.ts`            | `src/cli/config-manager/write-anyon-config.test.ts` |
| `src/plugin/ultrawork-model-override.test.ts`                | `src/plugin/turbo-model-override.test.ts`           |
| `src/plugin/ultrawork-db-model-override.test.ts`             | `src/plugin/turbo-db-model-override.test.ts`        |

### 8-2. 내용만 변경 (파일 이동 없음)

| 파일                                              | 변경                               |
| ------------------------------------------------- | ---------------------------------- |
| `src/agents/tool-restrictions.test.ts`            | 에이전트명                         |
| `src/agents/utils.test.ts`                        | `<omo-env>` 태그, `.sisyphus` 경로 |
| `src/agents/dynamic-agent-prompt-builder.test.ts` | 에이전트명, ultrawork 참조         |
| `src/hooks/keyword-detector/index.test.ts`        | ultrawork/ulw 키워드 (61 매치)     |
| `src/hooks/auto-slash-command/index.test.ts`      | ralph 관련 (10 매치)               |
| `src/hooks/auto-slash-command/detector.test.ts`   | ralph 관련 (7 매치)                |
| `src/hooks/start-work/index.test.ts`              | boulder, .sisyphus (14 매치)       |
| `src/hooks/start-work/parse-user-request.test.ts` | ultrawork 참조 (7 매치)            |
| `src/cli/run/completion-continuation.test.ts`     | ralph, boulder (6 매치)            |
| `src/cli/config-manager.test.ts`                  | generateOmoConfig                  |
| `src/cli/model-fallback.test.ts`                  | .sisyphus 경로                     |
| `src/config/schema.test.ts`                       | .sisyphus 경로                     |
| `src/plugin/event.test.ts`                        | ralph (5 매치)                     |
| `src/plugin/event.model-fallback.test.ts`         | ralph (2 매치)                     |
| `src/plugin/chat-message.test.ts`                 | ralph                              |
| `src/shared/migration.test.ts`                    | 에이전트명 마이그레이션            |
| `src/shared/agent-config-integration.test.ts`     | .sisyphus 경로                     |
| `src/features/context-injector/collector.test.ts` | ultrawork                          |
| `src/features/context-injector/injector.test.ts`  | claude-code 참조                   |
| `src/tools/delegate-task/tools.test.ts`           | .sisyphus, 에이전트명              |
| `src/tools/task/task-list.test.ts`                | 에이전트명 (8 매치)                |
| 기타 ~10개                                        | 산발적 참조                        |

### 영향 파일: ~40개

---

## Phase 9: CI/CD 워크플로 (v2 신규)

### 9-1. 워크플로 파일 변경

| 파일                                     | 변경                                                                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/publish.yml`          | npm registry URL 교체 (`oh-my-opencode` → `anyon`), 패키지명, 스키마 커밋 메시지, optionalDeps 버전 업데이트 로직 |
| `.github/workflows/publish-platform.yml` | 플랫폼 패키지명 교체 (`oh-my-opencode-{platform}` → `anyon-{platform}`), registry URL                             |
| `.github/workflows/ci.yml`               | 스키마 auto-commit 패턴 (`assets/oh-my-opencode.schema.json` → `assets/anyon.schema.json`)                        |
| `.github/workflows/sisyphus-agent.yml`   | 플러그인 등록명 `"oh-my-opencode"` → `"anyon"`, 에이전트명 참조 교체                                              |
| `.github/workflows/cla.yml`              | 프로젝트명 참조 확인                                                                                              |
| `.github/workflows/lint-workflows.yml`   | 변경 없을 가능성 높으나 확인                                                                                      |

### 9-2. GitHub 리포 메타데이터 (선택)

- 리포명 변경 여부 별도 결정 (`oh-my-opencode` → `anyon`)
- 변경 시: 모든 GitHub URL, badge, schema $id URL 업데이트 필요
- 미변경 시: GitHub 자동 리다이렉트 활용, 문서 URL은 유지 가능

### 영향 파일: ~6개

---

## Phase 10: 빌드 검증 & 배포

### 10-1. 빌드 검증

```bash
bun run clean
bun run typecheck      # 타입 에러 0 확인
bun test               # 테스트 통과 확인
bun run build          # 빌드 성공 확인
```

### 10-2. 로컬 테스트

```bash
bun run build:binaries  # 플랫폼 바이너리 빌드
# opencode에서 로컬 플러그인으로 동작 테스트
# 호환성 검증: 구 설정 파일이 마이그레이션되는지 확인
# alias 검증: /ralph-loop, ultrawork, call_omo_agent 등 구 명령이 동작하는지 확인
```

### 10-3. npm 배포

1. npm에 `anyon` 패키지명 사용 가능 여부 확인
2. 구 패키지 `oh-my-opencode`에 deprecation 메시지 등록
3. 메인 패키지 퍼블리시: `npm publish --access public`
4. 플랫폼 패키지 11개 퍼블리시 (`anyon-darwin-arm64` 등)
5. `bunx @anyon-cli/anyon install`로 설치 테스트
6. 구 패키지 유저를 위한 마지막 버전 퍼블리시 (설치 시 `anyon`으로 안내)

---

## 작업량 요약

| Phase    | 설명                  | 파일 수         | 자동화                    |
| -------- | --------------------- | --------------- | ------------------------- |
| 0        | 호환성 & 마이그레이션 | ~15             | 수동                      |
| 1        | 서비스명 치환         | ~110            | 90% 자동                  |
| 2        | 타입/Export명         | ~30             | 70% 자동 (수동 확인 필요) |
| 3        | 에이전트명 변경       | ~80             | 70% 자동 (주의 필요)      |
| 4        | 커맨드/키워드         | ~25             | 80% 자동                  |
| 5        | 메타포/철학/상태      | ~70             | 50% 자동                  |
| 6        | 내부 약어/상수/경로   | ~55             | 80% 자동                  |
| 7        | 문서                  | ~47             | 50% 자동                  |
| 8        | 테스트                | ~40             | 80% 자동                  |
| 9        | CI/CD                 | ~6              | 수동                      |
| 10       | 빌드/배포             | —               | 수동                      |
| **총합** |                       | **~300개 파일** |                           |

> 파일 간 중복 참조가 있어 실제 고유 파일은 ~260개 예상.
> v1 대비 +75개 (185 → 260).

---

## 실행 순서

1. **Phase 0**: 호환성 기반 먼저 구축 (마이그레이션 맵, alias, fallback 경로)
2. **Phase 1 + 2**: 서비스명 + 타입/Export 일괄 치환
3. **Phase 3**: 에이전트 타입 시스템 먼저 → 파일 리네임 → 내용 치환
4. **Phase 4 + 5**: 커맨드/키워드 + 메타포/상태 디렉토리
5. **Phase 6**: 내부 약어/상수 치환 (**omo 관련은 반드시 마지막**)
6. **Phase 7 + 8**: 문서 + 테스트
7. **Phase 9**: CI/CD 워크플로
8. **Phase 10**: `typecheck` → `test` → `build` → 배포

**예상 작업 방식**:

- Phase 0: 수동 구현 (호환성 로직)
- Phase 1~4: 병렬 에이전트로 자동화 (단, 에이전트명 충돌 주의 항목은 수동 확인)
- Phase 5~6: 반자동 (boulder/omo 치환은 식별자 단위)
- Phase 7~9: 병렬 에이전트 + 수동 검수
- Phase 10: 수동 검증 & 배포
