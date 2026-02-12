/**
 * Centralized OAuth server URL configuration.
 *
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
