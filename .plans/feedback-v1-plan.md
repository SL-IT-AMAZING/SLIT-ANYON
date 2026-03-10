# 1차 피드백 개선 계획 — ANYON B2C

## Goal

노션 "1차 피드백" 문서의 7개 항목을 모두 해결하여 앱 품질을 전면 개선한다.

## 전체 구조

| Phase   | 범위                                        | 예상 시간 | 우선순위 |
| ------- | ------------------------------------------- | --------- | -------- |
| Phase 1 | Quick Fixes (배경 삭제, 뒤로가기, Supabase) | 1~2시간   | P0       |
| Phase 2 | 마켓 탭 버그 수정 (loading, 팝오버)         | 2~3시간   | P0       |
| Phase 3 | 마켓 탭 UI 개편 (v0.dev 스타일)             | 1~2일     | P1       |
| Phase 4 | 라이브러리 탭 개편 (tweakcn 스타일)         | 2~3일     | P1       |
| Phase 5 | 앱 프리뷰 로딩 최적화                       | 1~2일     | P2       |

---

## Phase 1: Quick Fixes (1~2시간)

### Task 1.1: 백그라운드 이미지 삭제

**상태**: 🔲 미시작
**난이도**: ⭐ (매우 쉬움)
**예상 시간**: 5분

**현재 상태**:

- `src/pages/home.tsx` 라인 220~227에 hero 배경 이미지 div 존재
- `assets/bg-im.png` 파일이 25% opacity로 전체 화면에 깔림

**수정 내용**:

```
파일: src/pages/home.tsx
- 라인 1: `import heroBgImage from "../../assets/bg-im.png"` 삭제
- 라인 220~227: 배경 이미지 div 전체 삭제
  <div
    className="sticky top-0 h-screen bg-no-repeat bg-center bg-cover pointer-events-none opacity-25"
    style={{ backgroundImage: `url(${heroBgImage})`, marginBottom: "-100vh" }}
  />
```

**검증**:

- [ ] LSP diagnostics 클린 확인
- [ ] 홈 페이지 렌더링 정상 확인
- [ ] `assets/bg-im.png` 파일은 남겨둠 (다른 곳에서 사용 여부 확인 후 삭제)

---

### Task 1.2: 뒤로가기 버튼 추가 (app-detail 페이지)

**상태**: 🔲 미시작
**난이도**: ⭐⭐ (쉬움)
**예상 시간**: 20분

**현재 상태**:

- `/apps/$appId` 라우트의 `src/pages/app-detail.tsx`에 뒤로가기 버튼 없음
- 기존 패턴 참조: `src/pages/template-detail.tsx`에서 `router.history.back()` + `ArrowLeft` 아이콘 사용

**수정 내용**:

```
파일: src/pages/app-detail.tsx
- useRouter() 또는 useNavigate() import
- ArrowLeft 아이콘 import (lucide-react)
- 페이지 상단에 뒤로가기 버튼 추가:
  <Button variant="ghost" size="sm" onClick={() => router.history.back()}>
    <ArrowLeft className="h-4 w-4 mr-1" />
    Back
  </Button>
```

**디자인 결정**:

- template-detail.tsx의 기존 패턴 그대로 따름
- 페이지 상단 좌측에 배치
- PreviewPanel 위에 위치

**검증**:

- [ ] 앱 목록 → 앱 클릭 → 뒤로가기 버튼 클릭 → 앱 목록으로 복귀 확인
- [ ] LSP diagnostics 클린

---

### Task 1.3: Supabase OAuth client_id 수정

**상태**: 🔲 미시작
**난이도**: ⭐⭐ (쉬움, 하지만 서버 배포 필요)
**예상 시간**: 30분

**근본 원인**:

- Supabase OAuth URL에서 `client_id` 끝에 `%0A` (줄바꿈 문자)가 붙어있음
- 서버 코드에서 환경변수 읽을 때 `.trim()` 처리 안 됨
- 에러: `{"message":"client_id: Invalid uuid"}`

**수정 내용**:

```
파일 1: server/app/api/oauth/supabase/login/route.ts
- 환경변수 읽는 부분에 .trim() 추가
  const clientId = process.env.SUPABASE_CLIENT_ID?.trim()
  const redirectUri = process.env.OAUTH_SERVER_URL?.trim()

파일 2: server/app/api/oauth/supabase/callback/route.ts
- 동일하게 .trim() 추가
  const clientId = process.env.SUPABASE_CLIENT_ID?.trim()
  const clientSecret = process.env.SUPABASE_CLIENT_SECRET?.trim()

파일 3: server/app/lib/oauth-utils.ts
- exchangeCodeForToken() 함수 내 환경변수에도 .trim() 추가

파일 4: server/.env (있다면)
- SUPABASE_CLIENT_ID 값 끝의 줄바꿈/공백 제거
```

**추가 개선**:

- 에러 발생 시 사용자에게 명확한 에러 메시지 표시 (현재 빈 화면)
- `src/components/SupabaseHubConnector.tsx`에 에러 상태 UI 추가

**검증**:

- [ ] 서버 로컬에서 OAuth 플로우 테스트 (가능한 경우)
- [ ] .trim()이 모든 환경변수 읽기에 적용됐는지 확인
- [ ] 서버 재배포 후 실제 Supabase 연결 테스트

**⚠️ 리스크**:

- Vercel 서버 재배포 필요 (`server-green-seven.vercel.app`)
- .env 파일의 실제 내용 확인 불가 (로컬에 없을 수 있음)
- Supabase OAuth 앱 설정에서 redirect_uri도 확인 필요

---

## Phase 2: 마켓 탭 버그 수정 (2~3시간)

### Task 2.1: 프리뷰 이미지 "loading..." 수정

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐ (중간)
**예상 시간**: 1.5시간

**현재 상태**:

- `src/components/TemplateCard.tsx`: 이미지 로드 실패 시 첫 글자만 표시
- `src/ipc/utils/template_utils.ts`: `resolveTemplateThumbnails()`가 로컬 파일 없으면 원격 URL 사용
- `src/main/thumbnail-protocol.ts`: `anyon-thumb://` 프로토콜 핸들러
- 원격 URL: `https://raw.githubusercontent.com/SL-IT-AMAZING/SLIT-ANYON/main/templates/...`

**수정 범위**:

```
파일 1: src/components/TemplateCard.tsx
- 이미지 에러 처리 개선:
  - hasError 상태일 때 스켈레톤/placeholder 이미지 표시 (첫 글자 대신)
  - 그라데이션 배경 + 아이콘으로 placeholder 디자인
  - loading 상태에 스켈레톤 애니메이션 추가

파일 2: src/ipc/utils/template_utils.ts
- resolveTemplateThumbnails() 개선:
  - 원격 URL 유효성 검증 (HEAD 요청으로 404 체크)
  - 유효하지 않은 URL은 빈 string 대신 명시적 null 반환
  - 로컬 캐시 디렉토리에 다운로드 시도 로직 추가

파일 3: src/ipc/handlers/template_handlers.ts (있다면)
- fetchTemplateRegistry() 에러 핸들링 강화
- GitHub 원격 레지스트리 fetch 실패 시 캐시된 레지스트리 사용
```

**검증**:

- [ ] 마켓 탭 진입 시 모든 카드에 이미지 또는 깔끔한 placeholder 표시
- [ ] 네트워크 끊긴 상태에서도 앱 크래시 없이 동작
- [ ] 이미지 로드 성공한 템플릿은 정상 표시

---

### Task 2.2: 마켓플레이스 팝오버 → 가로 탭 변경

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐ (중간)
**예상 시간**: 1.5시간

**현재 상태**:

- 사이드바 "마켓" 클릭 시 Website/App 전환 팝오버가 사이드바와 메인 콘텐츠 사이에 떠있음
- 사용자 피드백: "노란 표시한 부분을 없애고 가로로 하던가 하면 좋겠음"

**수정 내용**:

```
파일 1: src/components/HubList.tsx (또는 관련 사이드바 컴포넌트)
- Website/App 전환 팝오버 트리거 제거
- 사이드바 "마켓" 항목 클릭 시 바로 /hub로 네비게이션

파일 2: src/pages/hub.tsx
- 마켓플레이스 헤더 영역에 Website/App 가로 탭 추가
- 탭 디자인: 인라인 버튼 또는 세그먼트 컨트롤 스타일
  <div className="flex gap-2 mb-4">
    <Button variant={tab === "website" ? "default" : "outline"}>🌐 Website</Button>
    <Button variant={tab === "app" ? "default" : "outline"}>📱 App</Button>
  </div>
- 탭 상태를 Jotai atom으로 관리
- 선택된 탭에 따라 템플릿 리스트 필터링

파일 3: src/atoms/ (새 atom 파일 또는 기존 파일에 추가)
- marketTabAtom: "website" | "app" 상태 관리
```

**디자인 결정**:

- 팝오버 완전 제거
- 메인 콘텐츠 영역 상단 (검색바 위 또는 옆)에 가로 탭으로 배치
- v0.dev 스타일: "Community | Community Templates | Your Templates" 탭 참고

**검증**:

- [ ] 사이드바 "마켓" 클릭 → 바로 마켓 페이지 진입 (팝오버 없음)
- [ ] Website/App 탭 전환이 메인 콘텐츠 내에서 동작
- [ ] 기존 기능 동일하게 작동

---

## Phase 3: 마켓 탭 UI 개편 — v0.dev 스타일 (1~2일)

### 참조 디자인: v0.dev Community Templates

스크린샷 분석 결과:

1. **갤러리 뷰**: 좌측 사이드바(Search, Home, Projects, Design Systems, Templates, Favorites, Recents) + 메인 그리드
2. **탭**: Community | Community Templates | Your Templates
3. **필터/정렬**: Filters 드롭다운 + Trending 정렬
4. **카드**: 대형 프리뷰 썸네일 + 제목 + 아이콘 + 메타데이터(좋아요, 클론, 조회수)
5. **상세 뷰**: 브레드크럼(Templates > AI > Name) + 메타데이터 + 임베드 프리뷰 + "Open" 버튼

### Task 3.1: 마켓 사이드바 리디자인

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐ (중간)
**예상 시간**: 3시간

```
파일: src/components/HubList.tsx

현재 → v0.dev 스타일로 변경:
- 검색바 추가 (상단)
- 카테고리 네비게이션:
  - All Templates (기본)
  - AI
  - SaaS
  - Dashboard
  - E-Commerce
  - Portfolio
  - Landing Page
  (기존 템플릿 데이터의 카테고리에서 추출)
- Favorites 섹션 (즐겨찾기한 템플릿)
- Recents 섹션 (최근 본 템플릿)

상태 관리:
- selectedCategoryAtom: 선택된 카테고리
- recentTemplatesAtom: 최근 본 템플릿 목록 (localStorage 연동)
- favoriteTemplatesAtom: 즐겨찾기 목록
```

### Task 3.2: 마켓 메인 페이지 리디자인

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐⭐ (어려움)
**예상 시간**: 4시간

```
파일: src/pages/hub.tsx

변경 사항:
1. 상단 탭 바:
   - Community | Community Templates | Your Templates
   - v0.dev 스타일 탭 (밑줄 활성 상태)

2. 필터/정렬 바:
   - 좌측: Filters 드롭다운 (카테고리, 프레임워크, 가격 등)
   - 우측: 정렬 옵션 (Trending, Newest, Most Used)

3. 템플릿 그리드:
   - 반응형 그리드: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
   - 더 큰 프리뷰 이미지 비율
   - 로딩 시 스켈레톤 카드

4. 빈 상태 UI:
   - 필터 결과 없을 때 메시지 + CTA
```

### Task 3.3: 템플릿 카드 리디자인

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐ (중간)
**예상 시간**: 3시간

```
파일: src/components/TemplateCard.tsx

v0.dev 스타일 카드:
1. 카드 구조:
   ┌─────────────────────────────┐
   │   프리뷰 썸네일 (h-48)      │ ← 더 큰 이미지 영역
   │                             │
   │                             │
   ├─────────────────────────────┤
   │ 🎨 Grok Creative Studio    │ ← 아이콘 + 제목
   │ by creator_name             │ ← 작성자
   │ ♡ 42  ⑃ 128  👁 1.2k       │ ← 메타데이터
   └─────────────────────────────┘

2. 호버 효과:
   - scale(1.02) + shadow-lg
   - 오버레이에 "Use Template" 버튼 표시

3. 카테고리 배지:
   - 좌상단에 카테고리 태그 (AI, SaaS 등)
```

### Task 3.4: 템플릿 상세 페이지 리디자인

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐⭐ (어려움)
**예상 시간**: 4시간

```
파일: src/pages/template-detail.tsx

v0.dev 스타일 상세 뷰:
1. 브레드크럼: Templates > Category > Template Name
   - 클릭으로 상위 이동 가능
   - 뒤로가기 버튼 대체

2. 헤더 영역:
   - 템플릿 아이콘 + 제목 (큰 폰트)
   - 작성자 정보 (아바타 + 이름)
   - 메타데이터 (좋아요, 사용 횟수, 마지막 업데이트)
   - 액션 버튼: "Use This Template" (primary), 공유, 좋아요

3. 프리뷰 영역:
   - 전체 너비 임베드 프리뷰 (현재 iframe 패턴 유지)
   - 디바이스 전환 (데스크톱/태블릿/모바일) — 기존 기능 유지

4. 설명 + 기술 스택:
   - 템플릿 설명
   - 사용된 기술 태그 (React, Tailwind, shadcn 등)
   - 포함된 페이지/컴포넌트 목록
```

### Task 3.5: 상태 관리 + 데이터 레이어

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐ (중간)
**예상 시간**: 2시간

```
파일: src/atoms/hubAtoms.ts (새로 생성 또는 기존 파일에 추가)

새 atoms:
- hubTabAtom: "community" | "templates" | "yours"
- hubSortAtom: "trending" | "newest" | "most-used"
- hubFilterAtom: { category: string | null, framework: string | null }
- hubSearchAtom: string
- recentTemplatesAtom: string[] (최근 본 templateId 목록)

파일: src/lib/queryKeys.ts
- queryKeys.templates.byCategory({ category })
- queryKeys.templates.bySort({ sort })
- queryKeys.templates.favorites
- queryKeys.templates.recents
```

---

## Phase 4: 라이브러리 탭 개편 — tweakcn 스타일 (2~3일)

### 참조 디자인: tweakcn.com Community Page

상세 분석 완료 (librarian agent + 스크린샷 분석):

- 오픈소스: `jnsahaj/tweakcn` (Apache-2.0, 9.5k ⭐, Next.js)
- 핵심 소스: `app/community/components/` 하위 파일들

### Task 4.1: 라이브러리 사이드바 전면 개편

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐⭐ (어려움)
**예상 시간**: 4시간

```
파일: src/components/LibraryList.tsx → 전면 재작성

tweakcn 스타일 사이드바 (w-56):
1. 필터 프리셋 섹션:
   - All Themes (기본, 활성 하이라이트)
   - My Themes (커스텀 테마)
   - Liked Themes (좋아요한 테마)
   - Design Systems (기존 디자인 시스템 목록)

2. TAGS 섹션 (구분선 + 소문자 라벨):
   - 태그 목록 + 사용 카운트 (우측 정렬)
   - 멀티 선택 가능
   - 스켈레톤 로딩
   - 태그 목록 (tweakcn 기준):
     professional, minimal, colorful, cool, elegant,
     retro, playful, startup, saas, warm, zen,
     vibrant, pastel, bold, dashboard, nature, flat,
     high-contrast, brutalist, geometric, corporate...

3. 태그 카운트 계산:
   - tweakcn-themes.json 데이터에서 태그 추출
   - 현재 테마 데이터에 태그 없음 → 태그 할당 필요 (Task 4.5)

상태 관리:
- libraryFilterAtom: "all" | "mine" | "liked"
- selectedTagsAtom: string[] (멀티 선택)
```

### Task 4.2: 정렬 바 추가

**상태**: 🔲 미시작
**난이도**: ⭐⭐ (쉬움)
**예상 시간**: 1시간

```
파일: src/components/DesignSystemGallery.tsx (또는 새 컴포넌트)

메인 콘텐츠 상단 정렬 바:
- Popular | Newest | Oldest (인라인 텍스트 버튼, 세퍼레이터로 구분)
- 활성: bg-foreground/10 text-foreground
- 비활성: text-muted-foreground

상태: librarySortAtom: "popular" | "newest" | "oldest"
```

### Task 4.3: 테마 카드 전면 리디자인

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐⭐⭐ (매우 어려움 — 핵심 작업)
**예상 시간**: 6시간

```
파일: src/components/TweakcnThemeCard.tsx → 전면 재작성

tweakcn 스타일 카드 (min-280px, 반응형 auto-fill 그리드):

┌─────────────────────────────────┐
│ [minimal] [warm] +1  ← 태그 오버레이 (max 2 + overflow)
│                     ┃┃┃┃┃┃  ← 6색 스워치 (top-right)
│                     ┃┃┃┃┃┃     primary, secondary, accent,
│                     ┃┃┃┃┃┃     muted, border, card
│
│   Aa               ← 테마 이름 (큰 폰트, bottom-left)
│                        테마 자체 폰트로 렌더링
└─────────────────────────────────┘
  👤 author · Feb 11        ♡ 37  ← 메타데이터

세부 구현:
1. 프리뷰 영역 (h-44, rounded-xl, border, shadow-sm):
   - 배경색: 테마의 background CSS variable
   - 박스 쉐도우: 테마의 shadow tokens
   - radius: 테마의 radius token 적용

2. 색상 스워치 (우측 상단):
   - 6개 수직 바 (w-3 h-12)
   - CSS variables에서 추출: --primary, --secondary, --accent, --muted, --border, --card
   - OKLCH → RGB 변환 필요 (현재 데이터는 OKLCH 형식)

3. 태그 오버레이 (좌측 상단):
   - bg-background/80 backdrop-blur-sm
   - 최대 2개 표시, 나머지 "+N"
   - 라운드 배지 스타일

4. 테마 이름 (좌측 하단):
   - 1.5rem 폰트 크기
   - Google Fonts에서 테마 폰트 로드 (성능 고려)

5. 메타데이터 행 (카드 하단 외부):
   - 작성자 아바타 + 이름 + 날짜
   - 좋아요 버튼 + 카운트
   - 호버: bg-red-500/10 text-red-500 (좋아요 상태)

호버 효과:
- group-hover:shadow-md
- group-hover:border-foreground/20
- group-hover:scale-102
```

### Task 4.4: 무한 스크롤 구현

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐ (중간)
**예상 시간**: 2시간

```
구현 방식:
- 페이지 크기: 20개 테마
- IntersectionObserver 사용
- rootMargin: "200px" (200px 전에 다음 페이지 로딩 시작)
- 로딩 인디케이터: Loader2 animate-spin (centered)
- 초기 로딩: 8개 스켈레톤 카드 placeholder

파일: src/components/DesignSystemGallery.tsx (또는 새 컴포넌트)
- useInfiniteQuery 사용 (TanStack Query)
  또는 Jotai atom + 로컬 페이지네이션 (데이터가 이미 로컬)
- 센티넬 div ref 추가
- 스켈레톤 카드 컴포넌트 생성

참고: tweakcn-themes.json은 로컬 데이터 (12,077줄)이므로
서버 API가 아닌 클라이언트 측 페이지네이션으로 구현
```

### Task 4.5: 테마 데이터 enrichment (태그, 카테고리, 메타데이터)

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐⭐ (어려움 — 데이터 설계 필요)
**예상 시간**: 4시간

```
현재 데이터 (src/shared/tweakcn-themes.json):
{
  "id": "theme-id",
  "name": "Theme Name",
  "cssVars": {
    "light": { "--primary": "oklch(...)", ... },
    "dark": { "--primary": "oklch(...)", ... }
  }
}

필요한 추가 데이터:
{
  "id": "theme-id",
  "name": "Theme Name",
  "tags": ["minimal", "professional", "cool"],  ← 새로 추가
  "author": "author_name",                       ← 새로 추가
  "createdAt": "2026-02-11",                     ← 새로 추가
  "likes": 37,                                    ← 새로 추가 (로컬 관리)
  "cssVars": { ... }
}

구현 방법:
옵션 A: tweakcn GitHub API에서 커뮤니티 테마 데이터 fetch (태그 포함)
옵션 B: CSS variables를 분석하여 자동 태그 할당
  - 밝은 색상 → "pastel", "light"
  - 어두운 색상 → "dark", "moody"
  - 높은 채도 → "vibrant", "colorful"
  - 낮은 채도 → "minimal", "muted"
  - 따뜻한 톤 → "warm"
  - 차가운 톤 → "cool"
옵션 C: 수동 태그 할당 (json 편집)

⭐ 추천: 옵션 B (자동 태그) + tweakcn API에서 가능한 데이터 보충

좋아요 시스템:
- 로컬 SQLite에 liked_themes 테이블 추가
- drizzle migration 생성
- IPC endpoint 추가: toggleThemeLike, getLikedThemes
```

### Task 4.6: 빈 상태 + 스켈레톤 로딩

**상태**: 🔲 미시작
**난이도**: ⭐⭐ (쉬움)
**예상 시간**: 1시간

```
빈 상태 (필터 결과 없을 때):
- 아이콘 (Flame icon in muted rounded circle)
- "No themes found" 메시지
- 필터별 다른 메시지:
  - All: "No themes match your filters"
  - Mine: "You haven't created any themes yet"
  - Liked: "You haven't liked any themes yet"

스켈레톤:
- 카드 스켈레톤: h-44 상단 + 2줄 텍스트
- 사이드바 태그 스켈레톤: h-7 w-full rounded-lg × 5
- 8개 카드 스켈레톤 표시 during 초기 로딩
```

### Task 4.7: 기존 DesignSystemCard 통합

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐ (중간)
**예상 시간**: 2시간

```
현재 상태:
- DesignSystemCard: iframe 프리뷰로 디자인 시스템 표시 (shadcn, mui, antd 등)
- TweakcnThemeCard: iframe 프리뷰로 tweakcn 테마 표시

통합 방향:
- 두 카드를 하나의 통합된 디자인 시스템 안에서 표시
- "Design Systems" 필터와 "Themes" 필터로 구분
- 카드 디자인은 tweakcn 스타일로 통일
- DesignSystemCard도 색상 스워치 표시 (colorScheme 데이터 활용)

파일:
- src/components/DesignSystemGallery.tsx 수정
- src/components/DesignSystemCard.tsx 리디자인
- src/pages/themes.tsx 레이아웃 수정
```

---

## Phase 5: 앱 프리뷰 로딩 최적화 (1~2일)

### Task 5.1: 로딩 병목 분석 및 측정

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐ (중간)
**예상 시간**: 3시간

```
현재 로딩 플로우:
1. 앱 클릭 → selectedAppIdAtom 설정 (~0ms)
2. PreviewPanel useEffect → runApp(appId) 호출 (~10ms)
3. IPC: app.getApp() → DB 쿼리 (~50ms)
4. IPC: app.runApp() → child process 스폰 (~100ms)
5. npm install 실행 (⚠️ 10~60초!)
6. Vite dev server 시작 (⚠️ 3~10초!)
7. 프록시 서버 시작 (~500ms)
8. iframe 로드 (~1~3초)

측정 방법:
- 각 단계에 performance.now() 타이밍 추가
- console.log로 각 단계별 소요 시간 기록
- 파일: src/ipc/handlers/app_handlers.ts의 runApp 핸들러

파일 수정:
- src/ipc/handlers/app_handlers.ts: 각 단계별 타이밍 로그 추가
- src/hooks/useRunApp.ts: renderer 측 타이밍 로그
```

### Task 5.2: npm install 최적화

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐⭐ (어려움)
**예상 시간**: 4시간

```
현재 문제:
- 매번 앱 시작 시 npm install 실행됨 (package.json 변경 없어도)
- 첫 실행 시 30~60초 소요

최적화 방안:

1. package.json 해시 캐싱:
   - 앱 최초 실행 시 package.json의 hash 저장
   - 이후 실행 시 hash 비교 → 변경 없으면 npm install 스킵
   - 파일: src/ipc/handlers/app_handlers.ts

2. node_modules 공유:
   - 공통 의존성 (react, vite, tailwind 등)을 글로벌 캐시에 저장
   - symlink 또는 npm workspace 활용

3. pnpm 전환 고려:
   - 글로벌 패키지 스토어로 디스크 사용량 감소
   - 설치 속도 향상 (하드링크)

4. npm install --prefer-offline:
   - 이미 캐시된 패키지는 네트워크 없이 설치
```

### Task 5.3: Vite dev server 시작 최적화

**상태**: 🔲 미시작
**난이도**: ⭐⭐⭐ (중간)
**예상 시간**: 3시간

```
최적화 방안:

1. Vite 사전 번들링 (pre-bundling):
   - optimizeDeps.include에 자주 사용하는 패키지 미리 지정
   - .vite 캐시 유지 (앱 재시작 시 재사용)

2. HMR 리프레시 최적화:
   - previewPanelKeyAtom 업데이트 디바운스 (300ms)
   - 불필요한 iframe 전체 리마운트 방지
   - 파일: src/hooks/useRunApp.ts

3. 프리뷰 프리로딩:
   - 앱 목록에서 호버 시 프리로딩 시작
   - 또는 마지막 사용 앱 백그라운드 사전 시작

4. 로딩 UX 개선:
   - 로딩 프로그레스 표시 (각 단계별)
   - "Installing dependencies..." → "Starting server..." → "Loading preview..."
   - 스켈레톤 UI 표시 during 로딩
```

### Task 5.4: 프리뷰 로딩 UX 개선

**상태**: 🔲 미시작
**난이도**: ⭐⭐ (쉬움)
**예상 시간**: 2시간

```
파일: src/components/preview_panel/PreviewPanel.tsx
파일: src/components/preview_panel/PreviewIframe.tsx

개선 사항:
1. 단계별 프로그레스 표시:
   - Spinner + 현재 단계 텍스트
   - 예상 남은 시간 (이전 실행 기록 기반)

2. 콘솔 출력 실시간 표시:
   - npm install 진행률
   - Vite 빌드 로그 스트리밍

3. 첫 실행 vs 재실행 구분:
   - 첫 실행: "Setting up your app..." + 예상 시간 안내
   - 재실행: "Restarting..." (빠르게)

4. 에러 상태 개선:
   - 현재: previewErrorMessageAtom으로 단순 텍스트
   - 개선: 에러 유형별 구체적 안내 + 재시도 버튼
```

---

## 병렬 실행 계획

```
Week 1:
├── [Agent A] Phase 1 전체 (1.1 + 1.2 + 1.3) ← 1~2시간
├── [Agent B] Phase 2 전체 (2.1 + 2.2) ← 2~3시간
│   (Phase 1 + 2 완료 후)
├── [Agent C] Phase 3.1~3.3 (사이드바 + 메인 + 카드) ← 병렬 가능
├── [Agent D] Phase 3.4~3.5 (상세 + 데이터) ← 3.1~3.3 의존
│
Week 2:
├── [Agent E] Phase 4.1~4.3 (사이드바 + 정렬 + 카드) ← 병렬 가능
├── [Agent F] Phase 4.4~4.5 (무한스크롤 + 데이터) ← 병렬 가능
├── [Agent G] Phase 4.6~4.7 (빈 상태 + 통합) ← 4.1~4.5 의존
│
├── [Agent H] Phase 5.1 (측정) ← 독립 실행 가능
├── [Agent I] Phase 5.2~5.4 (최적화) ← 5.1 의존
```

---

## 의존성 그래프

```
Phase 1 (독립) ─────────────────────────────────────> 완료
Phase 2 (독립) ─────────────────────────────────────> 완료
Phase 3.1~3.3 ──> Phase 3.4~3.5 ──────────────────> 완료
Phase 4.5 (데이터) ──> Phase 4.1~4.4 (UI) ──> Phase 4.6~4.7 > 완료
Phase 5.1 (측정) ──> Phase 5.2~5.3 (최적화) ──> Phase 5.4 (UX) > 완료
```

---

## 리스크 평가

| 항목                      | 리스크                     | 영향도 | 대응                                    |
| ------------------------- | -------------------------- | ------ | --------------------------------------- |
| Supabase OAuth            | 서버 배포 필요, .env 접근  | 중     | 코드 수정 후 배포는 별도 진행           |
| tweakcn 데이터 enrichment | 태그 자동 할당 정확도      | 중     | OKLCH 색상 분석 알고리즘 테스트 필요    |
| v0.dev UI 참조            | 정확한 디자인 불확실       | 저     | 스크린샷 기반 + 사용자 피드백 반복      |
| 앱 로딩 최적화            | npm install 캐싱 edge case | 고     | package.json 변경 감지 로직 철저 테스트 |
| 라이브러리 무한스크롤     | 12k 테마 성능              | 중     | 가상화(react-window) 도입 고려          |
| Google Fonts 로딩         | 카드당 폰트 로딩 성능      | 중     | 폰트 프리로딩 또는 기본 폰트 fallback   |

---

## 테스트 전략

### 단위 테스트

- OKLCH → RGB 변환 유틸리티
- 태그 자동 할당 알고리즘
- 필터링/정렬 로직

### E2E 테스트

- 마켓 탭: 템플릿 브라우징 → 카테고리 필터 → 상세 → 뒤로가기
- 라이브러리 탭: 태그 필터 → 테마 선택 → 적용
- Supabase: OAuth 플로우 (서버 정상 시)
- 앱 로딩: 앱 생성 → 프리뷰 로딩 → 정상 표시

### 수동 검증

- 각 Phase 완료 후 시각적 리뷰
- 반응형 레이아웃 (다양한 윈도우 크기)
- 다크/라이트 모드 호환

---

## Status

**현재**: 계획 작성 완료, 실행 대기 중
**다음 단계**: 사용자 확인 후 Phase 1부터 시작
