#!/usr/bin/env npx tsx
/**
 * Fetch vendor binaries for bundling with Anyon.
 * Downloads OpenCode CLI and Oh-My-OpenCode for the current platform.
 *
 * Usage:
 *   npx tsx scripts/fetch-vendor-binaries.ts
 *
 * Environment variables:
 *   OPENCODE_VERSION - Override OpenCode version (default: latest)
 *   OMOC_VERSION     - Override Oh-My-OpenCode version (default: latest)
 */

import {
  copyFileSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { execFile } from "node:child_process";
import { chmod, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import tar from "tar";
import extractZip from "extract-zip";

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

async function adHocSignIfDarwin(binaryPath: string): Promise<void> {
  if (process.platform !== "darwin") {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    execFile(
      "codesign",
      ["--force", "--sign", "-", binaryPath],
      (error, _stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `codesign failed for ${binaryPath}: ${stderr || error.message}`,
            ),
          );
          return;
        }
        resolve();
      },
    );
  });

  console.log(`  ↳ Ad-hoc signed for macOS: ${binaryPath}`);
}

/** Recursively find all files under `dir`, optionally filtering by name pattern. */
function findFiles(dir: string, filter?: (name: string) => boolean): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(fullPath, filter));
    } else if (!filter || filter(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

/** List directory contents with sizes (replaces `ls -la`). */
function listDir(dir: string): string {
  if (!existsSync(dir)) return `(directory does not exist: ${dir})`;
  return readdirSync(dir)
    .map((name) => {
      const fullPath = join(dir, name);
      const stat = statSync(fullPath);
      const kind = stat.isDirectory() ? "dir " : "file";
      return `  ${kind}  ${stat.size.toString().padStart(10)}  ${name}`;
    })
    .join("\n");
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
      await extractZip(archivePath, { dir: tmpDir });
    } else {
      await tar.extract({ file: archivePath, cwd: tmpDir });
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
      const contents = listDir(tmpDir);
      const found = findFiles(tmpDir, (n) => n.startsWith("opencode")).join(
        "\n",
      );
      throw new Error(
        `Could not find ${binaryName} in extracted archive.\nTemp dir contents:\n${contents}\nOpencode files found:\n${found || "none"}`,
      );
    }

    const destBin = join(outDir, binaryName);
    copyFileSync(srcBin, destBin);

    if (!isWindows) {
      await chmod(destBin, 0o755);
    }

    await adHocSignIfDarwin(destBin);

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
    await tar.extract({ file: tarballPath, cwd: tmpDir });

    const binaryName = `oh-my-opencode${exeExt}`;
    const srcBin = join(tmpDir, "package", "bin", binaryName);

    if (!existsSync(srcBin)) {
      const contents = findFiles(tmpDir).join("\n");
      throw new Error(
        `Could not find ${binaryName} at expected path: ${srcBin}\nExtracted files:\n${contents}`,
      );
    }

    const destBin = join(outDir, binaryName);
    copyFileSync(srcBin, destBin);

    if (!isWindows) {
      await chmod(destBin, 0o755);
    }

    await adHocSignIfDarwin(destBin);

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
