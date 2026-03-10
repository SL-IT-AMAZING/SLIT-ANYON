import { ipc } from "@/ipc/types";

const PREWARM_TTL_MS = 30_000;

const inflightPrewarms = new Map<string, Promise<void>>();
const lastSuccessfulPrewarm = new Map<string, number>();

export function prewarmOpenCodeForAppPath(appPath?: string) {
  if (!appPath) {
    return;
  }

  const last = lastSuccessfulPrewarm.get(appPath);
  if (last && Date.now() - last < PREWARM_TTL_MS) {
    return;
  }

  if (inflightPrewarms.has(appPath)) {
    return;
  }

  const prewarmPromise = ipc.languageModel
    .getOpenCodeAgents({ appPath })
    .then(() => {
      lastSuccessfulPrewarm.set(appPath, Date.now());
    })
    .catch((error) => {
      console.warn("Failed to prewarm OpenCode", { appPath, error });
    })
    .finally(() => {
      inflightPrewarms.delete(appPath);
    });

  inflightPrewarms.set(appPath, prewarmPromise);
}

export function resetOpenCodePrewarmState() {
  inflightPrewarms.clear();
  lastSuccessfulPrewarm.clear();
}
