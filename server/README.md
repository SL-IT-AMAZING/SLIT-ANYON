# OAuth Proxy Server

## 프로젝트 소개

Dyad의 외부 OAuth 서비스(oauth.dyad.sh)를 대체하는 자체 호스팅 OAuth 프록시 서버입니다. Neon, Supabase, Vercel의 OAuth 플로우를 처리하고, 인증 완료 후 `dyad://` 딥링크를 통해 Electron 앱으로 리다이렉트합니다.

이 서버를 사용하면 외부 OAuth 서비스에 의존하지 않고 독립적으로 OAuth 인증을 관리할 수 있습니다.

## 기술 스택

- **Next.js 15**: 서버 프레임워크
- **React 19**: UI 컴포넌트
- **TypeScript**: 타입 안정성
- **배포 환경**: Vercel

## 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
OAUTH_SERVER_URL=https://oauth.yourcompany.com
NEON_CLIENT_ID=
NEON_CLIENT_SECRET=
SUPABASE_CLIENT_ID=
SUPABASE_CLIENT_SECRET=
VERCEL_CLIENT_ID=
VERCEL_CLIENT_SECRET=
```

### 환경 변수 설명

| 변수명                   | 설명                                                           |
| ------------------------ | -------------------------------------------------------------- |
| `OAUTH_SERVER_URL`       | 배포된 OAuth 서버의 URL (로컬 개발 시 `http://localhost:3000`) |
| `NEON_CLIENT_ID`         | Neon OAuth 앱의 클라이언트 ID                                  |
| `NEON_CLIENT_SECRET`     | Neon OAuth 앱의 클라이언트 시크릿                              |
| `SUPABASE_CLIENT_ID`     | Supabase OAuth 앱의 클라이언트 ID                              |
| `SUPABASE_CLIENT_SECRET` | Supabase OAuth 앱의 클라이언트 시크릿                          |
| `VERCEL_CLIENT_ID`       | Vercel OAuth 앱의 클라이언트 ID                                |
| `VERCEL_CLIENT_SECRET`   | Vercel OAuth 앱의 클라이언트 시크릿                            |

## 지원 상태

| Provider | Status          | Auth Method                              |
| -------- | --------------- | ---------------------------------------- |
| Supabase | ✅ Working      | OAuth 2.0                                |
| Vercel   | ✅ Working      | OAuth 2.0 (Sign in with Vercel)          |
| Neon     | ⚠️ API Key Only | API Key (OAuth requires Partner Program) |

## OAuth App 등록 가이드

각 서비스 제공자에서 OAuth 애플리케이션을 등록해야 합니다.

### Neon

> ⚠️ **중요**: Neon OAuth는 Partner Program 가입이 필요합니다. 일반 사용자는 API 키 방식을 사용해야 합니다.

**API 키 방식 (권장):**

1. https://console.neon.tech/app/settings/api-keys 접속
2. **Create new API Key** 클릭
3. 생성된 API 키를 Dyad 앱의 Neon 커넥터에 입력

**OAuth 방식 (Partner Program 필요):**

1. https://console.neon.tech 접속
2. **Settings** → **OAuth Applications** → **Create** 클릭
3. 다음 정보 입력:
   - **Redirect URI**: `{OAUTH_SERVER_URL}/api/oauth/neon/callback`
   - **Required Scopes**:
     - `openid`
     - `offline`
     - `offline_access`
     - `urn:neoncloud:projects:create`
     - `urn:neoncloud:projects:read`
     - `urn:neoncloud:projects:update`
     - `urn:neoncloud:projects:delete`
     - `urn:neoncloud:orgs:read`
4. 생성 후 받은 Client ID와 Client Secret을 환경 변수에 설정

### Supabase

1. https://supabase.com/dashboard/account/oauth-apps 접속
2. **Add OAuth App** 클릭
3. 다음 정보 입력:
   - **Redirect URI**: `{OAUTH_SERVER_URL}/api/oauth/supabase/callback`
4. 생성 후 받은 Client ID와 Client Secret을 환경 변수에 설정

### Vercel

> ⚠️ **중요**: "Vercel Integration"이 아닌 **"Sign in with Vercel" App**을 생성해야 합니다!

1. Vercel Dashboard → **Settings** → **Apps** 접속
2. "Sign in with Vercel" 섹션에서 **Create App** 클릭
3. 다음 정보 입력:
   - **Authorization Callback URL**: `{OAUTH_SERVER_URL}/api/oauth/vercel/callback`
4. 생성 후 받은 Client ID와 Client Secret을 환경 변수에 설정

**참고**: Vercel OAuth는 PKCE(Proof Key for Code Exchange)를 사용하여 추가적인 보안을 제공합니다. `code_challenge`와 `code_verifier`가 자동으로 처리됩니다.

## 로컬 개발

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버는 http://localhost:3000 에서 실행됩니다.

### 로컬 테스트 설정

로컬에서 테스트할 때는 환경 변수를 다음과 같이 설정하세요:

```bash
OAUTH_SERVER_URL=http://localhost:3000
```

각 OAuth 제공자의 설정에서도 Redirect URI를 로컬 URL로 업데이트해야 합니다.

## API 엔드포인트

| Method | Path                           | 설명                                                 |
| ------ | ------------------------------ | ---------------------------------------------------- |
| GET    | `/api/oauth/neon/login`        | Neon OAuth 인증 시작 (302 리다이렉트)                |
| GET    | `/api/oauth/neon/callback`     | Neon OAuth 콜백 → `dyad://neon-oauth-return`         |
| POST   | `/api/oauth/neon/refresh`      | Neon 액세스 토큰 갱신 (body: `{refreshToken}`)       |
| GET    | `/api/oauth/supabase/login`    | Supabase OAuth 인증 시작 (302 리다이렉트)            |
| GET    | `/api/oauth/supabase/callback` | Supabase OAuth 콜백 → `dyad://supabase-oauth-return` |
| POST   | `/api/oauth/supabase/refresh`  | Supabase 액세스 토큰 갱신 (body: `{refreshToken}`)   |
| GET    | `/api/oauth/vercel/login`      | Vercel OAuth 인증 시작 (PKCE 사용)                   |
| GET    | `/api/oauth/vercel/callback`   | Vercel OAuth 콜백 → `dyad://vercel-oauth-return`     |
| POST   | `/api/oauth/vercel/refresh`    | Vercel 액세스 토큰 갱신 (body: `{refreshToken}`)     |

### Refresh 엔드포인트 사용 예시

```bash
curl -X POST https://oauth.yourcompany.com/api/oauth/neon/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your_refresh_token"}'
```

**응답 형식**:

```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token",
  "expiresIn": 3600
}
```

## Vercel 배포

### 배포 단계

1. GitHub 저장소를 Vercel에 연결
2. Vercel 대시보드에서 환경 변수 설정:
   - **Settings** → **Environment Variables**로 이동
   - 위에서 설명한 모든 환경 변수 추가
   - `OAUTH_SERVER_URL`은 배포된 URL로 설정 (예: `https://oauth.yourcompany.com`)
3. **Deploy** 클릭

### 배포 후 설정

1. 배포된 URL 확인
2. 각 OAuth 제공자의 Redirect URI를 배포된 URL로 업데이트:
   - Neon: `https://oauth.yourcompany.com/api/oauth/neon/callback`
   - Supabase: `https://oauth.yourcompany.com/api/oauth/supabase/callback`
   - Vercel: `https://oauth.yourcompany.com/api/oauth/vercel/callback`

## 아키텍처 설명

### 상태 관리

- OAuth 상태는 httpOnly 쿠키에 저장됩니다
- 별도의 데이터베이스가 필요하지 않습니다
- 세션 데이터는 서버 메모리에 임시 저장됩니다

### 보안

- **Vercel PKCE**: Vercel OAuth는 PKCE를 사용하여 추가 보안을 제공합니다
  - `code_verifier`는 쿠키에 저장
  - `code_challenge`는 인증 요청 시 전송
  - 콜백에서 `code_verifier`로 검증

### 플로우

1. **Login 엔드포인트**: 사용자를 OAuth 제공자로 리다이렉트
2. **Callback 엔드포인트**:
   - OAuth 제공자로부터 인증 코드 수신
   - 액세스 토큰과 리프레시 토큰 교환
   - `dyad://` 딥링크로 토큰 데이터와 함께 리다이렉트
3. **Refresh 엔드포인트**:
   - POST 요청으로 `{refreshToken}` 수신
   - 새로운 액세스 토큰 발급
   - `{accessToken, refreshToken, expiresIn}` 응답 반환

### 딥링크 형식

콜백 후 Electron 앱으로 전달되는 딥링크 형식:

```
dyad://neon-oauth-return?accessToken=xxx&refreshToken=yyy&expiresIn=3600
dyad://supabase-oauth-return?accessToken=xxx&refreshToken=yyy&expiresIn=3600
dyad://vercel-oauth-return?accessToken=xxx&refreshToken=yyy&expiresIn=3600
```

## 클라이언트 설정

OAuth 서버 배포 후, Dyad Electron 앱의 설정을 업데이트해야 합니다:

1. `/Users/cosmos/Documents/test/dyad/src/lib/oauthConfig.ts` 파일 열기
2. `OAUTH_SERVER_URL` 상수를 배포된 서버 URL로 변경:

```typescript
export const OAUTH_SERVER_URL = "https://oauth.yourcompany.com";
```

3. Electron 앱 재빌드

이제 Dyad 앱은 자체 호스팅된 OAuth 서버를 사용하여 인증을 처리합니다.

## 문제 해결

### Redirect URI 불일치 오류

OAuth 제공자에서 "redirect_uri_mismatch" 오류가 발생하면:

- 환경 변수의 `OAUTH_SERVER_URL`이 정확한지 확인
- OAuth 앱 설정의 Redirect URI가 정확히 일치하는지 확인 (끝에 슬래시 유무 포함)

### 토큰 만료

- Refresh 엔드포인트를 사용하여 새로운 액세스 토큰 발급
- 리프레시 토큰도 만료된 경우 재인증 필요

### PKCE 관련 오류 (Vercel)

- 쿠키가 제대로 전달되는지 확인
- 브라우저의 쿠키 설정 확인 (third-party cookies 차단 여부)
