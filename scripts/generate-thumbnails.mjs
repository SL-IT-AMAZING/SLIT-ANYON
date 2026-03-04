#!/usr/bin/env node
/**
 * Generate thumbnail screenshots for all templates in registry.json.
 * Usage: node scripts/generate-thumbnails.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TEMPLATES_DIR = path.join(ROOT, "templates");
const REGISTRY_PATH = path.join(TEMPLATES_DIR, "registry.json");

const VIEWPORT = { width: 1280, height: 800 };
const THUMBNAIL_FILENAME = "thumbnail.jpg";

async function main() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
  const templates = registry.templates;
  console.log(
    `Found ${templates.length} templates. Generating thumbnails...\n`,
  );

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
  });

  let success = 0;
  let failed = 0;

  for (const template of templates) {
    const templateDir = path.join(TEMPLATES_DIR, template.path);

    // Try preview/index.html first (pre-built Next.js/Vite), then index.html
    let htmlPath = path.join(templateDir, "preview", "index.html");
    if (!fs.existsSync(htmlPath)) {
      htmlPath = path.join(templateDir, "index.html");
    }

    if (!fs.existsSync(htmlPath)) {
      console.log(`  SKIP ${template.id} - no index.html found`);
      failed++;
      continue;
    }

    const outPath = path.join(templateDir, THUMBNAIL_FILENAME);
    try {
      const page = await context.newPage();
      await page.goto(`file://${htmlPath}`, {
        waitUntil: "networkidle",
        timeout: 15000,
      });
      // Extra wait for fonts/animations
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: outPath,
        type: "jpeg",
        quality: 85,
      });
      await page.close();
      success++;
      process.stdout.write(
        `  OK   ${template.id} ${template.title.substring(0, 45)}\r\n`,
      );
    } catch (err) {
      console.log(`  FAIL ${template.id} - ${err.message.substring(0, 60)}`);
      failed++;
    }
  }

  await browser.close();

  // Update registry.json with imageUrl pointing to GitHub raw URL
  const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/SL-IT-AMAZING/SLIT-ANYON/main/templates`;
  for (const template of registry.templates) {
    const thumbPath = path.join(
      TEMPLATES_DIR,
      template.path,
      THUMBNAIL_FILENAME,
    );
    if (fs.existsSync(thumbPath)) {
      template.imageUrl = `${GITHUB_RAW_BASE}/${template.path}/${THUMBNAIL_FILENAME}`;
    }
  }
  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + "\n");

  console.log(`\nDone! ${success} generated, ${failed} failed.`);
  console.log(`Registry updated: ${REGISTRY_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
