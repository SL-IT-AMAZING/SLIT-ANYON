/**
 * Centralized OAuth server URL configuration.
 *
 * All references to oauth.dyad.sh / supabase-oauth.dyad.sh are replaced
 * by this single module so the proxy origin can be changed in one place.
 */

const OAUTH_SERVER_URL =
  (typeof process !== "undefined" && process.env.OAUTH_SERVER_URL) ||
  "https://server-green-seven.vercel.app";

const EDGE_FUNCTIONS_URL =
  "https://hboncsycgqhsdqpocpsb.supabase.co/functions/v1";

export { OAUTH_SERVER_URL };

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
  auth: {
    callback: `${EDGE_FUNCTIONS_URL}/auth-callback`,
    entitlements: `${EDGE_FUNCTIONS_URL}/entitlements`,
    checkout: `${EDGE_FUNCTIONS_URL}/create-checkout`,
    customerPortal: `${EDGE_FUNCTIONS_URL}/customer-portal`,
    usage: `${EDGE_FUNCTIONS_URL}/get-usage`,
    usageIngest: `${EDGE_FUNCTIONS_URL}/track-usage`,
  },
} as const;
