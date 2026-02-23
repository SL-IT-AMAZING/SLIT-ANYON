import { autoUpdater } from "electron";
import log from "electron-log";
import { systemContracts } from "../types/system";
import { createTypedHandler } from "./base";

const logger = log.scope("update-handlers");

export function registerUpdateHandlers() {
  logger.debug("Registering update handlers");

  createTypedHandler(systemContracts.installUpdate, async () => {
    logger.info("User requested update install — quitting and installing");
    autoUpdater.quitAndInstall();
  });
}
