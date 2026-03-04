import fs from "node:fs";
import path from "node:path";
import { app, net, protocol } from "electron";
import log from "electron-log";

const logger = log.scope("thumbnail-protocol");

/**
 * Returns the root directory where template thumbnails are stored.
 * Each template has a thumbnail at `<root>/<templatePath>/thumbnail.jpg`.
 */
function getTemplatesRoot(): string {
  return path.join(app.getAppPath(), "templates");
}

/**
 * Returns the directory where app preview thumbnails are stored.
 * Thumbnails are saved as `{appId}.png` inside this directory.
 */
export function getAppThumbnailDir(): string {
  return path.join(app.getPath("userData"), "app-thumbnails");
}

/**
 * Returns the full file path for a specific app's thumbnail.
 */
export function getAppThumbnailPath(appId: number): string {
  return path.join(getAppThumbnailDir(), `${appId}.png`);
}
// Called AFTER app.whenReady()
export function registerThumbnailProtocol(): void {
  // Template thumbnails: anyon-thumb://template/<templateId>/thumbnail.jpg
  // Note: templateId is in the pathname, NOT hostname, because numeric IDs
  // like "0001" get parsed as IPv4 addresses by WHATWG URL parser in Chromium.
  protocol.handle("anyon-thumb", (request) => {
    const url = new URL(request.url);
    // pathname is e.g. "/0001/thumbnail.jpg" — extract the template ID
    const pathParts = url.pathname.split("/").filter(Boolean);
    const templateId = pathParts[0];

    if (!templateId || templateId.length === 0) {
      return new Response("Bad Request", { status: 400 });
    }

    const normalizedId = path.normalize(templateId);
    if (normalizedId.includes("..") || path.isAbsolute(normalizedId)) {
      logger.warn(`Rejected path traversal attempt: ${templateId}`);
      return new Response("Forbidden", { status: 403 });
    }

    const templatesRoot = getTemplatesRoot();
    const thumbnailPath = path.join(
      templatesRoot,
      normalizedId,
      "thumbnail.jpg",
    );
    const resolvedPath = path.resolve(thumbnailPath);

    if (!resolvedPath.startsWith(path.resolve(templatesRoot))) {
      logger.warn(`Resolved path outside templates root: ${resolvedPath}`);
      return new Response("Forbidden", { status: 403 });
    }

    if (fs.existsSync(resolvedPath)) {
      return net.fetch(`file://${resolvedPath}`, {
        headers: { "Content-Type": "image/jpeg" },
      });
    }

    return new Response("Not Found", { status: 404 });
  });

  // App preview thumbnails: app-thumbnail://app/<appId>
  // Note: appId is in the pathname, NOT hostname, because numeric IDs
  // get parsed as IPv4 addresses by WHATWG URL parser in Chromium.
  protocol.handle("app-thumbnail", (request) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const appId = pathParts[0];

    if (!appId || !/^\d+$/.test(appId)) {
      logger.warn(`Rejected app thumbnail request for invalid ID: ${appId}`);
      return new Response("Bad Request", { status: 400 });
    }

    const thumbnailDir = getAppThumbnailDir();
    const thumbnailPath = path.join(thumbnailDir, `${appId}.png`);
    const resolvedPath = path.resolve(thumbnailPath);

    if (!resolvedPath.startsWith(path.resolve(thumbnailDir))) {
      logger.warn(`Resolved path outside thumbnail dir: ${resolvedPath}`);
      return new Response("Forbidden", { status: 403 });
    }

    if (fs.existsSync(resolvedPath)) {
      return net.fetch(`file://${resolvedPath}`, {
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-cache",
        },
      });
    }

    return new Response("Not Found", { status: 404 });
  });

  logger.info("Thumbnail protocol handlers registered");
}
