import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLanguageModelProviders,
  invalidateProviderCache,
} from "../ipc/shared/language_model_helpers";
import { getOpenCodeProviders } from "../ipc/utils/opencode_api";

vi.mock("../ipc/utils/opencode_api", () => ({
  getOpenCodeProviders: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {},
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

const sampleProviders = {
  all: [
    {
      id: "anthropic",
      name: "Anthropic",
      models: {
        "claude-opus": {
          id: "claude-opus",
          name: "Claude Opus",
        },
      },
    },
  ],
  default: {
    anthropic: "claude-opus",
  },
  connected: ["anthropic"],
};

describe("language_model_helpers OpenCode provider cache", () => {
  beforeEach(() => {
    invalidateProviderCache();
    vi.clearAllMocks();
  });

  it("deduplicates concurrent provider fetches", async () => {
    let resolveFetch:
      | ((value: typeof sampleProviders) => void)
      | undefined;
    const inFlight = new Promise<typeof sampleProviders>((resolve) => {
      resolveFetch = resolve;
    });

    vi.mocked(getOpenCodeProviders).mockImplementation(() => inFlight);

    const p1 = getLanguageModelProviders();
    const p2 = getLanguageModelProviders();
    const p3 = getLanguageModelProviders();

    expect(getOpenCodeProviders).toHaveBeenCalledTimes(1);

    resolveFetch?.(sampleProviders);
    const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

    expect(r1).toHaveLength(1);
    expect(r2).toEqual(r1);
    expect(r3).toEqual(r1);
  });

  it("reuses cached providers inside cache ttl", async () => {
    vi.mocked(getOpenCodeProviders).mockResolvedValue(sampleProviders);

    await getLanguageModelProviders();
    await getLanguageModelProviders();

    expect(getOpenCodeProviders).toHaveBeenCalledTimes(1);
  });

  it("invalidates cached providers when requested", async () => {
    vi.mocked(getOpenCodeProviders).mockResolvedValue(sampleProviders);

    await getLanguageModelProviders();
    invalidateProviderCache();
    await getLanguageModelProviders();

    expect(getOpenCodeProviders).toHaveBeenCalledTimes(2);
  });
});
