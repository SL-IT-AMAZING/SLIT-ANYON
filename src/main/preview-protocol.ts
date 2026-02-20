import fs from "node:fs";
import path from "node:path";
import { net, app, protocol } from "electron";
import log from "electron-log";
import { DESIGN_SYSTEM_IDS } from "../shared/designSystems";

const logger = log.scope("preview-protocol");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function getPreviewDistRoot(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "preview-dists");
  }
  return path.join(process.cwd(), "preview-apps");
}

// FIX #D: Must be called BEFORE app.whenReady()
export function registerPreviewScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "anyon-preview",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        corsEnabled: false,
      },
    },
  ]);
}

// Called AFTER app.whenReady()
export function registerPreviewProtocol(): void {
  protocol.handle("anyon-preview", (request) => {
    const url = new URL(request.url);
    const designSystemId = url.hostname;

    if (!DESIGN_SYSTEM_IDS.includes(designSystemId)) {
      logger.warn(`Rejected preview request for unknown ID: ${designSystemId}`);
      return new Response("Not Found", { status: 404 });
    }

    const distRoot = path.join(
      getPreviewDistRoot(),
      `preview-${designSystemId}`,
      "dist",
    );

    let requestedPath =
      url.pathname === "/" ? "index.html" : url.pathname.slice(1);

    // Path traversal protection
    requestedPath = path.normalize(requestedPath);
    if (requestedPath.includes("..") || path.isAbsolute(requestedPath)) {
      logger.warn(`Rejected path traversal attempt: ${requestedPath}`);
      return new Response("Forbidden", { status: 403 });
    }

    const filePath = path.join(distRoot, requestedPath);
    const resolvedPath = path.resolve(filePath);

    if (!resolvedPath.startsWith(path.resolve(distRoot))) {
      logger.warn(`Resolved path outside dist root: ${resolvedPath}`);
      return new Response("Forbidden", { status: 403 });
    }

    if (fs.existsSync(resolvedPath)) {
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || "application/octet-stream";
      return net.fetch(`file://${resolvedPath}`, {
        headers: { "Content-Type": mimeType },
      });
    }

    const indexPath = path.join(distRoot, "index.html");
    if (fs.existsSync(indexPath)) {
      return net.fetch(`file://${indexPath}`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    return new Response("Not Found", { status: 404 });
  });

  logger.info("Preview protocol handler registered");
}
