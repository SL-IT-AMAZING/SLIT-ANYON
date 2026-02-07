import * as SentryRenderer from "@sentry/electron/renderer";
import { version } from "../../package.json";

export function initSentryRenderer(): void {
  // @ts-ignore - import.meta.env is provided by Vite at runtime
  const env = import.meta.env;
  SentryRenderer.init({
    dsn: env.VITE_SENTRY_DSN || "",
    enabled: env.PROD,
    release: `dyad@${version}`,
    environment: env.PROD ? "production" : "development",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
