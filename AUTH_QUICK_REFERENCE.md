# Authentication Flow Quick Reference

## 🎯 Flow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OAUTH FLOW ARCHITECTURE                           │
└─────────────────────────────────────────────────────────────────────┘

User clicks "Connect" button in UI
        ↓
src/components/SupabaseConnector.tsx:145 OR VercelConnector.tsx:400
        ↓
Opens external URL: https://server-green-seven.vercel.app/api/oauth/{provider}/login
        ↓
OAuth Proxy Server (server/app/api/oauth/{provider}/)
        ├─ /login → Redirects to provider's OAuth authorization URL
        └─ /callback → Exchanges code for tokens
        ↓
Provider OAuth server redirects back to proxy callback
        ↓
Proxy creates deep link: anyon://{provider}-oauth-return?token=...&refreshToken=...
        ↓
Electron app intercepts deep link via protocol handler (src/main.ts:434)
        ↓
src/main.ts:480 (supabase) or src/main.ts:498 (vercel)
Calls handler: handleSupabaseOAuthReturn() or handleVercelOAuthReturn()
        ↓
Tokens encrypted and stored in ~/.config/anyon/user-settings.json
        ↓
Deep link event sent to React: mainWindow?.webContents.send("deep-link-received")
        ↓
src/contexts/DeepLinkContext.tsx listens and updates state
        ↓
Components refresh and refetch data with new tokens
```

---

## 📁 KEY FILES MAP

### Entry Points (User Interaction)
- **Supabase UI:** `src/components/SupabaseConnector.tsx:295` (Add Organization button)
- **Vercel UI:** `src/components/VercelConnector.tsx:400` (Connect button)
- **Vercel Manual:** `src/components/VercelConnector.tsx:301` (Manual token form)

### Deep Link Processing
- **Protocol Handler:** `src/main.ts:434` (app.on("open-url"))
- **Route Dispatcher:** `src/main.ts:438` (handleDeepLinkReturn function)
- **Supabase Handler:** `src/supabase_admin/supabase_return_handler.ts:18`
- **Vercel Handler:** `src/vercel_admin/vercel_return_handler.ts:3`
- **React Listener:** `src/contexts/DeepLinkContext.tsx:27`

### Token Storage & Encryption
- **Read/Write:** `src/main/settings.ts:53` (readSettings) & `src/main/settings.ts:210` (writeSettings)
- **Encrypt:** `src/main/settings.ts:293` (Uses Electron safeStorage)
- **Decrypt:** `src/main/settings.ts:306` (Reverses encryption)
- **Storage Location:** `~/.config/anyon/user-settings.json`

### Token Refresh
- **Supabase Refresh:** `src/supabase_admin/supabase_management_client.ts:109`
- **Vercel Refresh:** `server/app/api/oauth/vercel/refresh/route.ts`
- **Expiration Check:** `src/supabase_admin/supabase_management_client.ts:93`
- **Auto-refresh:** `src/supabase_admin/supabase_management_client.ts:187`

### API Clients
- **Supabase:** `src/supabase_admin/supabase_management_client.ts:165` (getSupabaseClient)
- **Vercel:** `src/ipc/handlers/vercel_handlers.ts:38` (createVercelClient)

### OAuth Proxy Server
- **Supabase Login:** `server/app/api/oauth/supabase/login/route.ts`
- **Supabase Callback:** `server/app/api/oauth/supabase/callback/route.ts`
- **Supabase Refresh:** `server/app/api/oauth/supabase/refresh/route.ts`
- **Vercel Login:** `server/app/api/oauth/vercel/login/route.ts` (with PKCE)
- **Vercel Callback:** `server/app/api/oauth/vercel/callback/route.ts` (PKCE validation)
- **Vercel Refresh:** `server/app/api/oauth/vercel/refresh/route.ts`

### Configuration
- **OAuth URLs:** `src/lib/oauthConfig.ts` (Centralized endpoint config)

---

## 🔐 Token Storage Format

```json
{
  "supabase": {
    "organizations": {
      "org-slug-123": {
        "accessToken": {
          "value": "encrypted_token",
          "encryptionType": "electron-safe-storage"
        },
        "refreshToken": {
          "value": "encrypted_token",
          "encryptionType": "electron-safe-storage"
        },
        "expiresIn": 3600,
        "tokenTimestamp": 1708123456
      }
    }
  },
  "vercel": {
    "accessToken": {
      "value": "encrypted_token",
      "encryptionType": "electron-safe-storage"
    },
    "refreshToken": {
      "value": "encrypted_token",
      "encryptionType": "electron-safe-storage"
    },
    "expiresIn": 3600,
    "tokenTimestamp": 1708123456
  }
}
```

---

## 🔄 Supabase Token Lifecycle

1. **Initialization:** User clicks "Add Organization" button
2. **OAuth Flow:** Browser opens OAuth proxy login endpoint
3. **Callback:** OAuth proxy exchanges code for tokens
4. **Deep Link:** Proxy redirects to `anyon://supabase-oauth-return?token=...`
5. **Storage:** handleSupabaseOAuthReturn() encrypts and stores tokens
6. **Organization Detection:** Handler fetches org details to determine which org token belongs to
7. **Organization-Specific Storage:** Tokens stored in `organizations[orgSlug]` map
8. **Refresh:** When token expires (within 5 min), getSupabaseClient() auto-refreshes
9. **API Calls:** Management client uses refreshed token for all requests

---

## 🔄 Vercel Token Lifecycle

1. **Initialization:** User clicks "Connect to Vercel" button OR enters manual token
2. **OAuth Flow (if OAuth):**
   - Browser opens OAuth proxy login endpoint
   - PKCE state generated and stored in cookie
   - OAuth proxy exchanges code for tokens with PKCE validation
3. **Callback:** OAuth proxy redirects to `anyon://vercel-oauth-return?token=...`
4. **Storage:** handleVercelOAuthReturn() encrypts and stores tokens globally
5. **No Auto-Refresh:** Currently no auto-refresh implemented for Vercel tokens
6. **API Calls:** IPC handlers manually extract token from settings and pass to SDK

---

## 🛡️ Security Features

### Encryption
- **Method:** Electron `safeStorage` API
- **Backend:** 
  - macOS: Keychain
  - Windows: DPAPI (Data Protection API)
  - Linux: Secret Service
- **Fallback:** Plaintext in test builds only
- **Implementation:** Tokens encrypted on write, auto-decrypted on read

### OAuth CSRF Protection
- **State Parameter:** Random UUID generated for each login attempt
- **Validation:** State verified on callback before token exchange
- **Storage:** httpOnly cookies (not accessible to JavaScript)

### PKCE Protection (Vercel)
- **Code Verifier:** 32-byte random value
- **Code Challenge:** SHA256 hash of verifier
- **Purpose:** Prevents authorization code interception

### No Password Storage
- **Status:** No password-based authentication implemented
- **Manual Token:** Only Vercel supports manual token entry (API key)

---

## 🔧 Implementation: For AI Agent Credential Flow

To allow AI agent to login on behalf of user:

### 1. New OAuth Proxy Endpoints
```
POST /api/oauth/supabase/login-with-credentials
  Body: { email, password }
  Returns: { accessToken, refreshToken, expiresIn }

POST /api/oauth/vercel/login-with-credentials
  Body: { apiToken }
  Returns: { accessToken, refreshToken, expiresIn }
```

### 2. New IPC Handlers
```typescript
// In src/ipc/handlers/supabase_handlers.ts
createTypedHandler(supabaseContracts.loginWithCredentials, async (event, params) => {
  const { email, password } = params;
  // Call new OAuth proxy endpoint
  // Store tokens like normal OAuth flow
});

// In src/ipc/handlers/vercel_handlers.ts
createTypedHandler(vercelContracts.loginWithCredentials, async (event, params) => {
  const { apiToken } = params;
  // Same as manual token entry but from agent
});
```

### 3. Agent Integration
- Agent can call: `ipc.supabase.loginWithCredentials({ email, password })`
- Tokens stored in same encrypted settings file
- Rest of flow unchanged (token refresh, API calls, etc.)

### 4. Permission Prompt
- Show user dialog when agent requests credential-based login
- Allow user to grant/deny permission
- Store permission decision in settings

### 5. Token Revocation
- Add mechanism to revoke agent-created tokens
- User can see which agent tokens are active
- Simple "Revoke" button in settings

---

## 📊 Differences Between Supabase & Vercel

| Feature | Supabase | Vercel |
|---------|----------|--------|
| **Multi-Org** | ✅ Yes (org detection) | ❌ No (single account) |
| **Token Storage** | Per-organization | Global |
| **Token Refresh** | ✅ Auto-implemented | ❌ Not implemented |
| **Manual Entry** | ❌ No | ✅ Yes (API token) |
| **PKCE** | ❌ No | ✅ Yes |
| **State CSRF** | ✅ Yes | ✅ Yes |

---

## 🐛 Troubleshooting

### Tokens not persisting
- Check: Is `safeStorage.isEncryptionAvailable()` returning true?
- Check: Is settings file being written to correct path?
- Check: Is encryption/decryption working?

### Token refresh failing
- Check: Is refresh token valid?
- Check: Is OAuth proxy server running?
- Check: Is OAUTH_SERVER_URL correct?

### Deep link not received
- Check: Is protocol handler registered? (src/main.ts:79-87)
- Check: Is URL parsing correct? (src/main.ts:438-445)
- Check: Are all required URL params present? (token, refreshToken, expiresIn)

### Organization token not storing
- Check: Is listSupabaseOrganizations() returning org details?
- Check: Is organizationSlug being extracted correctly?
- Check: Is organizations map being created properly?

---

## 📝 Notes for Development

1. **Testing:** Use `ipc.supabase.fakeConnectAndSetProject()` for unit tests (see line 140)
2. **Token Logging:** NEVER log full deep link URLs - they contain sensitive tokens
3. **Locking:** Use `withLock()` when refreshing shared tokens to prevent race conditions
4. **Rate Limiting:** Supabase client has built-in retry logic with exponential backoff
5. **Organization Migration:** Legacy single-account tokens can fallback to organization format

