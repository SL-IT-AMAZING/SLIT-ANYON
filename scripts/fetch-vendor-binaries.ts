#!/usr/bin/env npx tsx
/**
 * Fetch vendor binaries for bundling with Dyad.
 * Downloads OpenCode CLI and Oh-My-OpenCode for the current platform.
 *
 * Usage:
 *   npx tsx scripts/fetch-vendor-binaries.ts
 *
 * Environment variables:
 *   OPENCODE_VERSION - Override OpenCode version (default: latest)
 *   OMOC_VERSION     - Override Oh-My-OpenCode version (default: latest)
 */

import { execSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, rmSync } from "node:fs";
import { chmod, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Platform / arch mapping
// ---------------------------------------------------------------------------

const PLATFORM_MAP: Record<string, string> = {
  darwin: "darwin",
  linux: "linux",
  win32: "windows",
};

const ARCH_MAP: Record<string, string> = {
  arm64: "arm64",
  x64: "x64",
};

const platform = PLATFORM_MAP[process.platform];
const arch = ARCH_MAP[process.arch];

if (!platform || !arch) {
  console.error(
    `❌ Unsupported platform/arch: ${process.platform}/${process.arch}`,
  );
  process.exit(1);
}

const isWindows = process.platform === "win32";
const exeExt = isWindows ? ".exe" : "";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..");
const VENDOR_DIR = join(PROJECT_ROOT, "vendor");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchWithRetry(
  url: string,
  opts: RequestInit = {},
  retries = 1,
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`  ↳ GET ${url}${attempt > 0 ? ` (retry ${attempt})` : ""}`);
      const res = await fetch(url, { ...opts, redirect: "follow" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
      }
      return res;
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  ⚠ Attempt ${attempt + 1} failed, retrying...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("unreachable");
}

async function downloadToFile(url: string, dest: string): Promise<void> {
  const res = await fetchWithRetry(url);
  if (!res.body) throw new Error("Response body is null");
  const dir = dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const ws = createWriteStream(dest);
  await pipeline(Readable.fromWeb(res.body as any), ws);
}

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function cleanupOnError(...paths: string[]): void {
  for (const p of paths) {
    try {
      if (existsSync(p)) rmSync(p, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  }
}

// ---------------------------------------------------------------------------
// OpenCode download
// ---------------------------------------------------------------------------

async function fetchOpenCode(): Promise<string> {
  const version = process.env.OPENCODE_VERSION;
  const ext = platform === "linux" ? "tar.gz" : "zip";

  const baseUrl =
    version && version !== "latest"
      ? `https://github.com/anomalyco/opencode/releases/download/v${version}`
      : `https://github.com/anomalyco/opencode/releases/latest/download`;

  const archiveFilename = `opencode-${platform}-${arch}.${ext}`;
  const url = `${baseUrl}/${archiveFilename}`;

  const outDir = join(VENDOR_DIR, "opencode", "bin");
  ensureDir(outDir);

  const tmpDir = join(tmpdir(), `opencode-dl-${Date.now()}`);
  ensureDir(tmpDir);

  const archivePath = join(tmpDir, archiveFilename);

  try {
    console.log(`📦 Downloading OpenCode (${version || "latest"})...`);
    await downloadToFile(url, archivePath);

    console.log(`  ↳ Extracting...`);
    if (ext === "zip") {
      execSync(`unzip -o -j "${archivePath}" -d "${tmpDir}"`, {
        stdio: "pipe",
      });
    } else {
      execSync(`tar xzf "${archivePath}" -C "${tmpDir}"`, { stdio: "pipe" });
    }

    const binaryName = `opencode${exeExt}`;
    const candidates = [
      join(tmpDir, binaryName),
      join(tmpDir, `opencode-${platform}-${arch}`, binaryName),
    ];

    let srcBin: string | undefined;
    for (const c of candidates) {
      if (existsSync(c)) {
        srcBin = c;
        break;
      }
    }

    if (!srcBin) {
      const contents = execSync(`ls -la "${tmpDir}"`, {
        encoding: "utf-8",
      }).trim();
      const found = execSync(`find "${tmpDir}" -name "opencode*" -type f`, {
        encoding: "utf-8",
      }).trim();
      throw new Error(
        `Could not find ${binaryName} in extracted archive.\nTemp dir contents:\n${contents}\nOpencode files found:\n${found || "none"}`,
      );
    }

    const destBin = join(outDir, binaryName);
    execSync(`cp "${srcBin}" "${destBin}"`, { stdio: "pipe" });

    if (!isWindows) {
      await chmod(destBin, 0o755);
    }

    console.log(`  ✅ OpenCode → ${destBin}`);
    return version || "latest";
  } finally {
    cleanupOnError(tmpDir);
  }
}

// ---------------------------------------------------------------------------
// Oh-My-OpenCode download
// ---------------------------------------------------------------------------

async function fetchOmoc(): Promise<string> {
  const packageName = `oh-my-opencode-${platform}-${arch}`;
  let version = process.env.OMOC_VERSION;

  if (!version) {
    console.log(`📦 Fetching latest Oh-My-OpenCode version...`);
    const metaUrl = `https://registry.npmjs.org/${packageName}/latest`;
    const res = await fetchWithRetry(metaUrl);
    const meta = (await res.json()) as { version: string };
    version = meta.version;
    console.log(`  ↳ Latest version: ${version}`);
  } else {
    console.log(`📦 Using specified Oh-My-OpenCode version: ${version}`);
  }

  const tarballUrl = `https://registry.npmjs.org/${packageName}/-/${packageName}-${version}.tgz`;

  const outDir = join(VENDOR_DIR, "oh-my-opencode", "bin");
  ensureDir(outDir);

  const tmpDir = join(tmpdir(), `omoc-dl-${Date.now()}`);
  ensureDir(tmpDir);

  const tarballPath = join(tmpDir, `${packageName}-${version}.tgz`);

  try {
    console.log(`📦 Downloading Oh-My-OpenCode ${version}...`);
    await downloadToFile(tarballUrl, tarballPath);

    console.log(`  ↳ Extracting...`);
    execSync(`tar xzf "${tarballPath}" -C "${tmpDir}"`, { stdio: "pipe" });

    const binaryName = `oh-my-opencode${exeExt}`;
    const srcBin = join(tmpDir, "package", "bin", binaryName);

    if (!existsSync(srcBin)) {
      const contents = execSync(`find "${tmpDir}" -type f`, {
        encoding: "utf-8",
      }).trim();
      throw new Error(
        `Could not find ${binaryName} at expected path: ${srcBin}\nExtracted files:\n${contents}`,
      );
    }

    const destBin = join(outDir, binaryName);
    execSync(`cp "${srcBin}" "${destBin}"`, { stdio: "pipe" });

    if (!isWindows) {
      await chmod(destBin, 0o755);
    }

    console.log(`  ✅ Oh-My-OpenCode → ${destBin}`);
    return version;
  } finally {
    cleanupOnError(tmpDir);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log(`\n🔧 Fetching vendor binaries (${platform}/${arch})\n`);

  ensureDir(VENDOR_DIR);

  let opencodeVersion: string;
  let omocVersion: string;

  try {
    opencodeVersion = await fetchOpenCode();
  } catch (err) {
    console.error(
      `\n❌ Failed to fetch OpenCode: ${err instanceof Error ? err.message : err}`,
    );
    process.exit(1);
  }

  try {
    omocVersion = await fetchOmoc();
  } catch (err) {
    console.error(
      `\n❌ Failed to fetch Oh-My-OpenCode: ${err instanceof Error ? err.message : err}`,
    );
    process.exit(1);
  }

  const versionsPath = join(VENDOR_DIR, "versions.json");
  const versions = {
    opencode: opencodeVersion,
    "oh-my-opencode": omocVersion,
    platform,
    arch,
    fetchedAt: new Date().toISOString(),
  };

  await writeFile(versionsPath, JSON.stringify(versions, null, 2) + "\n");
  console.log(`\n📄 versions.json → ${versionsPath}`);

  console.log(`\n✅ All vendor binaries fetched successfully!\n`);
  console.log(JSON.stringify(versions, null, 2));
  console.log("");
}

main();
