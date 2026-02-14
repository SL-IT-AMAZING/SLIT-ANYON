# Authentication Flow Diagrams

## 1. Complete OAuth Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE OAUTH FLOW                                   │
└──────────────────────────────────────────────────────────────────────────────┘

                            ELECTRON APP
┌───────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐     │
│  │ React Components (SupabaseConnector, VercelConnector)            │     │
│  │                                                                   │     │
│  │  User clicks "Add Organization" / "Connect to Vercel"           │     │
│  │                          ↓                                        │     │
│  │  handleAddAccount() / handleOAuthClick()                         │     │
│  │                          ↓                                        │     │
│  │  ipc.system.openExternalUrl(oauthEndpoints.{provider}.login)     │     │
│  └──────────────────────────┬──────────────────────────────────────┘     │
│                             │                                             │
│  ┌──────────────────────────┴──────────────────────────────────────┐     │
│  │ IPC Handler (system.openExternalUrl)                             │     │
│  │                          ↓                                        │     │
│  │  Opens external browser with OAuth URL:                          │     │
│  │  https://server-green-seven.vercel.app/api/oauth/...           │     │
│  └──────────────────────────┬──────────────────────────────────────┘     │
│                             │                                             │
└─────────────────────────────┼─────────────────────────────────────────────┘
                              │
                    ┌─────────↓─────────┐
                    │  BROWSER OPENS    │
                    │  EXTERNAL URL     │
                    └─────────┬─────────┘
                              │
                              ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                    OAUTH PROXY SERVER (Next.js)                              │
│             https://server-green-seven.vercel.app                            │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ /api/oauth/{provider}/login (GET)                                 │    │
│  │                                                                     │    │
│  │  1. Generate state (CSRF token)                                   │    │
│  │  2. Generate PKCE (for Vercel only):                              │    │
│  │     - codeVerifier (32 random bytes)                              │    │
│  │     - codeChallenge (SHA256(codeVerifier))                        │    │
│  │  3. Store in httpOnly cookies                                     │    │
│  │  4. Build authorization URL to provider                           │    │
│  │  5. 302 redirect to provider OAuth URL                            │    │
│  └────────────┬─────────────────────────────────────────────────────┘    │
│               │                                                             │
│  (Cookies stored: {provider}_oauth_state, {provider}_code_verifier)        │
│                                                                              │
└────────────────┼──────────────────────────────────────────────────────────┘
                 │
        ┌────────↓────────┐
        │  PROVIDER OAUTH │
        │  AUTHORIZATION  │
        │                 │
        │ Provider shows  │
        │ permission      │
        │ prompt to user  │
        └────────┬────────┘
                 │
           User clicks
           "Authorize"
                 │
        ┌────────↓────────┐
        │  PROVIDER SENDS │
        │  AUTHORIZATION  │
        │  CODE + STATE   │
        │                 │
        │  to proxy's     │
        │  callback URL   │
        └────────┬────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                    OAUTH PROXY SERVER (Next.js)                              │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ /api/oauth/{provider}/callback (GET)                              │    │
│  │                                                                     │    │
│  │  1. Extract code & state from query params                        │    │
│  │  2. Retrieve stored state from cookies                            │    │
│  │  3. Validate: state === storedState (CSRF check)                  │    │
│  │  4. If Vercel: Retrieve PKCE codeVerifier from cookies            │    │
│  │  5. Validate: codeVerifier exists (PKCE check)                    │    │
│  │  6. Exchange code for tokens:                                      │    │
│  │     POST to provider's token endpoint with:                        │    │
│  │     - code                                                         │    │
│  │     - client_id                                                    │    │
│  │     - client_secret                                                │    │
│  │     - code_verifier (PKCE, Vercel only)                           │    │
│  │     - redirect_uri                                                 │    │
│  │  7. Receive: access_token, refresh_token, expires_in              │    │
│  │  8. Build deep link with tokens:                                   │    │
│  │     anyon://{provider}-oauth-return?token=...&refreshToken=...   │    │
│  │  9. Delete cookies                                                │    │
│  │  10. Redirect to deep link (302)                                  │    │
│  └────────────┬─────────────────────────────────────────────────────┘    │
│               │                                                             │
│  Deep link format:                                                          │
│  anyon://supabase-oauth-return?token=...&refreshToken=...&expiresIn=...  │
│  anyon://vercel-oauth-return?token=...&refreshToken=...&expiresIn=...    │
│                                                                              │
└────────────────┼──────────────────────────────────────────────────────────┘
                 │
        ┌────────↓────────┐
        │  OPERATING      │
        │  SYSTEM         │
        │                 │
        │  Intercepts     │
        │  anyon://       │
        │  deep link      │
        └────────┬────────┘
                 │
                 ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                         ELECTRON APP (MAIN PROCESS)                          │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ app.on("open-url", (event, url) => handleDeepLinkReturn(url))     │    │
│  │                          ↓                                          │    │
│  │ handleDeepLinkReturn(url) in src/main.ts:438                       │    │
│  │                          ↓                                          │    │
│  │  1. Parse URL (anyon://...?token=...&refreshToken=...)             │    │
│  │  2. Extract hostname to determine provider                         │    │
│  │  3. Extract query params: token, refreshToken, expiresIn           │    │
│  │  4. Validate all params present                                    │    │
│  │  5. Call appropriate handler:                                       │    │
│  │                                                                     │    │
│  │     if (hostname === "supabase-oauth-return") {                   │    │
│  │       await handleSupabaseOAuthReturn({token, refreshToken, ...}) │    │
│  │     } else if (hostname === "vercel-oauth-return") {              │    │
│  │       handleVercelOAuthReturn({token, refreshToken, ...})          │    │
│  │     }                                                               │    │
│  │                                                                     │    │
│  │  6. Send deep-link-received event to renderer:                     │    │
│  │     mainWindow?.webContents.send("deep-link-received", {...})     │    │
│  └────────────┬─────────────────────────────────────────────────────┘    │
│               │                                                             │
└───────────────┼─────────────────────────────────────────────────────────────┘
                │
                ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                         OAUTH RETURN HANDLERS                                │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ src/supabase_admin/supabase_return_handler.ts                      │    │
│  │ handleSupabaseOAuthReturn({token, refreshToken, expiresIn})        │    │
│  │                                                                     │    │
│  │  1. Read current settings                                          │    │
│  │  2. Call listSupabaseOrganizations(token)                          │    │
│  │  3. Extract organization slug from response                        │    │
│  │  4. Store in organizations map:                                    │    │
│  │     settings.supabase.organizations[orgSlug] = {                  │    │
│  │       accessToken: { value: token },                              │    │
│  │       refreshToken: { value: refreshToken },                      │    │
│  │       expiresIn,                                                  │    │
│  │       tokenTimestamp: Date.now()                                  │    │
│  │     }                                                              │    │
│  │  5. Call writeSettings(settings)  ← Triggers encryption           │    │
│  └────────────┬─────────────────────────────────────────────────────┘    │
│               │                                                             │
│  ┌────────────↓─────────────────────────────────────────────────────┐    │
│  │ src/vercel_admin/vercel_return_handler.ts                         │    │
│  │ handleVercelOAuthReturn({token, refreshToken, expiresIn})         │    │
│  │                                                                     │    │
│  │  1. Write settings with vercel tokens:                             │    │
│  │     settings.vercel = {                                            │    │
│  │       accessToken: { value: token },                              │    │
│  │       refreshToken: { value: refreshToken },                      │    │
│  │       expiresIn,                                                  │    │
│  │       tokenTimestamp: Date.now()                                  │    │
│  │     }                                                              │    │
│  │  2. Call writeSettings(settings)  ← Triggers encryption           │    │
│  └────────────┬─────────────────────────────────────────────────────┘    │
│               │                                                             │
└───────────────┼─────────────────────────────────────────────────────────────┘
                │
                ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                      TOKEN ENCRYPTION & STORAGE                              │
│                   src/main/settings.ts:210 (writeSettings)                   │
│                                                                              │
│  For each token field (accessToken, refreshToken, etc.):                    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ 1. Call encrypt(token.value)                                       │    │
│  │                                                                     │    │
│  │    function encrypt(data: string): Secret {                       │    │
│  │      if (safeStorage.isEncryptionAvailable() && !IS_TEST_BUILD) { │    │
│  │        return {                                                    │    │
│  │          value: safeStorage.encryptString(data)                   │    │
│  │                  .toString("base64"),  ← Encrypt + Base64         │    │
│  │          encryptionType: "electron-safe-storage"                  │    │
│  │        }                                                           │    │
│  │      }                                                             │    │
│  │      return {                                                      │    │
│  │        value: data,  ← Plaintext in test builds                   │    │
│  │        encryptionType: "plaintext"                                │    │
│  │      }                                                             │    │
│  │    }                                                               │    │
│  │                                                                     │    │
│  │ 2. Store encrypted tokens in settings object                      │    │
│  │ 3. Write settings to file:                                        │    │
│  │    ~/.config/anyon/user-settings.json                             │    │
│  │    (or platform equivalent)                                       │    │
│  │                                                                     │    │
│  │    {                                                               │    │
│  │      "supabase": {                                                │    │
│  │        "organizations": {                                         │    │
│  │          "org-slug": {                                            │    │
│  │            "accessToken": {                                       │    │
│  │              "value": "encrypted_base64_string",  ← Encrypted     │    │
│  │              "encryptionType": "electron-safe-storage"            │    │
│  │            },                                                      │    │
│  │            "refreshToken": { ... },                               │    │
│  │            "expiresIn": 3600,                                     │    │
│  │            "tokenTimestamp": 1708123456                           │    │
│  │          }                                                         │    │
│  │        }                                                           │    │
│  │      },                                                            │    │
│  │      "vercel": { ... }                                            │    │
│  │    }                                                               │    │
│  └────────────┬─────────────────────────────────────────────────────┘    │
│               │                                                             │
│  Encryption Backends:                                                       │
│  - macOS: Keychain                                                          │
│  - Windows: DPAPI (Data Protection API)                                     │
│  - Linux: Secret Service (if available)                                     │
│                                                                              │
└───────────────┼──────────────────────────────────────────────────────────────┘
                │
                ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                      REACT COMPONENT UPDATE                                  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ mainWindow?.webContents.send("deep-link-received", {              │    │
│  │   type: "supabase-oauth-return" | "vercel-oauth-return"           │    │
│  │ })                                                                  │    │
│  │                          ↓                                          │    │
│  │ src/contexts/DeepLinkContext.tsx:27 (useEffect)                   │    │
│  │                          ↓                                          │    │
│  │ ipc.events.misc.onDeepLinkReceived((data) => {                    │    │
│  │   setLastDeepLink({...data, timestamp: Date.now()})               │    │
│  │ })                                                                  │    │
│  │                          ↓                                          │    │
│  │ DeepLinkContext broadcasts to all subscribers                      │    │
│  └────────────┬─────────────────────────────────────────────────────┘    │
│               │                                                             │
│  ┌────────────↓─────────────────────────────────────────────────────┐    │
│  │ src/components/SupabaseConnector.tsx (useEffect):                │    │
│  │                                                                     │    │
│  │ if (lastDeepLink?.type === "supabase-oauth-return") {            │    │
│  │   await refreshSettings()  ← Decrypt tokens                      │    │
│  │   await refetchOrganizations()                                    │    │
│  │   await refetchProjects()                                         │    │
│  │   await refreshApp()                                              │    │
│  │   clearLastDeepLink()                                             │    │
│  │ }                                                                  │    │
│  └────────────┬─────────────────────────────────────────────────────┘    │
│               │                                                             │
│  ┌────────────↓─────────────────────────────────────────────────────┐    │
│  │ src/components/VercelConnector.tsx (useEffect):                  │    │
│  │                                                                     │    │
│  │ if (lastDeepLink?.type === "vercel-oauth-return") {              │    │
│  │   await refreshSettings()  ← Decrypt tokens                      │    │
│  │   toast.success("Connected to Vercel!")                          │    │
│  │   clearLastDeepLink()                                             │    │
│  │ }                                                                  │    │
│  └────────────┬─────────────────────────────────────────────────────┘    │
│               │                                                             │
│  ┌────────────↓─────────────────────────────────────────────────────┐    │
│  │ Components re-render with new organizations/projects             │    │
│  │                                                                     │    │
│  │ Users can now see connected organizations/Vercel projects        │    │
│  │ and can create/connect app to them                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Token Refresh Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    TOKEN REFRESH FLOW                                │
│            (Automatic, Transparent to User)                          │
└──────────────────────────────────────────────────────────────────────┘

  When IPC handler needs Supabase client:
  
  getSupabaseClient({ organizationSlug })
           ↓
  ┌─────────────────────────────────────────┐
  │ Check if token expired:                 │
  │                                         │
  │ isTokenExpired(expiresIn) {            │
  │   return currentTime >=                │
  │     tokenTimestamp + expiresIn - 300   │
  │ }                                       │
  │                                         │
  │ (Refresh if < 5 minutes left)          │
  └────────────────────┬────────────────────┘
                       │
         ┌─────────────┴──────────────┐
         │                            │
    Token NOT                   Token IS EXPIRED
    expired                      or EXPIRING SOON
         │                            │
         ↓                            ↓
    Return client              withLock("refresh-token", async () => {
    with existing                 refreshSupabaseTokenForOrganization(slug)
    token                       })
         │                            │
         │                            ↓
         │                   fetch(OAUTH_PROXY/refresh, {
         │                     method: "POST",
         │                     body: { refreshToken }
         │                   })
         │                            │
         │                            ↓
         │                   Response: {
         │                     accessToken,
         │                     refreshToken (may be new),
         │                     expiresIn
         │                   }
         │                            │
         │                            ↓
         │                   writeSettings({
         │                     supabase: {
         │                       organizations: {
         │                         [slug]: {
         │                           accessToken: { value: new },
         │                           refreshToken: { value: new },
         │                           expiresIn,
         │                           tokenTimestamp: now()
         │                         }
         │                       }
         │                     }
         │                   })  ← Triggers encryption
         │                            │
         │                            ↓
         │                   readSettings()  ← Decrypts
         │                            │
         └────────────┬───────────────┘
                      │
                      ↓
         new SupabaseManagementAPI({
           accessToken: refreshedToken
         })
```

---

## 3. Data Flow: OAuth Return Handling

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DATA FLOW: OAUTH RETURN                           │
└──────────────────────────────────────────────────────────────────────┘

DEEP LINK ARRIVAL:
anyon://supabase-oauth-return?token=xxx&refreshToken=yyy&expiresIn=3600

        ↓

PARSE & VALIDATE (src/main.ts:438-445):
  - Parse URL
  - Extract hostname (supabase-oauth-return)
  - Extract params (token, refreshToken, expiresIn)
  - Validate all params present

        ↓

ROUTE TO HANDLER (src/main.ts:480-496):
  if (hostname === "supabase-oauth-return") {
    await handleSupabaseOAuthReturn({token, refreshToken, expiresIn})
  }

        ↓

HANDLER PROCESSING (src/supabase_admin/supabase_return_handler.ts:18):

  ┌────────────────────────────────────┐
  │ readSettings()                     │  ← Decrypt existing tokens
  │                                    │
  │ listSupabaseOrganizations(token)   │  ← Call Supabase API
  │                                    │
  │ Extract org slug from response     │
  │                                    │
  │ Merge into organizations map:      │
  │ organizations[orgSlug] = {         │
  │   accessToken: {value: token},     │
  │   refreshToken: {value: token},    │
  │   expiresIn,                       │
  │   tokenTimestamp: now()            │
  │ }                                  │
  │                                    │
  │ writeSettings(settings)            │  ← Encrypt & save
  └────────────────────────────────────┘

        ↓

ENCRYPTION & STORAGE (src/main/settings.ts:210-291):

  For each token field:
    encrypt(tokenValue)
      ↓
    Call safeStorage.encryptString(value).toString("base64")
      ↓
    Return { value: encrypted, encryptionType: "electron-safe-storage" }
      ↓
    Store in settings.json with encryptionType metadata

        ↓

SEND EVENT TO RENDERER:
  mainWindow?.webContents.send("deep-link-received", {
    type: "supabase-oauth-return"
  })

        ↓

REACT LISTENER (src/contexts/DeepLinkContext.tsx:27):
  ipc.events.misc.onDeepLinkReceived((data) => {
    setLastDeepLink({...data, timestamp: Date.now()})
  })

        ↓

COMPONENT UPDATES (src/components/SupabaseConnector.tsx:81-92):
  useEffect(() => {
    if (lastDeepLink?.type === "supabase-oauth-return") {
      refreshSettings()  ← Loads file, decrypts tokens
      refetchOrganizations()  ← Makes API call with new token
      refetchProjects()  ← Makes API call with new token
      refreshApp()
      clearLastDeepLink()
    }
  }, [lastDeepLink?.timestamp])

        ↓

UI UPDATE:
  Component re-renders with new organizations/projects
  User sees new accounts in the UI
```

---

## 4. Token Storage Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│         ENCRYPTED SETTINGS FILE STRUCTURE                            │
│    ~/.config/anyon/user-settings.json                                │
└──────────────────────────────────────────────────────────────────────┘

{
  "supabase": {
    "organizations": {
      "org-slug-org123abc": {
        "accessToken": {
          "value": "c2FmZVN0b3JhZ2VFbmNyeXB0ZWRCaW5hcnlBc0Jhc2U2NA==",
          "encryptionType": "electron-safe-storage"
        },
        "refreshToken": {
          "value": "c2FmZVN0b3JhZ2VFbmNyeXB0ZWRCaW5hcnlBc0Jhc2U2NA==",
          "encryptionType": "electron-safe-storage"
        },
        "expiresIn": 3600,
        "tokenTimestamp": 1708123456
      },
      "org-slug-org456def": {
        // Multiple organizations supported
        ...
      }
    },
    // Legacy format (fallback):
    "accessToken": {
      "value": "c2FmZVN0b3JhZ2VFbmNyeXB0ZWRCaW5hcnlBc0Jhc2U2NA==",
      "encryptionType": "electron-safe-storage"
    },
    "refreshToken": { ... },
    "expiresIn": 3600,
    "tokenTimestamp": 1708123456
  },
  "vercel": {
    "accessToken": {
      "value": "c2FmZVN0b3JhZ2VFbmNyeXB0ZWRCaW5hcnlBc0Jhc2U2NA==",
      "encryptionType": "electron-safe-storage"
    },
    "refreshToken": {
      "value": "c2FmZVN0b3JhZ2VFbmNyeXB0ZWRCaW5hcnlBc0Jhc2U2NA==",
      "encryptionType": "electron-safe-storage"
    },
    "expiresIn": 3600,
    "tokenTimestamp": 1708123456
  },
  "vercelAccessToken": {
    // Alternative storage for manual token entry
    "value": "...",
    "encryptionType": "electron-safe-storage"
  }
}

┌──────────────────────────────────────────────────────────────────────┐
│ ENCRYPTION PROCESS:                                                  │
│                                                                      │
│ Raw token string:                                                   │
│ "sbpb_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"             │
│                                                                      │
│ → safeStorage.encryptString(rawToken)                              │
│                                                                      │
│ → Returns Buffer (encrypted binary data from OS)                    │
│                                                                      │
│ → .toString("base64")                                              │
│                                                                      │
│ → "c2FmZVN0b3JhZ2VFbmNyeXB0ZWRCaW5hcnlBc0Jhc2U2NA=="  (base64)    │
│                                                                      │
│ → Store in settings.json with metadata:                            │
│   { value: "c2FmZ...", encryptionType: "electron-safe-storage" }   │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│ DECRYPTION PROCESS:                                                  │
│                                                                      │
│ Read from settings.json:                                            │
│ { value: "c2FmZ...", encryptionType: "electron-safe-storage" }     │
│                                                                      │
│ → decrypt({ value: "c2FmZ...", encryptionType: "..." })            │
│                                                                      │
│ → if (encryptionType === "electron-safe-storage") {                │
│     Buffer.from(value, "base64")  → Convert from base64            │
│                                                                      │
│ → safeStorage.decryptString(buffer)  → Decrypt from OS             │
│                                                                      │
│ → "sbpb_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"            │
│                                                                      │
│ → Now usable as access token!                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Component Interaction Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                 COMPONENT INTERACTION DIAGRAM                        │
└──────────────────────────────────────────────────────────────────────┘

USER INTERFACE LAYER:
┌──────────────────────────────────────────────────────────────────┐
│ SupabaseConnector.tsx / VercelConnector.tsx                      │
│ (React Components in Renderer Process)                           │
│                                                                  │
│ • Render "Add Organization" / "Connect" buttons                 │
│ • Listen to Deep Link Context                                   │
│ • Display connected organizations/projects                      │
│ • Handle user interactions                                      │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     │ Calls IPC
                     ↓
IPC LAYER:
┌──────────────────────────────────────────────────────────────────┐
│ ipc.system.openExternalUrl(oauthEndpoints.{provider}.login)      │
│ ipc.vercel.saveToken({ token })  (manual entry)                 │
│                                                                  │
│ Async bridge between Renderer and Main Process                  │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ↓
MAIN PROCESS LAYER:
┌──────────────────────────────────────────────────────────────────┐
│ src/main.ts:                                                     │
│ • app.on("open-url") - Protocol handler                         │
│ • handleDeepLinkReturn() - Route dispatcher                     │
│                                                                  │
│ src/vercel_admin/vercel_return_handler.ts:                      │
│ • handleVercelOAuthReturn()                                     │
│                                                                  │
│ src/supabase_admin/supabase_return_handler.ts:                  │
│ • handleSupabaseOAuthReturn()                                   │
│                                                                  │
│ src/main/settings.ts:                                           │
│ • readSettings() - Load & decrypt                               │
│ • writeSettings() - Encrypt & save                              │
│ • encrypt() - Use safeStorage                                   │
│ • decrypt() - Use safeStorage                                   │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ↓
ELECTRON SAFE STORAGE:
┌──────────────────────────────────────────────────────────────────┐
│ OS-Level Encryption                                              │
│                                                                  │
│ macOS:   Keychain                                                │
│ Windows: DPAPI (Data Protection API)                            │
│ Linux:   Secret Service (if available)                          │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ↓
FILE SYSTEM LAYER:
┌──────────────────────────────────────────────────────────────────┐
│ ~/.config/anyon/user-settings.json                               │
│ (Contains encrypted tokens)                                      │
└──────────────────────────────────────────────────────────────────┘

RENDERER PROCESS (After OAuth Complete):
┌──────────────────────────────────────────────────────────────────┐
│ src/contexts/DeepLinkContext.tsx:                                │
│ • Listens to ipc.events.misc.onDeepLinkReceived                 │
│ • Updates lastDeepLink state                                    │
│ • Broadcasts to all child components                            │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ↓
COMPONENT LISTENERS:
┌──────────────────────────────────────────────────────────────────┐
│ SupabaseConnector.tsx & VercelConnector.tsx:                     │
│ • useEffect(() => {                                             │
│     if (lastDeepLink?.type === "supabase-oauth-return") {       │
│       refreshSettings()                                         │
│       refetchOrganizations()                                    │
│       refetchProjects()                                         │
│       refreshApp()                                              │
│     }                                                            │
│   }, [lastDeepLink?.timestamp])                                 │
│                                                                  │
│ Triggers TanStack Query hooks:                                  │
│ • useQuery({ queryKey, queryFn })                               │
│ • Makes API calls with authenticated client                     │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ↓
API CLIENTS:
┌──────────────────────────────────────────────────────────────────┐
│ src/supabase_admin/supabase_management_client.ts:                │
│ • getSupabaseClient({ organizationSlug })                        │
│ • Auto-refresh expired tokens                                    │
│ • Create authenticated SDK client                                │
│                                                                  │
│ src/ipc/handlers/vercel_handlers.ts:                             │
│ • createVercelClient(token)                                      │
│ • Extract token from settings                                    │
│ • Create authenticated SDK client                                │
└────────────────────┬─────────────────────────────────────────────┘
                     │
                     ↓
EXTERNAL APIs:
┌──────────────────────────────────────────────────────────────────┐
│ Supabase Management API:                                         │
│ • GET /v1/projects                                               │
│ • GET /v1/branches                                               │
│ • GET /v1/logs                                                   │
│ • etc.                                                           │
│                                                                  │
│ Vercel API:                                                      │
│ • GET /v9/projects                                               │
│ • POST /v1/deployments                                           │
│ • etc.                                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Security Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      SECURITY FLOW                                │
└──────────────────────────────────────────────────────────────────┘

ATTACK VECTOR: CSRF (Cross-Site Request Forgery)

┌─────────────────────────────────────────┐
│ OAuth Proxy /login Endpoint              │
│                                         │
│ Generate: state = randomUUID()          │
│ Store in httpOnly cookie:               │
│   {provider}_oauth_state = state        │
│   (httpOnly, sameSite=lax, maxAge=600)  │
└─────────────────────────────────────────┘
           ↓
         (User goes through OAuth flow)
           ↓
┌─────────────────────────────────────────┐
│ OAuth Proxy /callback Endpoint           │
│                                         │
│ Receive: state (from provider)          │
│ Read: storedState (from cookie)         │
│                                         │
│ if (state !== storedState) {            │
│   return 400 "Invalid state parameter"  │
│ }                                       │
│                                         │
│ ✅ If match: Proceed with token exchange│
└─────────────────────────────────────────┘

ATTACK VECTOR: CODE INTERCEPTION (Vercel PKCE)

┌─────────────────────────────────────────┐
│ OAuth Proxy /login Endpoint (Vercel)     │
│                                         │
│ codeVerifier = random32bytes()          │
│ codeChallenge = SHA256(codeVerifier)    │
│                                         │
│ Store in httpOnly cookie:               │
│   vercel_code_verifier = codeVerifier   │
│   (httpOnly, sameSite=lax)              │
│                                         │
│ Send to Vercel OAuth:                   │
│   code_challenge = codeChallenge        │
│   code_challenge_method = "S256"        │
└─────────────────────────────────────────┘
           ↓
         (User goes through OAuth flow)
         (Attacker intercepts code but)
         (doesn't have codeVerifier)
           ↓
┌─────────────────────────────────────────┐
│ OAuth Proxy /callback Endpoint (Vercel)  │
│                                         │
│ Read: storedVerifier (from cookie)      │
│                                         │
│ if (!storedVerifier) {                  │
│   return 400 "Missing PKCE code verifier│
│ }                                       │
│                                         │
│ Exchange code with:                     │
│   code_verifier = storedVerifier        │
│   (Vercel validates against challenge)  │
│                                         │
│ ✅ Attacker cannot forge verifier       │
│ ✅ Code alone is useless                │
└─────────────────────────────────────────┘

TOKEN ENCRYPTION:

┌─────────────────────────────────────────┐
│ Token in memory (temporary)              │
│ "sbpb_xxxxxxxxxxxxxxxxxxxx"              │
│           ↓                              │
│ encrypt(token)                           │
│           ↓                              │
│ safeStorage.encryptString(token)         │
│ (Request OS keychain/DPAPI)              │
│           ↓                              │
│ Binary encrypted data                    │
│           ↓                              │
│ .toString("base64")                      │
│           ↓                              │
│ "c2FmZVN0b3JhZ2VF..."                   │
│ (Safe to store in JSON)                  │
│           ↓                              │
│ Write to disk                            │
│ ~/.config/anyon/user-settings.json       │
│                                         │
│ ✅ Token never stored in plaintext      │
│ ✅ Encrypted at rest (OS level)         │
│ ✅ Can only be decrypted by Anyon app   │
└─────────────────────────────────────────┘

NO URL LOGGING:

┌─────────────────────────────────────────┐
│ src/main.ts:448-454                      │
│                                         │
│ log.log(                                │
│   "Handling deep link: protocol",       │
│   parsed.protocol,  ← Logged             │
│   "hostname",                           │
│   parsed.hostname   ← Logged             │
│ );                                      │
│                                         │
│ ✅ Only protocol & hostname logged      │
│ ✅ URL params (tokens) NOT logged       │
│ ✅ Prevents token leakage in logs       │
└─────────────────────────────────────────┘
```

