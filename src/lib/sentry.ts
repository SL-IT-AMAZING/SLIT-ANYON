import * as SentryMain from "@sentry/electron/main";
import { app } from "electron";
import { version } from "../../package.json";

// Privacy: strip user home directory paths from error events
function stripFilePaths(event: SentryMain.ErrorEvent): SentryMain.ErrorEvent {
  const homeDir =
    process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || "";
  if (!homeDir) return event;

  const replacePath = (str: string): string => str.split(homeDir).join("~");

  if (event.exception?.values) {
    for (const exception of event.exception.values) {
      if (exception.stacktrace?.frames) {
        for (const frame of exception.stacktrace.frames) {
          if (frame.filename) {
            frame.filename = replacePath(frame.filename);
          }
          if (frame.abs_path) {
            frame.abs_path = replacePath(frame.abs_path);
          }
        }
      }
      if (exception.value) {
        exception.value = replacePath(exception.value);
      }
    }
  }

  if (event.breadcrumbs) {
    for (const breadcrumb of event.breadcrumbs) {
      if (breadcrumb.message) {
        breadcrumb.message = replacePath(breadcrumb.message);
      }
    }
  }

  return event;
}

export function initSentryMain(): void {
  SentryMain.init({
    dsn: process.env.SENTRY_DSN || "",
    enabled: app.isPackaged,
    release: `anyon@${version}`,
    environment: app.isPackaged ? "production" : "development",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    beforeSend(event) {
      return stripFilePaths(event);
    },
  });
}
