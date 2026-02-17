import http from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

type ServerContext = {
  server: http.Server;
  origin: string;
};

function startServer(handler: http.RequestListener): Promise<ServerContext> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.once("error", reject);
    server.listen(0, "localhost", () => {
      const address = server.address() as AddressInfo | null;
      if (!address || typeof address === "string") {
        reject(new Error("Failed to resolve server address"));
        return;
      }

      resolve({
        server,
        origin: `http://localhost:${address.port}`,
      });
    });
  });
}

function closeServer(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = http.createServer();
    server.once("error", reject);
    server.listen(0, "localhost", () => {
      const address = server.address() as AddressInfo | null;
      if (!address || typeof address === "string") {
        reject(new Error("Failed to resolve free port"));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

function waitForProxyStart(worker: Worker): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Proxy worker did not start in time"));
    }, 10000);

    const onMessage = (message: unknown) => {
      if (
        typeof message === "string" &&
        message.startsWith("proxy-server-start url=")
      ) {
        cleanup();
        resolve(message.slice("proxy-server-start url=".length));
      }
    };

    const onExit = (code: number) => {
      cleanup();
      reject(new Error(`Proxy worker exited before start with code ${code}`));
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      clearTimeout(timeout);
      worker.off("message", onMessage);
      worker.off("exit", onExit);
      worker.off("error", onError);
    };

    worker.on("message", onMessage);
    worker.on("exit", onExit);
    worker.on("error", onError);
  });
}

function terminateWorker(worker: Worker | null): Promise<void> {
  if (!worker) {
    return Promise.resolve();
  }
  return worker.terminate().then(() => undefined);
}

describe("proxy_server CSP injection", () => {
  let upstream: ServerContext | null = null;
  let proxyWorker: Worker | null = null;
  let proxyOrigin = "";

  beforeAll(async () => {
    upstream = await startServer((req, res) => {
      if (req.url === "/" || req.url === "/index.html") {
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "content-security-policy":
            "default-src 'self'; script-src 'self' 'nonce-anyon-nonce'",
        });

        res.end(
          '<!doctype html><html><head><script nonce="anyon-nonce">window.__upstreamLoaded=true;</script></head><body><h1>hello</h1></body></html>',
        );
        return;
      }

      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    });

    const proxyPort = await getFreePort();
    proxyWorker = new Worker(
      path.resolve(process.cwd(), "worker/proxy_server.js"),
      {
        workerData: {
          targetOrigin: upstream.origin,
          port: proxyPort,
        },
      },
    );

    proxyOrigin = await waitForProxyStart(proxyWorker);
  });

  afterAll(async () => {
    await terminateWorker(proxyWorker);
    if (upstream) {
      await closeServer(upstream.server);
    }
  });

  it("injects external Anyon scripts with existing nonce under CSP", async () => {
    const response = await fetch(`${proxyOrigin}/`);
    expect(response.status).toBe(200);

    const html = await response.text();
    expect(html).toContain(
      '<script nonce="anyon-nonce" src="/__anyon/anyon-component-selector-client.js"></script>',
    );
    expect(html).toContain(
      '<script nonce="anyon-nonce" src="/__anyon/anyon-visual-editor-client.js"></script>',
    );
    expect(html).toContain(
      '<script nonce="anyon-nonce" src="/__anyon/anyon-screenshot-client.js"></script>',
    );
  });

  it("serves injected Anyon script assets from proxy endpoints", async () => {
    const response = await fetch(
      `${proxyOrigin}/__anyon/anyon-component-selector-client.js`,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain(
      "application/javascript",
    );

    const body = await response.text();
    expect(body).toContain("activate-anyon-component-selector");
  });

  it("rejects invalid nested Anyon asset paths", async () => {
    const response = await fetch(`${proxyOrigin}/__anyon/nested/file.js`);
    expect(response.status).toBe(400);
  });
});
