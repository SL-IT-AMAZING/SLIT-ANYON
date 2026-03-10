import type { UserSettings } from "@/lib/schemas";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider as JotaiProvider } from "jotai";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetSettingsCacheForTests, useSettings } from "../hooks/useSettings";

const {
  getUserSettings,
  getEnvVars,
  setUserSettings,
  posthogCapture,
  posthogPeopleSet,
} = vi.hoisted(() => ({
  getUserSettings: vi.fn(),
  getEnvVars: vi.fn(),
  setUserSettings: vi.fn(),
  posthogCapture: vi.fn(),
  posthogPeopleSet: vi.fn(),
}));

vi.mock("@/ipc/types", () => ({
  ipc: {
    settings: {
      getUserSettings,
      setUserSettings,
    },
    misc: {
      getEnvVars,
    },
  },
}));

vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({
    capture: posthogCapture,
    people: { set: posthogPeopleSet },
  }),
}));

vi.mock("../hooks/useAppVersion", () => ({
  useAppVersion: () => "1.0.0",
}));

function createSettings(name: string): UserSettings {
  return {
    selectedModel: {
      provider: "anthropic",
      name,
    },
    providerSettings: {},
  } as UserSettings;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function wrapper({ children }: { children: ReactNode }) {
  return <JotaiProvider>{children}</JotaiProvider>;
}

describe("useSettings", () => {
  beforeEach(() => {
    resetSettingsCacheForTests();
    vi.clearAllMocks();
    getEnvVars.mockResolvedValue({ ANYON_ENV: "ok" });
  });

  afterEach(() => {
    resetSettingsCacheForTests();
  });

  it("does not let an older refresh overwrite a newer forced refresh", async () => {
    const first = deferred<UserSettings>();
    const second = deferred<UserSettings>();

    getUserSettings
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => expect(getUserSettings).toHaveBeenCalledTimes(1));

    act(() => {
      void result.current.refreshSettings();
    });

    await waitFor(() => expect(getUserSettings).toHaveBeenCalledTimes(2));

    second.resolve(createSettings("new-model"));

    await waitFor(
      () => expect(result.current.settings?.selectedModel.name).toBe("new-model"),
    );

    first.resolve(createSettings("old-model"));

    await waitFor(() =>
      expect(result.current.settings?.selectedModel.name).toBe("new-model"),
    );
  });

  it("does not let an older load overwrite a successful settings update", async () => {
    const initialLoad = deferred<UserSettings>();
    getUserSettings.mockReturnValueOnce(initialLoad.promise);
    setUserSettings.mockResolvedValue(createSettings("updated-model"));

    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => expect(getUserSettings).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.updateSettings({
        selectedModel: {
          provider: "anthropic",
          name: "updated-model",
        },
      });
    });

    expect(result.current.settings?.selectedModel.name).toBe("updated-model");

    initialLoad.resolve(createSettings("stale-model"));

    await waitFor(() =>
      expect(result.current.settings?.selectedModel.name).toBe("updated-model"),
    );
  });
});
