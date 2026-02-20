import fs from "node:fs";
import fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const whereMock = vi.fn().mockResolvedValue(undefined);
  const setMock = vi.fn(() => ({ where: whereMock }));
  const updateMock = vi.fn(() => ({ set: setMock }));
  const eqMock = vi.fn(() => "eq-clause");
  const loggerInfo = vi.fn();

  return {
    whereMock,
    setMock,
    updateMock,
    eqMock,
    loggerInfo,
  };
});

vi.mock("@/db", () => ({
  db: {
    update: mocks.updateMock,
  },
}));

vi.mock("@/db/schema", () => ({
  apps: {
    id: "id-column",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: mocks.eqMock,
}));

vi.mock("electron-log", () => ({
  default: {
    scope: vi.fn(() => ({
      info: mocks.loggerInfo,
    })),
  },
}));

import { learnAppProfile } from "@/ipc/services/profileLearning";

describe("learnAppProfile", () => {
  let tempDir = "";

  beforeEach(async () => {
    tempDir = await fsPromises.mkdtemp(
      path.join(os.tmpdir(), "anyon-profile-learning-"),
    );
    mocks.whereMock.mockClear();
    mocks.setMock.mockClear();
    mocks.updateMock.mockClear();
    mocks.eqMock.mockClear();
    mocks.loggerInfo.mockClear();
  });

  afterEach(async () => {
    if (tempDir && fs.existsSync(tempDir)) {
      await fsPromises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("scaffolds Vite for HTML-only projects and returns runnable profile", async () => {
    await fsPromises.writeFile(
      path.join(tempDir, "index.html"),
      "<!doctype html><html><body><h1>Hello</h1></body></html>",
    );

    const result = await learnAppProfile(tempDir, 42);

    expect(result).toEqual({
      installCommand: "npm install --legacy-peer-deps",
      startCommand: "npm run dev -- --port {port}",
    });

    const packageJsonPath = path.join(tempDir, "package.json");
    const viteConfigPath = path.join(tempDir, "vite.config.js");

    expect(fs.existsSync(packageJsonPath)).toBe(true);
    expect(fs.existsSync(viteConfigPath)).toBe(true);

    const packageJson = JSON.parse(
      await fsPromises.readFile(packageJsonPath, "utf8"),
    ) as {
      name?: string;
      scripts?: { dev?: string };
      devDependencies?: { vite?: string };
    };

    expect(packageJson.name).toMatch(/^[a-z0-9._-]+$/);
    expect(packageJson.scripts?.dev).toBe("vite");
    expect(packageJson.devDependencies?.vite).toBe("^6.0.0");

    const viteConfig = await fsPromises.readFile(viteConfigPath, "utf8");
    expect(viteConfig).toContain("vite-plugin-anyon-html-tagger");
    expect(viteConfig).toContain("transformIndexHtml");
    expect(viteConfig).toContain("data-anyon-id");
    expect(viteConfig).toContain("data-anyon-name");

    expect(mocks.updateMock).toHaveBeenCalledTimes(1);
    expect(mocks.setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        installCommand: "npm install --legacy-peer-deps",
        startCommand: "npm run dev -- --port {port}",
        profileLearned: true,
        profileSource: "detected",
      }),
    );
  });

  it("does not scaffold when package.json already exists", async () => {
    const packageJsonPath = path.join(tempDir, "package.json");
    const existingPackageJson = {
      name: "existing-project",
      scripts: {
        dev: "vite --host",
      },
      devDependencies: {
        vite: "^6.1.0",
      },
    };

    await fsPromises.writeFile(
      packageJsonPath,
      `${JSON.stringify(existingPackageJson, null, 2)}\n`,
    );
    await fsPromises.writeFile(
      path.join(tempDir, "index.html"),
      "<!doctype html><html><body><h1>Hello</h1></body></html>",
    );

    const result = await learnAppProfile(tempDir, 7);

    expect(result).toEqual({
      installCommand: "npm install --legacy-peer-deps",
      startCommand: "npm run dev -- --port {port}",
    });

    expect(fs.existsSync(path.join(tempDir, "vite.config.js"))).toBe(false);

    const packageJsonAfter = JSON.parse(
      await fsPromises.readFile(packageJsonPath, "utf8"),
    );
    expect(packageJsonAfter).toEqual(existingPackageJson);
  });

  it("preserves existing vite config files when scaffolding HTML-only projects", async () => {
    const existingViteConfigPath = path.join(tempDir, "vite.config.ts");
    const existingViteConfig =
      'import { defineConfig } from "vite";\nexport default defineConfig({});\n';

    await fsPromises.writeFile(
      path.join(tempDir, "index.html"),
      "<!doctype html><html><body><h1>Hello</h1></body></html>",
    );
    await fsPromises.writeFile(existingViteConfigPath, existingViteConfig);

    await learnAppProfile(tempDir, 99);

    expect(fs.existsSync(path.join(tempDir, "package.json"))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, "vite.config.js"))).toBe(false);
    expect(await fsPromises.readFile(existingViteConfigPath, "utf8")).toBe(
      existingViteConfig,
    );
  });
});
