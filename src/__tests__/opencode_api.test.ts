import { beforeEach, describe, expect, it, vi } from "vitest";

const { ensureRunning, getAnyonAppPath } = vi.hoisted(() => ({
  ensureRunning: vi.fn(),
  getAnyonAppPath: vi.fn((appPath: string) =>
    appPath.startsWith("/") ? appPath : `/resolved/${appPath}`,
  ),
}));

vi.mock("../ipc/utils/opencode_server", () => ({
  openCodeServer: {
    ensureRunning,
  },
}));

vi.mock("../paths/paths", () => ({
  getAnyonAppPath,
}));

vi.mock("electron-log", () => ({
  default: {
    scope: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

import {
  getOpenCodeAgents,
  getOpenCodeProviders,
} from "../ipc/utils/opencode_api";

function jsonResponse<T>(payload: T): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe("opencode_api cwd normalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    ensureRunning.mockResolvedValue({
      url: "http://127.0.0.1:51962",
      password: "secret",
    });
  });

  it("normalizes relative app paths for agent requests", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]));

    await getOpenCodeAgents("wild-badger-yawn");

    expect(getAnyonAppPath).toHaveBeenCalledWith("wild-badger-yawn");
    expect(ensureRunning).toHaveBeenCalledWith({
      cwd: "/resolved/wild-badger-yawn",
    });
  });

  it("preserves absolute app paths for provider requests", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ all: [], default: {}, connected: [] }),
    );

    await getOpenCodeProviders("/Users/cosmos/anyon-apps/wild-badger-yawn");

    expect(getAnyonAppPath).toHaveBeenCalledWith(
      "/Users/cosmos/anyon-apps/wild-badger-yawn",
    );
    expect(ensureRunning).toHaveBeenCalledWith({
      cwd: "/Users/cosmos/anyon-apps/wild-badger-yawn",
    });
  });

  it("omits cwd when no app path is provided", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]));

    await getOpenCodeAgents();

    expect(getAnyonAppPath).not.toHaveBeenCalled();
    expect(ensureRunning).toHaveBeenCalledWith({});
  });
});
