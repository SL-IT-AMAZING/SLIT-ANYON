# Phase 4: 선택적 정리 작업

> 우선순위: P2-P3
> 필수 아님 — 서비스 운영에 영향 없음
> 점진적으로 진행 가능

---

## TODO 4A: `<dyad-*>` XML 태그 리네이밍

> 추천: 하지 마라 (리스크 대비 이득 없음)

### 왜 위험한가

이 XML 태그는 LLM ↔ 앱 사이의 **통신 프로토콜**이다.
20+종 태그가 100+곳에서 사용되며, 하나라도 불일치하면 전체 AI 파이프라인이 깨진다.

### 영향 범위 (변경 시)

| 영역            | 파일 수 | 태그 예시                                        |
| --------------- | ------- | ------------------------------------------------ |
| 시스템 프롬프트 | 5+      | `<dyad-write>`, `<dyad-read>` 등 정의            |
| 태그 파서       | 2+      | `dyad_tag_parser.ts` — 정규식 매칭               |
| 응답 프로세서   | 3+      | `response_processor.ts` — 태그 → 파일 오퍼레이션 |
| 마크다운 파서   | 1       | `DyadMarkdownParser.tsx` — UI 렌더링             |
| 도구 정의       | 10+     | `edit_file.ts`, `web_search.ts` 등               |
| 테스트          | 20+     | 스냅샷, 픽스처 전부                              |
| 컴포넌트 태거   | 2       | `data-dyad-id` DOM 속성                          |

### 만약 정말 바꾸고 싶다면

1. 새 태그 이름 확정 (예: `<anyon-write>`)
2. 프롬프트 + 파서 + 프로세서를 **동시에** 변경
3. 모든 테스트 업데이트
4. 전수 E2E 테스트 필수

### 현재 태그 전체 목록

```
<dyad-write path="...">...</dyad-write>
<dyad-read path="..." />
<dyad-rename from="..." to="..." />
<dyad-delete path="..." />
<dyad-add-dependency>...</dyad-add-dependency>
<dyad-search-replace path="...">...</dyad-search-replace>
<dyad-chat-summary>...</dyad-chat-summary>
<dyad-command>...</dyad-command>
<dyad-output>...</dyad-output>
<dyad-problem-report>...</dyad-problem-report>
<dyad-security-finding>...</dyad-security-finding>
<dyad-edit path="...">...</dyad-edit>
<dyad-execute-sql>...</dyad-execute-sql>
<dyad-web-search>...</dyad-web-search>
<dyad-web-crawl>...</dyad-web-crawl>
<dyad-code-search>...</dyad-code-search>
<dyad-grep>...</dyad-grep>
<dyad-read-logs />
<dyad-status>...</dyad-status>
<dyad-mcp-tool-call>...</dyad-mcp-tool-call>
<dyad-mcp-tool-result>...</dyad-mcp-tool-result>
<dyad-add-integration>...</dyad-add-integration>
<dyad-file>...</dyad-file>
<dyad-supabase-*>...</dyad-supabase-*>
<dyad-write-plan>...</dyad-write-plan>
<dyad-exit-plan>...</dyad-exit-plan>
<dyad-text-attachment>...</dyad-text-attachment>

DOM 속성:
data-dyad-id, data-dyad-name, data-dyad-runtime-id
```

---

## TODO 4B: 내부 코드 변수명/함수명 정리

> 추천: 점진적으로, 리팩토링 시 같이 처리

### 고빈도 패턴 (변경 시 영향 큼)

| 패턴                       | 출현 수 | 위치                                 |
| -------------------------- | ------- | ------------------------------------ |
| `getDyadAppPath`           | ~80+    | 거의 모든 핸들러                     |
| `getDyadAppsBaseDirectory` | ~3      | `paths.ts`, `main.ts`, `db/index.ts` |
| `isDyadProEnabled`         | ~15     | `schemas.ts`, 컴포넌트들             |
| `hasDyadProKey`            | ~10     | `schemas.ts`, 훅들                   |
| `enableDyadPro`            | ~20     | `schemas.ts`, 핸들러, 컴포넌트       |
| `isDyadPro`                | ~15     | `types.ts`, 도구들                   |
| `dyadRequestId`            | ~20     | 스트림 핸들러, 에이전트              |
| `createDyadEngine`         | ~10     | `llm_engine_provider.ts`             |

### 저빈도 패턴 (비교적 안전)

| 패턴                   | 출현 수 |
| ---------------------- | ------- |
| `DyadProSuccessDialog` | ~10     |
| `DyadProTrialDialog`   | ~10     |
| `DyadProButton`        | ~10     |
| `ManageDyadProButton`  | ~5      |
| `SetupDyadProButton`   | ~5      |
| `DyadProblemSummary`   | ~5      |
| `DyadMarkdownParser`   | ~10     |
| `DyadProBudgetSchema`  | ~3      |
| `handleDyadProReturn`  | ~3      |
| `removeDyadTags`       | ~10     |
| `hasUnclosedDyadWrite` | ~10     |
| `escapeDyadTags`       | ~5      |

### 환경 변수

| 변수                   | 파일                                              |
| ---------------------- | ------------------------------------------------- |
| `DYAD_ENGINE_URL`      | 3곳 (Phase 1에서 처리)                            |
| `DYAD_PRO_API_KEY`     | `llm_engine_provider.ts`                          |
| `DYAD_ATTACHMENT_*`    | `chat_stream_handlers.ts`, `file_upload_utils.ts` |
| `DYAD_DISABLE_DB_PUSH` | `app_env_var_utils.ts`                            |

### 접근 방법

LSP rename 기능을 사용하면 안전하게 변경 가능:

```
1. IDE에서 심볼 찾기
2. 모든 참조 확인
3. LSP rename → 자동 업데이트
4. 테스트 실행
```

---

## TODO 4C: 부가 서비스 구축 (선택)

### 로그 업로드 서비스

현재: `upload-logs.dyad.sh/generate-upload-url`
용도: 사용자가 "Report Bug" 시 진단 로그 업로드

구현 (최소):

```
1. S3 버킷 생성
2. Lambda/Cloud Function: presigned URL 발급
3. CORS 설정
4. 앱에서 URL 교체
```

없으면: HelpDialog에서 로그 업로드 버튼 비활성화/제거

### 헬프봇 서비스

현재: `helpchat.dyad.sh/v1` (OpenAI 호환 API)
용도: 인앱 AI 헬프봇

구현:

```
1. 너네 LLM 게이트웨이에 헬프봇용 엔드포인트 추가
2. 시스템 프롬프트: 너네 앱 사용법 안내
3. 또는: 기능 자체를 제거
```

---

## TODO 4D: npm 패키지 교체 (선택)

### 현재 Dyad 발행 패키지

| 패키지                                     | 용도                         |
| ------------------------------------------ | ---------------------------- |
| `@dyad-sh/react-vite-component-tagger`     | Vite 앱에서 컴포넌트 태깅    |
| `@dyad-sh/nextjs-webpack-component-tagger` | Next.js 앱에서 컴포넌트 태깅 |
| `@dyad-sh/supabase-management-js`          | Supabase 프로젝트 관리       |

### 옵션

1. **그대로 사용** — `@dyad-sh/` 패키지가 npm에 공개되어 있으므로 그냥 사용 가능
2. **포크** — 너네 npm org로 발행 (`@yourorg/react-vite-component-tagger`)
3. **인라인** — 패키지 코드를 모노레포 내로 이동

컴포넌트 태거는 `data-dyad-id` DOM 속성을 사용하므로, 4A(XML 태그)를 변경하지 않는 한 그대로 써도 무방.

---

## TODO 4E: 테스트 업데이트

브랜딩 변경 후:

- [ ] E2E 테스트 셀렉터 업데이트
  - `e2e-tests/helpers/test_helper.ts:965` — "Ask Dyad to build" 셀렉터
  - 기타 `data-testid`에 "dyad" 포함된 것들

- [ ] 스냅샷 업데이트
  - `npm run test -- -u` (스냅샷 갱신)
  - E2E 스냅샷은 `npm run build && npm run e2e` 후 재생성

- [ ] 단위 테스트
  - XML 태그 관련 테스트 (4A를 안 바꿨다면 그대로)
  - 설정 관련 테스트 (`enableDyadPro` 등)
