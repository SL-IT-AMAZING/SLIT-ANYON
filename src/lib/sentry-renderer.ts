import * as SentryRenderer from "@sentry/electron/renderer";
import { version } from "../../package.json";

declare const __SENTRY_DSN__: string;

export function initSentryRenderer(): void {
  const isProduction = process.env.NODE_ENV === "production";
  SentryRenderer.init({
    dsn: __SENTRY_DSN__ || "",
    enabled: isProduction,
    release: `dyad@${version}`,
    environment: isProduction ? "production" : "development",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
