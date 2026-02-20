export type OpenCodeStartupErrorCode =
  | "OPENCODE_BINARY_NOT_FOUND"
  | "OPENCODE_SPAWN_ENOENT"
  | "OPENCODE_SPAWN_EACCES"
  | "OPENCODE_CODE_SIGNATURE_INVALID"
  | "OPENCODE_PROCESS_TERMINATED";

type OpenCodePathSource = "options" | "env" | "bundled" | "dev-path";

export function createOpenCodeStartupError(
  code: OpenCodeStartupErrorCode,
  message: string,
  detail?: string,
): Error {
  const suffix = detail ? `: ${detail}` : "";
  return new Error(`[${code}] ${message}${suffix}`);
}

export function getOpenCodeStartupErrorCode(
  error: unknown,
): OpenCodeStartupErrorCode | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const match = error.message.match(/^\[(OPENCODE_[A-Z_]+)\]/);
  if (!match) {
    return null;
  }

  const code = match[1] as OpenCodeStartupErrorCode;
  return code;
}

export function isRetryableOpenCodeStartupError(error: unknown): boolean {
  const code = getOpenCodeStartupErrorCode(error);
  if (!code) {
    return true;
  }

  return ![
    "OPENCODE_BINARY_NOT_FOUND",
    "OPENCODE_SPAWN_ENOENT",
    "OPENCODE_CODE_SIGNATURE_INVALID",
  ].includes(code);
}

export function resolveOpenCodeBinaryPath(input: {
  optionsPath?: string;
  envPath?: string;
  bundledPath?: string | null;
  isPackaged: boolean;
}): { path: string; source: OpenCodePathSource } {
  const { optionsPath, envPath, bundledPath, isPackaged } = input;

  if (optionsPath) {
    return { path: optionsPath, source: "options" };
  }

  if (envPath) {
    return { path: envPath, source: "env" };
  }

  if (bundledPath) {
    return { path: bundledPath, source: "bundled" };
  }

  if (!isPackaged) {
    return { path: "opencode", source: "dev-path" };
  }

  throw createOpenCodeStartupError(
    "OPENCODE_BINARY_NOT_FOUND",
    "Bundled OpenCode binary not found in packaged app",
    "Reinstall Anyon or update to a build with vendor binaries",
  );
}
