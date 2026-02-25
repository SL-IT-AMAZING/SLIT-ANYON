import { shellEnvSync } from "shell-env";

// Need to look up run-time env vars this way
// otherwise it doesn't work as expected in MacOs apps:
// https://github.com/sindresorhus/shell-env

let _env: Record<string, string> | null = null;

export function getEnvVar(key: string) {
  // Cache it
  if (!_env) {
    _env = shellEnvSync();
  }
  // shellEnvSync reads the user's login shell env (needed for packaged macOS apps).
  // Fall back to process.env which picks up dotenv-loaded vars in dev mode.
  return _env[key] ?? process.env[key];
}
