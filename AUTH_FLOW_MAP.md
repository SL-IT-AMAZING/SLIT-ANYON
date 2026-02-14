# COMPLETE AUTHENTICATION FLOW MAP - Anyon Electron App

## EXECUTIVE SUMMARY

The Anyon app uses **OAuth 2.0 flows** for both Supabase and Vercel. Users initiate login through UI buttons, which open the OAuth proxy server (`https://server-green-seven.vercel.app`). After OAuth completion, tokens are passed back via deep links (`anyon://`) and stored encrypted in the settings file.

**Current architecture:**
- No username/password login exists
- Tokens are encrypted using Electron's `safeStorage` (OS credential store)
- Token refresh is automatic and transparent
- OAuth proxy server handles the sensitive OAuth exchanges

---

## 1. OAUTH FLOW ENTRY POINTS (UI Components)

### 1.1 Supabase Entry Points

#### File: `src/components/SupabaseConnector.tsx`

**Lines 138-147: Add Account Button Handler**
```typescript
const handleAddAccount = async () => {
  if (settings?.isTestMode) {
    await ipc.supabase.fakeConnectAndSetProject({
      appId,
      fakeProjectId: "fake-project-id",
    });
  } else {
    // ACTUAL OAUTH ENTRY POINT
    await ipc.system.openExternalUrl(oauthEndpoints.supabase.login);
  }
};
```

**Where it's triggered:**
- **Line 295-300**: "Add Organization" button in project selector
- **Line 416-421**: "Connect to Supabase" image button when no accounts connected

**OAuth Endpoint URL:**
```
https://server-green-seven.vercel.app/api/oauth/supabase/login
```

---

### 1.2 Vercel Entry Points

#### File: `src/components/VercelConnector.tsx`

**Lines 399-408: OAuth Login Button**
```typescript
<Button
  onClick={async () => {
    await ipc.system.openExternalUrl(oauthEndpoints.vercel.login);
  }}
  variant="outline"
  className="w-full h-10"
  data-testid="connect-vercel-button"
>
  Connect to Vercel with OAuth
</Button>
```

**Alternative: Manual Token Entry (Lines 301-321)**
```typescript
const handleSaveAccessToken = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!accessToken.trim()) return;
  setIsSavingToken(true);
  setTokenError(null);
  setTokenSuccess(false);
  try {
    // Calls IPC handler to save token
    await ipc.vercel.saveToken({
      token: accessToken.trim(),
    });
    setTokenSuccess(true);
    setAccessToken("");
    refreshSettings();
  } catch (err: any) {
    setTokenError(err.message || "Failed to save access token.");
  } finally {
    setIsSavingToken(false);
  }
};
```

**OAuth Endpoint URL:**
```
https://server-green-seven.vercel.app/api/oauth/vercel/login
```

---

## 2. OAUTH CALLBACK HANDLERS (Deep Link Processing)

### 2.1 Deep Link Receiving Flow

#### Primary Handler: `src/main.ts` (Lines 438-588)

```typescript
async function handleDeepLinkReturn(url: string) {
  // URL format: "anyon://supabase-oauth-return?token=...&refreshToken=...&expiresIn=..."
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    log.info("Invalid deep link URL", url);
    return;
  }
  
  // Route to appropriate handler based on hostname
  if (parsed.hostname === "supabase-oauth-return") {
    const token = parsed.searchParams.get("token");
    const refreshToken = parsed.searchParams.get("refreshToken");
    const expiresIn = Number(parsed.searchParams.get("expiresIn"));
    // ... validation ...
    await handleSupabaseOAuthReturn({ token, refreshToken, expiresIn });
    mainWindow?.webContents.send("deep-link-received", {
      type: parsed.hostname,
    });
    return;
  }
  
  if (parsed.hostname === "vercel-oauth-return") {
    const token = parsed.searchParams.get("token");
    const refreshToken = parsed.searchParams.get("refreshToken");
    const expiresIn = Number(parsed.searchParams.get("expiresIn"));
    // ... validation ...
    handleVercelOAuthReturn({ token, refreshToken, expiresIn });
    mainWindow?.webContents.send("deep-link-received", {
      type: parsed.hostname,
    });
    return;
  }
}
```

**Deep Link Registration (Lines 79-87):**
```typescript
// Register anyon:// protocol handler
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("anyon", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("anyon");
}
```

**Deep Link Entry Points (Lines 421-436):**
1. **Second Instance (Line 428):** When user clicks OAuth redirect with app already running
2. **open-url Event (Lines 434-436):** Direct protocol handler for all `anyon://` URLs

---

### 2.2 Supabase OAuth Return Handler

#### File: `src/supabase_admin/supabase_return_handler.ts`

```typescript
export async function handleSupabaseOAuthReturn({
  token,
  refreshToken,
  expiresIn,
}: SupabaseOAuthReturnParams) {
  const settings = readSettings();
  let orgs: any[] = [];
  let errorOccurred = false;

  try {
    // Fetch organization details to determine which org the token belongs to
    orgs = await listSupabaseOrganizations(token);
  } catch (error) {
    logger.error("Error listing Supabase organizations:", error);
    errorOccurred = true;
  }

  if (!errorOccurred && orgs.length > 0) {
    if (orgs.length > 1) {
      logger.warn("Multiple organizations found unexpectedly, using first");
    }
    const organizationSlug = orgs[0].slug;
    const existingOrgs = settings.supabase?.organizations ?? {};

    // Store credentials in organization-specific map
    writeSettings({
      supabase: {
        ...settings.supabase,
        organizations: {
          ...existingOrgs,
          [organizationSlug]: {
            accessToken: { value: token },           // ENCRYPTED on write
            refreshToken: { value: refreshToken },   // ENCRYPTED on write
            expiresIn,
            tokenTimestamp: Math.floor(Date.now() / 1000),
          },
        },
      },
    });
  } else {
    // Fallback to legacy single-account fields
    writeSettings({
      supabase: {
        ...settings.supabase,
        accessToken: { value: token },              // ENCRYPTED on write
        refreshToken: { value: refreshToken },      // ENCRYPTED on write
        expiresIn,
        tokenTimestamp: Math.floor(Date.now() / 1000),
      },
    });
  }
}
```

**Key Points:**
- Automatically detects organization(s) user belongs to
- Stores credentials per-organization in `settings.supabase.organizations[organizationSlug]`
- Falls back to legacy format if organization detection fails
- Encryption happens during `writeSettings()` call

---

### 2.3 Vercel OAuth Return Handler

#### File: `src/vercel_admin/vercel_return_handler.ts`

```typescript
export function handleVercelOAuthReturn({
  token,
  refreshToken,
  expiresIn,
}: {
  token: string;
  refreshToken: string;
  expiresIn: number;
}) {
  writeSettings({
    vercel: {
      accessToken: { value: token },        // ENCRYPTED on write
      refreshToken: { value: refreshToken }, // ENCRYPTED on write
      expiresIn,
      tokenTimestamp: Math.floor(Date.now() / 1000),
    },
  });
}
```

**Note:** Simpler than Supabase - no org detection, just stores globally

---

### 2.4 React Component Deep Link Listener

#### File: `src/contexts/DeepLinkContext.tsx`

```typescript
export function DeepLinkProvider({ children }: { children: React.ReactNode }) {
  const [lastDeepLink, setLastDeepLink] = useState<
    (DeepLinkData & { timestamp: number }) | null
  >(null);

  useEffect(() => {
    const unsubscribe = ipc.events.misc.onDeepLinkReceived((data) => {
      // Update with timestamp to ensure re-render even if same type twice
      setLastDeepLink({ ...data, timestamp: Date.now() });
      
      // Route to appropriate page if needed
      if (data.type === "add-mcp-server") {
        scrollAndNavigateTo(SECTION_IDS.toolsMcp);
      } else if (data.type === "add-prompt") {
        navigate({ to: "/library" });
      }
    });

    return unsubscribe;
  }, [navigate, scrollAndNavigateTo]);

  return (
    <DeepLinkContext.Provider value={{ lastDeepLink, clearLastDeepLink }}>
      {children}
    </DeepLinkContext.Provider>
  );
}
```

**Component Usage in Connectors:**

- **SupabaseConnector (Lines 81-92):**
  ```typescript
  useEffect(() => {
    const handleDeepLink = async () => {
      if (lastDeepLink?.type === "supabase-oauth-return") {
        await refreshSettings();
        await refetchOrganizations();
        await refetchProjects();
        await refreshApp();
        clearLastDeepLink();
      }
    };
    handleDeepLink();
  }, [lastDeepLink?.timestamp]);
  ```

- **VercelConnector (Lines 262-271):**
  ```typescript
  useEffect(() => {
    const handleDeepLink = async () => {
      if (lastDeepLink?.type === "vercel-oauth-return") {
        await refreshSettings();
        toast.success("Successfully connected to Vercel!");
        clearLastDeepLink();
      }
    };
    handleDeepLink();
  }, [lastDeepLink?.timestamp]);
  ```

---

## 3. TOKEN STORAGE MECHANISM

### 3.1 Storage Location and Format

**File:** `~/.config/anyon/user-settings.json` (or platform equivalent)

**Settings File Structure:**
```json
{
  "supabase": {
    "organizations": {
      "org-slug-123": {
        "accessToken": {
          "value": "encrypted_base64_string_or_plaintext",
          "encryptionType": "electron-safe-storage" | "plaintext"
        },
        "refreshToken": {
          "value": "encrypted_base64_string_or_plaintext",
          "encryptionType": "electron-safe-storage" | "plaintext"
        },
        "expiresIn": 3600,
        "tokenTimestamp": 1708123456
      }
    },
    "accessToken": {
      // Legacy single-account format (fallback)
      "value": "...",
      "encryptionType": "electron-safe-storage"
    },
    "refreshToken": { ... },
    "expiresIn": 3600,
    "tokenTimestamp": 1708123456
  },
  "vercel": {
    "accessToken": {
      "value": "...",
      "encryptionType": "electron-safe-storage"
    },
    "refreshToken": { ... },
    "expiresIn": 3600,
    "tokenTimestamp": 1708123456
  },
  "vercelAccessToken": {
    // Alternative storage location for manual token entry
    "value": "...",
    "encryptionType": "electron-safe-storage"
  }
}
```

---

### 3.2 Encryption/Decryption Implementation

#### File: `src/main/settings.ts`

**Encryption Function (Lines 293-304):**
```typescript
export function encrypt(data: string): Secret {
  if (safeStorage.isEncryptionAvailable() && !IS_TEST_BUILD) {
    return {
      value: safeStorage.encryptString(data).toString("base64"),
      encryptionType: "electron-safe-storage",
    };
  }
  return {
    value: data,
    encryptionType: "plaintext",
  };
}
```

**Decryption Function (Lines 306-311):**
```typescript
export function decrypt(data: Secret): string {
  if (data.encryptionType === "electron-safe-storage") {
    return safeStorage.decryptString(Buffer.from(data.value, "base64"));
  }
  return data.value;
}
```

**Key Features:**
- Uses Electron's `safeStorage` API (OS credential store - macOS Keychain, Windows DPAPI, Linux Secret Service)
- Falls back to plaintext in test builds (`IS_TEST_BUILD`)
- Tokens encrypted on **write** (in `writeSettings()`)
- Tokens decrypted on **read** (in `readSettings()`)

**Write Flow (Lines 210-291):**
```typescript
export function writeSettings(settings: Partial<UserSettings>): void {
  const filePath = getSettingsFilePath();
  const currentSettings = readSettings();
  const newSettings = { ...currentSettings, ...settings };
  
  // Encrypt all tokens before writing
  if (newSettings.vercelAccessToken) {
    newSettings.vercelAccessToken = encrypt(
      newSettings.vercelAccessToken.value,
    );
  }
  if (newSettings.supabase) {
    if (newSettings.supabase.accessToken) {
      newSettings.supabase.accessToken = encrypt(
        newSettings.supabase.accessToken.value,
      );
    }
    if (newSettings.supabase.refreshToken) {
      newSettings.supabase.refreshToken = encrypt(
        newSettings.supabase.refreshToken.value,
      );
    }
    if (newSettings.supabase.organizations) {
      for (const orgId in newSettings.supabase.organizations) {
        const org = newSettings.supabase.organizations[orgId];
        if (org.accessToken) {
          org.accessToken = encrypt(org.accessToken.value);
        }
        if (org.refreshToken) {
          org.refreshToken = encrypt(org.refreshToken.value);
        }
      }
    }
  }
  // Similar for vercel, neon, etc.
  
  fs.writeFileSync(filePath, JSON.stringify(validatedSettings, null, 2));
}
```

**Read Flow (Lines 53-207):**
- When settings are loaded, encrypted tokens are automatically decrypted
- Decryption happens per-field before validation
- Example (Supabase organization decryption, Lines 95-117):
  ```typescript
  if (supabase.organizations) {
    for (const orgId in supabase.organizations) {
      const org = supabase.organizations[orgId];
      if (org.accessToken) {
        const encryptionType = org.accessToken.encryptionType;
        if (encryptionType) {
          org.accessToken = {
            value: decrypt(org.accessToken),
            encryptionType,
          };
        }
      }
      if (org.refreshToken) {
        const encryptionType = org.refreshToken.encryptionType;
        if (encryptionType) {
          org.refreshToken = {
            value: decrypt(org.refreshToken),
            encryptionType,
          };
        }
      }
    }
  }
  ```

---

## 4. TOKEN REFRESH LOGIC

### 4.1 Supabase Token Refresh

#### File: `src/supabase_admin/supabase_management_client.ts`

**Expiration Check (Lines 93-103):**
```typescript
function isTokenExpired(expiresIn?: number): boolean {
  if (!expiresIn) return true;

  const settings = readSettings();
  const tokenTimestamp = settings.supabase?.tokenTimestamp || 0;
  const currentTime = Math.floor(Date.now() / 1000);
  
  // Refresh if expired or within 5 minutes of expiration
  return currentTime >= tokenTimestamp + expiresIn - 300;
}
```

**Refresh Function (Lines 109-162):**
```typescript
export async function refreshSupabaseToken(): Promise<void> {
  const settings = readSettings();
  const refreshToken = settings.supabase?.refreshToken?.value;

  if (!isTokenExpired(settings.supabase?.expiresIn)) {
    return; // Token still valid, no refresh needed
  }

  if (!refreshToken) {
    throw new Error(
      "Supabase refresh token not found. Please authenticate first.",
    );
  }

  try {
    // POST to OAuth proxy server refresh endpoint
    const response = await fetch(oauthEndpoints.supabase.refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Supabase token refresh failed.`);
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    } = await response.json();

    // Update settings with new tokens
    writeSettings({
      supabase: {
        accessToken: { value: accessToken },
        refreshToken: { value: newRefreshToken },
        expiresIn,
        tokenTimestamp: Math.floor(Date.now() / 1000),
      },
    });
  } catch (error) {
    logger.error("Error refreshing Supabase token:", error);
    throw error;
  }
}
```

**Organization-Specific Refresh (Lines 227-249):**
```typescript
async function refreshSupabaseTokenForOrganization(
  organizationSlug: string,
): Promise<void> {
  const settings = readSettings();
  const org = settings.supabase?.organizations?.[organizationSlug];

  if (!org) {
    throw new Error(`Supabase organization ${organizationSlug} not found.`);
  }

  if (!isOrganizationTokenExpired(org)) {
    return; // Token still valid
  }

  const refreshToken = org.refreshToken?.value;
  if (!refreshToken) {
    throw new Error("Supabase refresh token not found.");
  }

  try {
    const response = await fetch(oauthEndpoints.supabase.refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed.`);
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    } = await response.json();

    // Update organization-specific credentials
    const organizations = { ...settings.supabase?.organizations };
    organizations[organizationSlug] = {
      ...org,
      accessToken: { value: accessToken },
      refreshToken: { value: newRefreshToken },
      expiresIn,
      tokenTimestamp: Math.floor(Date.now() / 1000),
    };

    writeSettings({
      supabase: {
        ...settings.supabase,
        organizations,
      },
    });
  } catch (error) {
    logger.error("Error refreshing Supabase org token:", error);
    throw error;
  }
}
```

**Automatic Refresh in Client Creation (Lines 165-205):**
```typescript
export async function getSupabaseClient({
  organizationSlug,
}: { organizationSlug?: string | null } = {}): Promise<SupabaseManagementAPI> {
  if (organizationSlug) {
    return getSupabaseClientForOrganization(organizationSlug);
  }

  const settings = readSettings();
  const supabaseAccessToken = settings.supabase?.accessToken?.value;
  const expiresIn = settings.supabase?.expiresIn;

  if (!supabaseAccessToken) {
    throw new Error("Supabase access token not found.");
  }

  // Auto-refresh if expired
  if (isTokenExpired(expiresIn)) {
    await withLock("refresh-supabase-token", refreshSupabaseToken);
    const updatedSettings = readSettings();
    const newAccessToken = updatedSettings.supabase?.accessToken?.value;

    if (!newAccessToken) {
      throw new Error("Failed to refresh Supabase access token");
    }

    return new SupabaseManagementAPI({
      accessToken: newAccessToken,
    });
  }

  return new SupabaseManagementAPI({
    accessToken: supabaseAccessToken,
  });
}
```

---

### 4.2 Vercel Token Refresh

**OAuth Proxy Endpoint:** `POST https://server-green-seven.vercel.app/api/oauth/vercel/refresh`

**Handler (Server): `server/app/api/oauth/vercel/refresh/route.ts`**
```typescript
// Similar pattern to Supabase - accepts refreshToken, returns new access token
```

**Note:** Vercel refresh is NOT currently called automatically from the electron app (no implementation found in handlers or management client). Manual token entry is used instead in VercelConnector.

---

## 5. HOW TOKENS ARE USED IN API CALLS

### 5.1 Supabase API Calls

#### File: `src/supabase_admin/supabase_management_client.ts` (Lines 165-205)

**Pattern:**
1. Call `getSupabaseClient()` or `getSupabaseClientForOrganization()`
2. These automatically refresh token if expired
3. SDK uses token in all subsequent API calls

**Usage Example:**
```typescript
const client = await getSupabaseClient({ organizationSlug });
const projects = await client.getProjects();
```

**Under the hood:**
```typescript
return new SupabaseManagementAPI({
  accessToken: accessToken, // Token passed to SDK
});
// SDK includes in all requests:
// Authorization: Bearer <accessToken>
```

---

### 5.2 Vercel API Calls

#### File: `src/ipc/handlers/vercel_handlers.ts`

**Manual Token Passing Pattern (Lines 38-43):**
```typescript
function createVercelClient(token: string): Vercel {
  return new Vercel({
    bearerToken: token,
    ...(IS_TEST_BUILD && { serverURL: VERCEL_API_BASE }),
  });
}
```

**In Handler Functions:**
```typescript
async function handleListVercelProjects(): Promise<VercelProject[]> {
  try {
    const settings = readSettings();
    const accessToken = settings.vercelAccessToken?.value;
    if (!accessToken) {
      throw new Error("Not authenticated with Vercel.");
    }

    const response = await getVercelProjects(accessToken);
    // ... process response
  } catch (err: any) {
    logger.error("[Vercel Handler] Failed to list projects:", err);
    throw new Error(err.message || "Failed to list Vercel projects.");
  }
}
```

**Direct HTTP Requests (Lines 64-91):**
```typescript
async function getVercelProjects(
  token: string,
  options?: { search?: string },
): Promise<GetVercelProjectsResponse> {
  const url = new URL(`${VERCEL_API_BASE}/v9/projects`);
  if (options?.search) {
    url.searchParams.set("search", options.search);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch Vercel projects: ${errorText}`);
  }

  return response.json();
}
```

---

## 6. EXISTING USERNAME/PASSWORD LOGIN CODE

**Status: NONE FOUND**

- No username/password authentication exists
- No email/password login UI components
- No password storage or hashing logic
- Only OAuth and manual token entry (Vercel manual token form)

**References to "password" field in codebase (non-auth):**
- `src/components/NeonConnector.tsx`: Input field for manual API key (type="password")
- `src/components/VercelConnector.tsx`: Input field for manual access token (type="password")
- `src/components/OpenCodeConnectionModeSelector.tsx`: Database password field
- `src/__tests__/app_env_vars_utils.test.ts`: Database connection string examples
- `src/ipc/utils/git_utils.ts`: Git credential helper (x-oauth-basic)

**Conclusion:** The app is designed as a pure OAuth integration service. No password-based auth is implemented.

---

## 7. OAUTH PROXY SERVER CONFIGURATION

### 7.1 Server URL Configuration

#### File: `src/lib/oauthConfig.ts`

```typescript
/**
 * Centralized OAuth server URL configuration.
 * All references to oauth.anyon.sh / supabase-oauth.anyon.sh are replaced
 * by this single module so the proxy origin can be changed in one place.
 */

const OAUTH_SERVER_URL =
  (typeof process !== "undefined" && process.env.OAUTH_SERVER_URL) ||
  "https://server-green-seven.vercel.app";

export const oauthEndpoints = {
  neon: {
    login: `${OAUTH_SERVER_URL}/api/oauth/neon/login`,
    refresh: `${OAUTH_SERVER_URL}/api/oauth/neon/refresh`,
  },
  supabase: {
    login: `${OAUTH_SERVER_URL}/api/oauth/supabase/login`,
    refresh: `${OAUTH_SERVER_URL}/api/oauth/supabase/refresh`,
  },
  vercel: {
    login: `${OAUTH_SERVER_URL}/api/oauth/vercel/login`,
    refresh: `${OAUTH_SERVER_URL}/api/oauth/vercel/refresh`,
  },
} as const;
```

---

### 7.2 OAuth Server Structure

**Location:** `server/` directory (Next.js 15 app)

**Deployed at:** https://server-green-seven.vercel.app (production)

#### Supabase OAuth Flow

**1. Login Endpoint: `server/app/api/oauth/supabase/login/route.ts`**
```typescript
export async function GET() {
  const state = generateState();

  const authUrl = new URL("https://api.supabase.com/v1/oauth/authorize");
  authUrl.searchParams.set("client_id", process.env.SUPABASE_CLIENT_ID!);
  authUrl.searchParams.set(
    "redirect_uri",
    `${process.env.OAUTH_SERVER_URL}/api/oauth/supabase/callback`,
  );
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());
  // Store state in httpOnly cookie for CSRF protection
  response.cookies.set("supabase_oauth_state", state, {
    httpOnly: true,
    maxAge: 600, // 10 minutes
    sameSite: "lax",
    path: "/api/oauth/supabase/callback",
  });

  return response;
}
```

**Flow:**
1. Generates random state for CSRF protection
2. Redirects user to Supabase OAuth authorization URL
3. Stores state in httpOnly cookie

**2. Callback Endpoint: `server/app/api/oauth/supabase/callback/route.ts`**
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("supabase_oauth_state")?.value;

  // Validate CSRF token
  if (state !== storedState) {
    return new NextResponse("Invalid state parameter", { status: 400 });
  }

  try {
    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(
      "https://api.supabase.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        client_id: process.env.SUPABASE_CLIENT_ID!,
        client_secret: process.env.SUPABASE_CLIENT_SECRET!,
        redirect_uri: `${process.env.OAUTH_SERVER_URL}/api/oauth/supabase/callback`,
      },
    );

    // Redirect back to Electron app with tokens in deep link
    const deepLinkUrl = new URL("anyon://supabase-oauth-return");
    deepLinkUrl.searchParams.set("token", tokenData.access_token);
    deepLinkUrl.searchParams.set("refreshToken", tokenData.refresh_token);
    deepLinkUrl.searchParams.set("expiresIn", String(tokenData.expires_in));

    const response = NextResponse.redirect(deepLinkUrl.toString());
    response.cookies.delete("supabase_oauth_state");
    return response;
  } catch {
    return new NextResponse("Token exchange failed", { status: 500 });
  }
}
```

**Flow:**
1. Receives authorization code from Supabase
2. Validates CSRF token (state)
3. Exchanges code for access/refresh tokens
4. Redirects to `anyon://supabase-oauth-return?token=...` deep link

**3. Refresh Endpoint: `server/app/api/oauth/supabase/refresh/route.ts`**
```typescript
export async function POST(request: NextRequest) {
  const { refreshToken } = await request.json();

  if (!refreshToken) {
    return NextResponse.json(
      { error: "Missing refreshToken" },
      { status: 400 },
    );
  }

  try {
    const tokenData = await refreshAccessToken(
      "https://api.supabase.com/v1/oauth/token",
      {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.SUPABASE_CLIENT_ID!,
        client_secret: process.env.SUPABASE_CLIENT_SECRET!,
      },
    );

    return NextResponse.json({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });
  } catch {
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 },
    );
  }
}
```

---

#### Vercel OAuth Flow (with PKCE)

**1. Login Endpoint: `server/app/api/oauth/vercel/login/route.ts`**
```typescript
export async function GET() {
  const state = generateState();
  const { codeVerifier, codeChallenge } = generatePKCE();

  const authUrl = new URL("https://vercel.com/oauth/authorize");
  authUrl.searchParams.set("client_id", process.env.VERCEL_CLIENT_ID!);
  authUrl.searchParams.set(
    "redirect_uri",
    `${process.env.OAUTH_SERVER_URL}/api/oauth/vercel/callback`,
  );
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authUrl.toString());
  
  // Store state and code verifier in httpOnly cookies
  response.cookies.set("vercel_oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    path: "/api/oauth/vercel/callback",
  });
  response.cookies.set("vercel_code_verifier", codeVerifier, {
    httpOnly: true,
    maxAge: 600,
    sameSite: "lax",
    path: "/api/oauth/vercel/callback",
  });

  return response;
}
```

**PKCE Details:**
- `codeVerifier`: Random 32-byte value (base64url encoded)
- `codeChallenge`: SHA256 hash of verifier
- Prevents authorization code interception attacks

**2. Callback Endpoint: `server/app/api/oauth/vercel/callback/route.ts`**
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const storedState = request.cookies.get("vercel_oauth_state")?.value;
  const codeVerifier = request.cookies.get("vercel_code_verifier")?.value;

  // Validate CSRF token
  if (state !== storedState) {
    return new NextResponse("Invalid state parameter", { status: 400 });
  }

  // Validate PKCE
  if (!codeVerifier) {
    return new NextResponse("Missing PKCE code verifier", { status: 400 });
  }

  try {
    // Exchange code for tokens (using code_verifier for PKCE validation)
    const tokenData = await exchangeCodeForToken(
      "https://api.vercel.com/login/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        client_id: process.env.VERCEL_CLIENT_ID!,
        client_secret: process.env.VERCEL_CLIENT_SECRET!,
        redirect_uri: `${process.env.OAUTH_SERVER_URL}/api/oauth/vercel/callback`,
        code_verifier: codeVerifier, // PKCE validation
      },
    );

    // Redirect back to Electron app with tokens in deep link
    const deepLinkUrl = new URL("anyon://vercel-oauth-return");
    deepLinkUrl.searchParams.set("token", tokenData.access_token);
    deepLinkUrl.searchParams.set("refreshToken", tokenData.refresh_token);
    deepLinkUrl.searchParams.set("expiresIn", String(tokenData.expires_in));

    const response = NextResponse.redirect(deepLinkUrl.toString());
    response.cookies.delete("vercel_oauth_state");
    response.cookies.delete("vercel_code_verifier");
    return response;
  } catch {
    return new NextResponse("Token exchange failed", { status: 500 });
  }
}
```

---

### 7.3 OAuth Server Environment Variables

**Required for deployment:**

```bash
OAUTH_SERVER_URL=https://server-green-seven.vercel.app

# Supabase
SUPABASE_CLIENT_ID=<from Supabase OAuth app>
SUPABASE_CLIENT_SECRET=<from Supabase OAuth app>

# Vercel
VERCEL_CLIENT_ID=<from Vercel OAuth app>
VERCEL_CLIENT_SECRET=<from Vercel OAuth app>

# Neon (optional)
NEON_CLIENT_ID=<from Neon OAuth app (Partner Program)>
NEON_CLIENT_SECRET=<from Neon OAuth app>
```

**Set in Vercel dashboard:** Settings → Environment Variables

---

## 8. SECURITY ANALYSIS & IMPLICATIONS FOR CREDENTIAL-BASED FLOW

### Current Security Measures
1. **Token Encryption:** OS-level encryption (Keychain/DPAPI/Secret Service)
2. **CSRF Protection:** State parameter validated on callback
3. **PKCE Protection:** Vercel uses PKCE for additional security
4. **httpOnly Cookies:** State/PKCE stored in secure cookies, not accessible to scripts
5. **No Token Logging:** Deep link tokens intentionally not logged
6. **Rate Limiting:** Supabase management client has retry logic with rate limit handling

### Changes for AI Agent Credential Flow

**For the agent to login on behalf of the user:**

1. **Input Mechanism:** Instead of OAuth redirect, accept username/password (or API key)
   - Supabase: Email + password for user account
   - Vercel: API token entry (already implemented as manual fallback)

2. **Token Storage:** Same encryption mechanism can be reused
   - Credentials stored in same `user-settings.json`
   - Encrypted via `safeStorage` before writing

3. **OAuth Proxy Modification:** Add new endpoints for credential-based exchange
   - `POST /api/oauth/supabase/login-with-credentials` 
   - `POST /api/oauth/vercel/login-with-credentials`
   - Return same token format

4. **Agent Integration:** New IPC handlers for agent-initiated login
   - `ipc.supabase.loginWithCredentials({ email, password })`
   - `ipc.vercel.loginWithToken({ token })`

5. **Permission Model:** 
   - User explicitly grants agent permission to manage credentials
   - Consider storing agent-specific scoped tokens with limited permissions
   - Implement token revocation mechanism

---

## SUMMARY TABLE

| Component | Location | Type | Details |
|-----------|----------|------|---------|
| **Supabase Entry Point** | `src/components/SupabaseConnector.tsx:145` | UI Button | Opens OAuth proxy login endpoint |
| **Vercel Entry Point** | `src/components/VercelConnector.tsx:400` | UI Button | Opens OAuth proxy login endpoint |
| **Vercel Manual Token** | `src/components/VercelConnector.tsx:301` | UI Form | Direct token entry via IPC |
| **Deep Link Handler** | `src/main.ts:438` | Main Process | Routes OAuth return URLs to handlers |
| **Deep Link Context** | `src/contexts/DeepLinkContext.tsx:27` | React Context | Notifies components of auth completion |
| **Supabase OAuth Return** | `src/supabase_admin/supabase_return_handler.ts:18` | Handler | Stores org-specific tokens |
| **Vercel OAuth Return** | `src/vercel_admin/vercel_return_handler.ts:3` | Handler | Stores global Vercel token |
| **Token Encryption** | `src/main/settings.ts:293` | Function | Uses Electron safeStorage + Base64 |
| **Token Decryption** | `src/main/settings.ts:306` | Function | Reverses encryption on read |
| **Supabase Refresh** | `src/supabase_admin/supabase_management_client.ts:109` | Function | Auto-refreshes expired tokens |
| **Supabase Client** | `src/supabase_admin/supabase_management_client.ts:165` | Factory | Creates authenticated API client |
| **Vercel Client** | `src/ipc/handlers/vercel_handlers.ts:38` | Factory | Creates authenticated API client |
| **Vercel IPC Handlers** | `src/ipc/handlers/vercel_handlers.ts:194+` | Handlers | Async operations (list, create, connect projects) |
| **OAuth Proxy - Supabase Login** | `server/app/api/oauth/supabase/login/route.ts` | Endpoint | Generates state, redirects to Supabase |
| **OAuth Proxy - Supabase Callback** | `server/app/api/oauth/supabase/callback/route.ts` | Endpoint | Exchanges code for tokens, deep links back |
| **OAuth Proxy - Supabase Refresh** | `server/app/api/oauth/supabase/refresh/route.ts` | Endpoint | Refreshes access token via POST |
| **OAuth Proxy - Vercel Login** | `server/app/api/oauth/vercel/login/route.ts` | Endpoint | Generates PKCE, redirects to Vercel |
| **OAuth Proxy - Vercel Callback** | `server/app/api/oauth/vercel/callback/route.ts` | Endpoint | PKCE validation, exchanges code, deep links back |
| **OAuth Config** | `src/lib/oauthConfig.ts` | Config | Centralized proxy server URL |

---

