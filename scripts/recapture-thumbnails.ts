/**
 * Recapture template thumbnails via Playwright.
 * Templates contain built-in loading screens that dismiss after DOMContentLoaded + setTimeout.
 * This script waits for full render before capturing.
 *
 * Usage: npx tsx scripts/recapture-thumbnails.ts [--only 0046,0100]
 */

import express from "express";
import { existsSync, readdirSync, statSync } from "node:fs";
import type { Server } from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const TEMPLATES_DIR = path.resolve(__dirname, "../templates");
const VIEWPORT = { width: 1280, height: 800 };
const LOADER_DISMISS_WAIT_MS = 4000;
const SCREENSHOT_QUALITY = 80;

interface CaptureResult {
  id: string;
  success: boolean;
  oldSize: number;
  newSize: number;
  error?: string;
}

function getTemplateDirs(): string[] {
  return readdirSync(TEMPLATES_DIR)
    .filter((name) => {
      const full = path.join(TEMPLATES_DIR, name);
      return statSync(full).isDirectory();
    })
    .sort();
}

function getServableDir(templateDir: string): string | null {
  const previewPath = path.join(templateDir, "preview", "index.html");
  if (existsSync(previewPath)) return path.join(templateDir, "preview");

  const indexPath = path.join(templateDir, "index.html");
  if (existsSync(indexPath)) return templateDir;

  return null;
}

async function startStaticServer(
  root: string,
): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.static(root));
    const server: Server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => server.close(),
      });
    });
  });
}

// Force-hide common loader patterns that may survive past networkidle
const FORCE_HIDE_LOADERS = `
  document.querySelectorAll(
    '.loader, #loader, [class*="loading"], [id*="loading"], [class*="preloader"], [id*="preloader"]'
  ).forEach(el => el.style.display = 'none');
`;

async function captureTemplate(
  page: import("playwright").Page,
  templateId: string,
): Promise<CaptureResult> {
  const templateDir = path.join(TEMPLATES_DIR, templateId);
  const thumbPath = path.join(templateDir, "thumbnail.jpg");
  const oldSize = existsSync(thumbPath) ? statSync(thumbPath).size : 0;

  const serveDir = getServableDir(templateDir);
  if (!serveDir) {
    return {
      id: templateId,
      success: false,
      oldSize,
      newSize: 0,
      error: "No index.html found",
    };
  }

  const { url, close } = await startStaticServer(serveDir);

  try {
    await page.route("**/*.{mp4,webm,mp3,ogg,wav}", (route) => route.abort());
    await page.route("**/cdn.midjourney.com/**", (route) => route.abort());

    try {
      await page.goto(`${url}/index.html`, {
        waitUntil: "networkidle",
        timeout: 15000,
      });
    } catch {
      await page.goto(`${url}/index.html`, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });
    }

    await page.waitForTimeout(LOADER_DISMISS_WAIT_MS);
    await page.evaluate(FORCE_HIDE_LOADERS);
    await page.waitForTimeout(500);

    try {
      await page.screenshot({
        path: thumbPath,
        type: "jpeg",
        quality: SCREENSHOT_QUALITY,
        timeout: 10000,
      });
    } catch {
      // Playwright screenshot waits for fonts indefinitely — use CDP fallback
      const cdp = await page.context().newCDPSession(page);
      const { data } = await cdp.send("Page.captureScreenshot", {
        format: "jpeg",
        quality: SCREENSHOT_QUALITY,
      });
      await cdp.detach();
      const { writeFileSync } = await import("node:fs");
      writeFileSync(thumbPath, Buffer.from(data, "base64"));
    }

    await page.unrouteAll();

    const newSize = statSync(thumbPath).size;
    return { id: templateId, success: true, oldSize, newSize };
  } catch (error) {
    return {
      id: templateId,
      success: false,
      oldSize,
      newSize: oldSize,
      error: String(error),
    };
  } finally {
    close();
  }
}

async function main() {
  const args = process.argv.slice(2);
  let onlyIds: string[] | null = null;
  const onlyIdx = args.indexOf("--only");
  if (onlyIdx !== -1 && args[onlyIdx + 1]) {
    onlyIds = args[onlyIdx + 1].split(",").map((s) => s.trim());
  }

  const allDirs = getTemplateDirs();
  const templateIds = onlyIds
    ? allDirs.filter((id) => onlyIds!.includes(id))
    : allDirs;

  console.log(
    `\n📸 Recapturing thumbnails for ${templateIds.length} templates...\n`,
  );

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  const results: CaptureResult[] = [];
  let completed = 0;

  for (const id of templateIds) {
    completed++;
    const pct = ((completed / templateIds.length) * 100).toFixed(0);
    process.stdout.write(`  [${pct}%] ${id}... `);

    const result = await captureTemplate(page, id);
    results.push(result);

    if (result.success) {
      const sizeKB = (sz: number) => (sz / 1024).toFixed(0);
      const arrow =
        result.newSize > result.oldSize * 1.5 ? "📈" : "📉";
      console.log(
        `✅ ${arrow} ${sizeKB(result.oldSize)}→${sizeKB(result.newSize)}KB`,
      );
    } else {
      console.log(`❌ ${result.error}`);
    }
  }

  await browser.close();

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const improved = results.filter(
    (r) => r.success && r.newSize > r.oldSize * 1.5,
  ).length;

  console.log(`\n--- Summary ---`);
  console.log(`  ✅ Succeeded: ${succeeded}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📈 Significantly improved (>1.5x size): ${improved}`);

  if (failed > 0) {
    console.log(`\n  Failed templates:`);
    for (const r of results.filter((r) => !r.success)) {
      console.log(`    - ${r.id}: ${r.error}`);
    }
  }
}

main().catch(console.error);
