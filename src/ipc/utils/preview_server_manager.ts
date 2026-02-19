import type { ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import net from "node:net";
import path from "node:path";
import { DESIGN_SYSTEM_IDS } from "@/shared/designSystems";
import { app } from "electron";

let activePreview: {
  designSystemId: string;
  port?: number;
  process?: ChildProcess;
} | null = null;

const PREFERRED_PORT_BASE = 33000;
const PREFERRED_PORTS: Record<string, number> = {
  shadcn: 33000,
  mui: 33001,
  antd: 33002,
  mantine: 33003,
  chakra: 33004,
  daisyui: 33005,
};

async function findAvailablePort(preferred: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(preferred, () => {
      server.close(() => resolve(preferred));
    });
    server.on("error", () => {
      const fallback = net.createServer();
      fallback.listen(0, () => {
        const port = (fallback.address() as net.AddressInfo).port;
        fallback.close(() => resolve(port));
      });
    });
  });
}

export async function getPreviewUrl(
  designSystemId: string,
): Promise<{ url: string; nonce: string }> {
  if (!DESIGN_SYSTEM_IDS.includes(designSystemId)) {
    throw new Error(`Unknown design system: ${designSystemId}`);
  }

  const nonce = crypto.randomUUID();

  if (activePreview && activePreview.designSystemId !== designSystemId) {
    await stopActivePreview();
  }

  if (app.isPackaged) {
    const url = `anyon-preview://${designSystemId}/index.html?nonce=${nonce}&parentOrigin=${encodeURIComponent("app://anyon")}`;
    activePreview = { designSystemId };
    return { url, nonce };
  }

  if (activePreview?.designSystemId === designSystemId && activePreview.port) {
    const url = `http://localhost:${activePreview.port}?nonce=${nonce}&parentOrigin=${encodeURIComponent(`http://localhost:${activePreview.port}`)}`;
    return { url, nonce };
  }

  const preferredPort = PREFERRED_PORTS[designSystemId] ?? PREFERRED_PORT_BASE;
  const port = await findAvailablePort(preferredPort);

  // TODO: Spawn Vite dev server for preview-apps/preview-{designSystemId}
  // For now, return the URL assuming the dev server is running
  const previewDir = path.join(
    process.cwd(),
    "preview-apps",
    `preview-${designSystemId}`,
  );
  void previewDir; // Will be used when spawning Vite dev server

  activePreview = { designSystemId, port };
  return {
    url: `http://localhost:${port}?nonce=${nonce}&parentOrigin=${encodeURIComponent(`http://localhost:${port}`)}`,
    nonce,
  };
}

export async function stopActivePreview(): Promise<void> {
  if (activePreview?.process) {
    activePreview.process.kill();
  }
  activePreview = null;
}
