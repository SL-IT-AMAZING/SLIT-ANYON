# Phase 3: 빌드 & 배포 설정

> 우선순위: P1
> 예상 공수: 1일
> 의존성: Phase 2 완료 후

## 개요

패키지 이름, 빌드 설정, 앱 아이콘, 자동 업데이트 등 배포에 필요한 설정을 변경한다.

---

## TODO 3A: 패키지 설정 변경

### package.json

- [ ] `package.json` (라인 2)

  ```json
  "name": "anyon"
  ```

- [ ] `package.json` (라인 187)

  ```json
  "productName": "ANYON"
  ```

- [ ] `package.json` — repository URL
  ```json
  "repository": {
    "url": "https://github.com/SL-IT-AMAZING/SLIT-ANYON.git"
  }
  ```

### server/package.json

- [ ] `server/package.json` (라인 2)
  ```json
  "name": "anyon-oauth-server"
  ```

---

## TODO 3B: Electron Forge 설정

### forge.config.ts

- [ ] `protocols` 설정

  ```typescript
  protocols: [{ name: "ANYON", schemes: ["anyon"] }];
  ```

- [ ] `publisher` 설정

  ```typescript
  {
    name: "@electron-forge/publisher-github",
    config: {
      repository: {
        owner: "SL-IT-AMAZING",
        name: "SLIT-ANYON"
      }
    }
  }
  ```

- [ ] `MakerDeb` mimeType

  ```typescript
  mimeType: ["x-scheme-handler/anyon"];
  ```

- [ ] `iconUrl` — 자체 아이콘 URL (GitHub raw URL 사용 가능)
  ```typescript
  iconUrl: "https://raw.githubusercontent.com/SL-IT-AMAZING/SLIT-ANYON/main/img/Frame%2013.png";
  ```

---

## TODO 3C: 앱 아이콘 교체

### 현재 아이콘 파일

소스: `img/Frame 13.png` (ANYON 로고)

### 필요한 아이콘 포맷

| 플랫폼  | 파일               | 크기              |
| ------- | ------------------ | ----------------- |
| macOS   | `assets/icon.icns` | 16x16 ~ 1024x1024 |
| Windows | `assets/icon.ico`  | 16x16 ~ 256x256   |
| Linux   | `assets/icon.png`  | 512x512           |

### 변환 명령 (macOS에서)

```bash
# PNG → ICNS (macOS)
mkdir icon.iconset
sips -z 16 16 "img/Frame 13.png" --out icon.iconset/icon_16x16.png
sips -z 32 32 "img/Frame 13.png" --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 "img/Frame 13.png" --out icon.iconset/icon_32x32.png
sips -z 64 64 "img/Frame 13.png" --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 "img/Frame 13.png" --out icon.iconset/icon_128x128.png
sips -z 256 256 "img/Frame 13.png" --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 "img/Frame 13.png" --out icon.iconset/icon_256x256.png
sips -z 512 512 "img/Frame 13.png" --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 "img/Frame 13.png" --out icon.iconset/icon_512x512.png
sips -z 1024 1024 "img/Frame 13.png" --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o assets/icon.icns

# PNG → ICO (ImageMagick 필요)
convert "img/Frame 13.png" -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico

# 512px PNG 복사
cp "img/Frame 13.png" assets/icon.png
```

### 인앱 로고

- [ ] `src/assets/` 내 로고 이미지들을 ANYON 로고로 교체
- [ ] 파비콘 교체 (index.html에서 참조하는 경우)

---

## TODO 3D: GitHub Releases 자동 업데이트

### 현재 설정 (Dyad)

```typescript
// src/main.ts:145-154
updateElectronApp({
  updateSource: {
    type: UpdateSourceType.ElectronPublicUpdateService,
    repo: "dyad-sh/dyad",
    host: `https://api.dyad.sh/v1/update/${postfix}`,
  },
});
```

### ANYON 설정

- [ ] `src/main.ts` 수정
  ```typescript
  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: "SL-IT-AMAZING/SLIT-ANYON",
      // host 제거 → GitHub Releases 기본 사용
    },
  });
  ```

### 롤아웃 설정 (비활성화)

- [ ] `src/lib/rollout.ts` (라인 34)

  ```typescript
  // 롤아웃 기능 비활성화 — 항상 100% 배포
  export function shouldUpdate(): boolean {
    return true;
  }
  ```

  또는 URL 변경:

  ```
  현재: "https://api.dyad.sh/v1/update/rollout-config.json"
  변경: 제거 또는 자체 URL
  ```

---

## TODO 3E: Sentry 설정 (비활성화)

### 비활성화 방법

- [ ] `src/lib/sentry.ts` — Sentry 초기화 코드 주석 처리

  ```typescript
  export function initSentry() {
    // 비활성화
    return;

    // Sentry.init({ ... });
  }
  ```

- [ ] `src/lib/sentry-renderer.ts` — 동일

### 또는 자체 Sentry로 변경 (나중에)

```typescript
Sentry.init({
  dsn: "https://xxx@sentry.io/xxx", // SLIT Sentry DSN
  release: `anyon@${version}`,
});
```

---

## TODO 3F: Telemetry (비활성화)

### localStorage 키 변경 (선택)

- [ ] `src/hooks/useSettings.ts` (라인 9-10)

  ```typescript
  // 현재
  "dyadTelemetryConsent";
  "dyadTelemetryUserId";

  // 변경 (선택)
  "anyonTelemetryConsent";
  "anyonTelemetryUserId";
  ```

### PostHog 비활성화 (일단)

PostHog 설정이 있다면 비활성화하거나 자체 프로젝트로 교체.

---

## TODO 3G: OAuth 서버 설정

### URL 변경

- [ ] `src/lib/oauthConfig.ts`

  ```typescript
  // 현재
  OAUTH_SERVER_URL = "https://server-green-seven.vercel.app";

  // 변경
  OAUTH_SERVER_URL = "https://oauth.any-on.dev";
  ```

### OAuth 서버 배포 (server/ 디렉토리)

- [ ] `server/` 디렉토리를 `oauth.any-on.dev`에 배포
- [ ] 환경변수 설정:
  - Supabase OAuth credentials
  - Neon OAuth credentials
  - Vercel OAuth credentials

### OAuth 앱 설정 업데이트

각 서비스 (Supabase, Neon, Vercel)의 OAuth 앱 설정에서:

- Callback URL을 `https://oauth.any-on.dev/api/oauth/{service}/callback`로 변경

---

## TODO 3H: 템플릿 레포지토리 (나중에)

### 현재 Dyad 템플릿

Dyad는 `api.dyad.sh/v1/templates`에서 템플릿 목록을 가져오고, GitHub 레포에서 클론한다:

- `dyad-sh/nextjs-template`
- `dyad-sh/portal-mini-store-template`
- 등등

### ANYON 템플릿 옵션

**옵션 A: 자체 템플릿 레포**

- [ ] 템플릿 레포들을 SLIT-ANYON org로 포크
- [ ] `src/ipc/utils/template_utils.ts` 수정 — API URL 또는 레포 참조 변경

**옵션 B: 하드코딩**

- [ ] 템플릿 목록을 앱 내에 하드코딩
- [ ] GitHub 레포만 변경

**옵션 C: 현재 Dyad 템플릿 유지 (임시)**

- 어차피 공개 레포라서 클론 가능
- 나중에 자체 템플릿으로 교체

---

## 검증 체크리스트

```
빌드 검증:
- [ ] npm run build 성공
- [ ] macOS DMG 생성 확인
- [ ] Windows installer 생성 확인 (해당 시)
- [ ] Linux AppImage/deb 생성 확인 (해당 시)

앱 실행 검증:
- [ ] 앱 이름이 "ANYON"으로 표시
- [ ] 타이틀바에 새 로고 표시
- [ ] 딥링크 anyon:// 동작
- [ ] 자동 업데이트 체크 성공 (또는 에러 없이 스킵)

OAuth 검증:
- [ ] Supabase 연결 → oauth.any-on.dev → 앱 복귀
- [ ] Neon 연결 → 동일
- [ ] Vercel 연결 → 동일
```
