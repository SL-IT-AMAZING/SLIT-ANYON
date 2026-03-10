import { envVarsAtom, userSettingsAtom } from "@/atoms/appAtoms";
import { ipc } from "@/ipc/types";
import { type UserSettings, hasAnyonProKey } from "@/lib/schemas";
import { useAtom } from "jotai";
import { usePostHog } from "posthog-js/react";
import { useCallback, useEffect, useState } from "react";
import { useAppVersion } from "./useAppVersion";

const TELEMETRY_CONSENT_KEY = "anyonTelemetryConsent";
const TELEMETRY_USER_ID_KEY = "anyonTelemetryUserId";

export function isTelemetryOptedIn() {
  return window.localStorage.getItem(TELEMETRY_CONSENT_KEY) === "opted_in";
}

export function getTelemetryUserId(): string | null {
  return window.localStorage.getItem(TELEMETRY_USER_ID_KEY);
}

let isInitialLoad = false;
let settingsDataVersion = 0;

type InitialSettingsData = {
  userSettings: UserSettings;
  envVars: Record<string, string | undefined>;
};

let cachedInitialSettingsData: InitialSettingsData | null = null;
let initialSettingsPromise: Promise<InitialSettingsData> | null = null;

async function loadSharedInitialSettings(
  force = false,
): Promise<InitialSettingsData> {
  if (!force) {
    if (cachedInitialSettingsData) {
      return cachedInitialSettingsData;
    }

    if (initialSettingsPromise) {
      return initialSettingsPromise;
    }
  }

  const requestBase = Promise.all([
    ipc.settings.getUserSettings(),
    ipc.misc.getEnvVars(),
  ]);

  const requestVersion = ++settingsDataVersion;
  let request!: Promise<InitialSettingsData>;
  request = requestBase.then(([userSettings, envVars]) => {
    const loaded = { userSettings, envVars };

    if (requestVersion === settingsDataVersion) {
      cachedInitialSettingsData = loaded;
      return loaded;
    }

    if (initialSettingsPromise && initialSettingsPromise !== request) {
      return initialSettingsPromise;
    }

    return cachedInitialSettingsData ?? loaded;
  });

  initialSettingsPromise = request;

  try {
    return await request;
  } finally {
    if (initialSettingsPromise === request) {
      initialSettingsPromise = null;
    }
  }
}

export function useSettings() {
  const posthog = usePostHog();
  const [settings, setSettingsAtom] = useAtom(userSettingsAtom);
  const [envVars, setEnvVarsAtom] = useAtom(envVarsAtom);
  const [loading, setLoading] = useState(cachedInitialSettingsData === null);
  const [error, setError] = useState<Error | null>(null);
  const appVersion = useAppVersion();
  const loadInitialData = useCallback(async (force = false) => {
    if (force || cachedInitialSettingsData === null) {
      setLoading(true);
    }

    try {
      const { userSettings, envVars: fetchedEnvVars } =
        await loadSharedInitialSettings(force);
      processSettingsForTelemetry(userSettings);
      const isPro = hasAnyonProKey(userSettings);
      posthog.people.set({ isPro });
      if (!isInitialLoad && appVersion) {
        posthog.capture("app:initial-load", {
          isPro,
          appVersion,
        });
        isInitialLoad = true;
      }
      setSettingsAtom(userSettings);
      setEnvVarsAtom(fetchedEnvVars);
      setError(null);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  }, [appVersion, posthog, setEnvVarsAtom, setSettingsAtom]);

  useEffect(() => {
    // Only run once on mount, dependencies are stable getters/setters
    loadInitialData();
  }, [loadInitialData]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    setLoading(true);
    try {
      const updatedSettings = await ipc.settings.setUserSettings(newSettings);
      settingsDataVersion += 1;
      setSettingsAtom(updatedSettings);
      cachedInitialSettingsData = {
        userSettings: updatedSettings,
        envVars:
          cachedInitialSettingsData?.envVars ??
          (Object.keys(envVars).length > 0 ? envVars : {}),
      };
      processSettingsForTelemetry(updatedSettings);
      posthog.people.set({ isPro: hasAnyonProKey(updatedSettings) });

      setError(null);
      return updatedSettings;
    } catch (error) {
      console.error("Error updating settings:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    settings,
    envVars,
    loading,
    error,
    updateSettings,

    refreshSettings: () => {
      return loadInitialData(true);
    },
  };
}

function processSettingsForTelemetry(settings: UserSettings) {
  if (settings.telemetryConsent) {
    window.localStorage.setItem(
      TELEMETRY_CONSENT_KEY,
      settings.telemetryConsent,
    );
  } else {
    window.localStorage.removeItem(TELEMETRY_CONSENT_KEY);
  }
  if (settings.telemetryUserId) {
    window.localStorage.setItem(
      TELEMETRY_USER_ID_KEY,
      settings.telemetryUserId,
    );
  } else {
    window.localStorage.removeItem(TELEMETRY_USER_ID_KEY);
  }
}

export function resetSettingsCacheForTests() {
  cachedInitialSettingsData = null;
  initialSettingsPromise = null;
  isInitialLoad = false;
  settingsDataVersion = 0;
}
