import { createHash, randomBytes } from "node:crypto";
import {
  type IncomingMessage,
  type Server,
  type ServerResponse,
  createServer,
} from "node:http";
import type { AuthState } from "@/ipc/types/auth";
import { oauthEndpoints } from "@/lib/oauthConfig";
import type { Secret } from "@/lib/schemas";
import { createClient } from "@supabase/supabase-js";
import { shell } from "electron";
import log from "electron-log";
import { readSettings, writeSettings } from "./settings";

const logger = log.scope("auth");

type Provider = "google" | "email";

type StoredAuth = {
  accessToken?: Secret;
  refreshToken?: Secret;
  userId?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  provider?: Provider;
  codeVerifier?: string;
};

type SettingsWithAuth = {
  auth?: StoredAuth;
} & Record<string, unknown>;

type SupabaseUser = {
  id: string;
  email?: string;
  app_metadata?: {
    provider?: string;
  };
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
};

let supabaseAuth: ReturnType<typeof createClient> | null = null;

const OAUTH_LOOPBACK_HOST = "127.0.0.1";
const OAUTH_LOOPBACK_PORT = 38765;
const OAUTH_LOOPBACK_PATH = "/auth/callback";
const OAUTH_LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

type PendingGoogleLogin = {
  resolve: () => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  server: Server | null;
};

let pendingGoogleLogin: PendingGoogleLogin | null = null;

function finalizePendingGoogleLogin(error?: Error) {
  if (!pendingGoogleLogin) {
    return;
  }

  const { resolve, reject, timeout, server } = pendingGoogleLogin;
  pendingGoogleLogin = null;
  clearTimeout(timeout);

  if (server) {
    try {
      server.close();
    } catch {}
  }

  if (error) {
    reject(error);
    return;
  }

  resolve();
}

function createPendingGoogleLogin(server: Server | null): Promise<void> {
  if (pendingGoogleLogin) {
    throw new Error("Google sign-in is already in progress");
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      finalizePendingGoogleLogin(
        new Error("Google sign-in timed out. Please try again."),
      );
    }, OAUTH_LOGIN_TIMEOUT_MS);

    pendingGoogleLogin = {
      resolve,
      reject,
      timeout,
      server,
    };
  });
}

function sendLoopbackHtml(
  res: ServerResponse,
  statusCode: number,
  title: string,
  message: string,
) {
  const html = `<!DOCTYPE html>
<html>
  <head><title>${title}</title></head>
  <body>
    <p>${message}</p>
    <script>
      setTimeout(() => window.close(), 1200);
    </script>
  </body>
</html>`;

  res.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(html);
}

async function handleLoopbackCallbackRequest(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const method = req.method ?? "GET";
  if (method !== "GET") {
    sendLoopbackHtml(res, 405, "Method Not Allowed", "Invalid request method");
    return;
  }

  const requestUrl = new URL(
    req.url ?? "/",
    `http://${OAUTH_LOOPBACK_HOST}:${OAUTH_LOOPBACK_PORT}`,
  );

  if (requestUrl.pathname !== OAUTH_LOOPBACK_PATH) {
    sendLoopbackHtml(res, 404, "Not Found", "Invalid callback path");
    return;
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    sendLoopbackHtml(res, 400, "Missing Code", "Missing OAuth code");
    return;
  }

  try {
    await handleAuthCallback(code);
    sendLoopbackHtml(
      res,
      200,
      "Sign-in Complete",
      "Signed in successfully. You can return to ANYON.",
    );
  } catch (error) {
    logger.error("Loopback OAuth callback failed", error);
    const message =
      error instanceof Error ? error.message : "OAuth callback failed";
    sendLoopbackHtml(res, 400, "Sign-in Failed", message);
  }
}

async function startLoopbackCallbackServer(): Promise<Server | null> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      void handleLoopbackCallbackRequest(req, res);
    });

    let settled = false;
    const settle = (value: Server | null) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(value);
    };

    server.once("error", (error) => {
      logger.warn("Failed to start loopback OAuth callback server", error);
      settle(null);
    });

    server.listen(OAUTH_LOOPBACK_PORT, OAUTH_LOOPBACK_HOST, () => {
      settle(server);
    });
  });
}

function getSupabaseCredentials() {
  const url = process.env.ANYON_SUPABASE_URL;
  const anonKey = process.env.ANYON_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase credentials not configured. Set ANYON_SUPABASE_URL and ANYON_SUPABASE_ANON_KEY environment variables.",
    );
  }
  return { url, anonKey };
}

function getSupabaseClient() {
  if (!supabaseAuth) {
    const { url, anonKey } = getSupabaseCredentials();
    supabaseAuth = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAuth;
}

function getGoogleCallbackUrl() {
  return oauthEndpoints.auth.callback;
}

function toBase64Url(input: Buffer): string {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createCodeVerifier(): string {
  return toBase64Url(randomBytes(32));
}

function createCodeChallenge(codeVerifier: string): string {
  return toBase64Url(createHash("sha256").update(codeVerifier).digest());
}

function getStoredAuth(): {
  accessToken: string | null;
  refreshToken: string | null;
  userId?: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  provider?: Provider;
  codeVerifier?: string;
} {
  const settings = readSettings() as SettingsWithAuth;
  const auth = settings.auth;
  return {
    accessToken: auth?.accessToken?.value ?? null,
    refreshToken: auth?.refreshToken?.value ?? null,
    userId: auth?.userId,
    email: auth?.email,
    displayName: auth?.displayName,
    avatarUrl: auth?.avatarUrl,
    provider: auth?.provider,
    codeVerifier: auth?.codeVerifier,
  };
}

function mapProvider(user: SupabaseUser, fallback: Provider): Provider {
  const provider = user.app_metadata?.provider;
  if (provider === "google" || provider === "email") {
    return provider;
  }
  return fallback;
}

function mapDisplayName(user: SupabaseUser): string | undefined {
  return user.user_metadata?.full_name || user.user_metadata?.name;
}

function mapAvatarUrl(user: SupabaseUser): string | undefined {
  return user.user_metadata?.avatar_url || user.user_metadata?.picture;
}

function buildAuthenticatedState(params: {
  accessToken: string;
  userId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  provider: Provider;
}): AuthState {
  return {
    user: {
      id: params.userId,
      email: params.email,
      displayName: params.displayName,
      avatarUrl: params.avatarUrl,
      provider: params.provider,
    },
    accessToken: params.accessToken,
    isAuthenticated: true,
  };
}

function buildUnauthenticatedState(): AuthState {
  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
  };
}

function getJwtExpiryMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }
    const payload = JSON.parse(
      Buffer.from(
        parts[1].replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf8"),
    ) as { exp?: number };
    if (typeof payload.exp !== "number") {
      return null;
    }
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const expiry = getJwtExpiryMs(token);
  if (!expiry) {
    return false;
  }
  return Date.now() >= expiry - 30_000;
}

function persistAuth(params: {
  accessToken: string;
  refreshToken?: string;
  user: SupabaseUser;
  provider: Provider;
  codeVerifier?: string;
}) {
  const settings = readSettings() as SettingsWithAuth;
  const auth: StoredAuth = {
    ...settings.auth,
    accessToken: { value: params.accessToken },
    refreshToken: params.refreshToken
      ? { value: params.refreshToken }
      : settings.auth?.refreshToken,
    userId: params.user.id,
    email: params.user.email,
    displayName: mapDisplayName(params.user),
    avatarUrl: mapAvatarUrl(params.user),
    provider: mapProvider(params.user, params.provider),
    codeVerifier: params.codeVerifier,
  };
  writeSettings({ auth });
}

function persistCodeVerifier(codeVerifier: string) {
  const settings = readSettings() as SettingsWithAuth;
  writeSettings({
    auth: {
      ...settings.auth,
      codeVerifier,
    },
  });
}

function clearAuth() {
  const settings = readSettings() as SettingsWithAuth;
  writeSettings({
    auth: {
      ...settings.auth,
      accessToken: undefined,
      refreshToken: undefined,
      userId: undefined,
      email: undefined,
      displayName: undefined,
      avatarUrl: undefined,
      provider: undefined,
      codeVerifier: undefined,
    },
    entitlementCache: undefined,
  });
}

async function getUserFromToken(
  accessToken: string,
): Promise<SupabaseUser | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }
  return data.user as SupabaseUser;
}

export async function getAuthState(): Promise<AuthState> {
  const stored = getStoredAuth();

  if (!stored.accessToken || !stored.userId || !stored.provider) {
    return buildUnauthenticatedState();
  }

  if (isTokenExpired(stored.accessToken)) {
    if (!stored.refreshToken) {
      clearAuth();
      return buildUnauthenticatedState();
    }

    try {
      return await refreshSession();
    } catch (error) {
      logger.warn("Failed to refresh expired auth session", error);
      clearAuth();
      return buildUnauthenticatedState();
    }
  }

  const user = await getUserFromToken(stored.accessToken);
  if (!user) {
    if (!stored.refreshToken) {
      clearAuth();
      return buildUnauthenticatedState();
    }

    try {
      return await refreshSession();
    } catch (error) {
      logger.warn("Failed to refresh invalid auth session", error);
      clearAuth();
      return buildUnauthenticatedState();
    }
  }

  const provider = mapProvider(user, stored.provider);
  persistAuth({
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken ?? undefined,
    user,
    provider,
    codeVerifier: stored.codeVerifier,
  });

  return buildAuthenticatedState({
    accessToken: stored.accessToken,
    userId: user.id,
    email: user.email,
    displayName: mapDisplayName(user),
    avatarUrl: mapAvatarUrl(user),
    provider,
  });
}

export async function loginWithGoogle(): Promise<{ url: string }> {
  const { url: supabaseUrl } = getSupabaseCredentials();
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const callbackUrl = getGoogleCallbackUrl();
  const loopbackServer = await startLoopbackCallbackServer();
  const pendingLogin = createPendingGoogleLogin(loopbackServer);

  const authUrl = new URL(`${supabaseUrl}/auth/v1/authorize`);
  authUrl.searchParams.set("provider", "google");
  authUrl.searchParams.set("redirect_to", callbackUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("flow_type", "pkce");
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "s256");

  const url = authUrl.toString();
  persistCodeVerifier(codeVerifier);
  try {
    await shell.openExternal(url);
  } catch (error) {
    const normalizedError =
      error instanceof Error
        ? error
        : new Error("Failed to open browser for Google sign-in");
    finalizePendingGoogleLogin(normalizedError);
    throw normalizedError;
  }

  await pendingLogin;
  return { url };
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<AuthState> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Failed to sign in: ${error.message}`);
  }
  if (!data.session || !data.user) {
    throw new Error("Failed to sign in: missing session");
  }

  persistAuth({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: data.user as SupabaseUser,
    provider: "email",
  });

  return buildAuthenticatedState({
    accessToken: data.session.access_token,
    userId: data.user.id,
    email: data.user.email,
    displayName: mapDisplayName(data.user as SupabaseUser),
    avatarUrl: mapAvatarUrl(data.user as SupabaseUser),
    provider: mapProvider(data.user as SupabaseUser, "email"),
  });
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthState> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(`Failed to sign up: ${error.message}`);
  }
  if (!data.session || !data.user) {
    throw new Error(
      "Sign-up completed but no active session returned. Check email confirmation requirements.",
    );
  }

  persistAuth({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: data.user as SupabaseUser,
    provider: "email",
  });

  return buildAuthenticatedState({
    accessToken: data.session.access_token,
    userId: data.user.id,
    email: data.user.email,
    displayName: mapDisplayName(data.user as SupabaseUser),
    avatarUrl: mapAvatarUrl(data.user as SupabaseUser),
    provider: mapProvider(data.user as SupabaseUser, "email"),
  });
}

export async function logout(): Promise<{ success: boolean }> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`);
  }
  clearAuth();
  return { success: true };
}

export async function refreshSession(): Promise<AuthState> {
  const stored = getStoredAuth();
  if (!stored.refreshToken) {
    throw new Error("No refresh token available");
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: stored.refreshToken,
  });

  if (error) {
    throw new Error(`Failed to refresh session: ${error.message}`);
  }
  if (!data.session || !data.user) {
    throw new Error("Failed to refresh session: missing session data");
  }

  const provider = mapProvider(
    data.user as SupabaseUser,
    stored.provider ?? "email",
  );

  persistAuth({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: data.user as SupabaseUser,
    provider,
    codeVerifier: stored.codeVerifier,
  });

  return buildAuthenticatedState({
    accessToken: data.session.access_token,
    userId: data.user.id,
    email: data.user.email,
    displayName: mapDisplayName(data.user as SupabaseUser),
    avatarUrl: mapAvatarUrl(data.user as SupabaseUser),
    provider,
  });
}

export async function handleAuthCallback(code: string): Promise<AuthState> {
  try {
    const stored = getStoredAuth();
    if (!stored.codeVerifier) {
      throw new Error("Missing PKCE code verifier for OAuth callback");
    }

    const { url: supabaseUrl, anonKey } = getSupabaseCredentials();
    const response = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=pkce`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
        },
        body: JSON.stringify({
          auth_code: code,
          code_verifier: stored.codeVerifier,
          redirect_to: getGoogleCallbackUrl(),
        }),
      },
    );

    const payload = (await response.json()) as
      | {
          access_token?: string;
          refresh_token?: string;
          user?: SupabaseUser;
          error_description?: string;
          msg?: string;
        }
      | undefined;

    if (!response.ok || !payload?.access_token || !payload?.refresh_token) {
      const errorMessage =
        payload?.error_description || payload?.msg || "OAuth exchange failed";
      throw new Error(`Failed to exchange OAuth code: ${errorMessage}`);
    }

    let user: SupabaseUser | undefined = payload.user;
    if (!user) {
      const fetchedUser = await getUserFromToken(payload.access_token);
      if (!fetchedUser) {
        throw new Error("Failed to load user profile after OAuth callback");
      }
      user = fetchedUser;
    }

    persistAuth({
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      user,
      provider: "google",
      codeVerifier: undefined,
    });

    const authState = buildAuthenticatedState({
      accessToken: payload.access_token,
      userId: user.id,
      email: user.email,
      displayName: mapDisplayName(user),
      avatarUrl: mapAvatarUrl(user),
      provider: mapProvider(user, "google"),
    });

    finalizePendingGoogleLogin();
    return authState;
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error("OAuth callback failed");
    finalizePendingGoogleLogin(normalizedError);
    throw normalizedError;
  }
}
