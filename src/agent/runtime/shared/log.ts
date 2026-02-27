/**
 * OMO Logger — prefixed wrapper around Electron's logger.
 */
import log from "electron-log";

const _logger = log.scope("omo");

export const omoLog = {
  info: (msg: string, ...args: unknown[]) => _logger.info(msg, ...args),
  warn: (msg: string, ...args: unknown[]) => _logger.warn(msg, ...args),
  error: (msg: string, ...args: unknown[]) => _logger.error(msg, ...args),
  debug: (msg: string, ...args: unknown[]) => _logger.debug(msg, ...args),
};
