const PUBLIC_ENV_PREFIXES = [
  "NEXT_PUBLIC_",
  "VITE_",
  "ANYON_",
  "PUBLIC_",
  "REACT_APP_",
  "NUXT_PUBLIC_",
  "GATSBY_",
  "EXPO_PUBLIC_",
] as const;

const BASE_SUPABASE_URL_KEY = "SUPABASE_URL";
const BASE_SUPABASE_KEY_ALIASES = [
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_KEY",
] as const;

export const SUPABASE_URL_ENV_KEYS = [
  BASE_SUPABASE_URL_KEY,
  ...PUBLIC_ENV_PREFIXES.map((prefix) => `${prefix}${BASE_SUPABASE_URL_KEY}`),
] as const;

export const SUPABASE_KEY_ENV_KEYS = [
  ...BASE_SUPABASE_KEY_ALIASES,
  ...PUBLIC_ENV_PREFIXES.flatMap((prefix) =>
    BASE_SUPABASE_KEY_ALIASES.map((alias) => `${prefix}${alias}`),
  ),
] as const;

export interface SupabaseEnvEntry {
  key: string;
  value: string;
}

export function buildSupabaseEnvEntries({
  supabaseUrl,
  supabaseAnonKey,
}: {
  supabaseUrl: string;
  supabaseAnonKey: string;
}): SupabaseEnvEntry[] {
  const entries: SupabaseEnvEntry[] = [
    ...SUPABASE_URL_ENV_KEYS.map((key) => ({ key, value: supabaseUrl })),
    ...SUPABASE_KEY_ENV_KEYS.map((key) => ({ key, value: supabaseAnonKey })),
  ];

  const seen = new Set<string>();
  return entries.filter(({ key }) => {
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
