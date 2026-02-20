import { execSync } from "node:child_process";
import { readFile, rm, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

type RegistryTemplate = {
  id: string;
  title: string;
  path: string;
  type?: string;
};

type RegistryFile = {
  templates: RegistryTemplate[];
};

const LOG_PREFIX = "[build-previews]";

function log(message: string): void {
  process.stdout.write(`${LOG_PREFIX} ${message}\n`);
}

function logError(message: string): void {
  process.stderr.write(`${LOG_PREFIX} ERROR ${message}\n`);
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function runCommand(
  command: string,
  cwd: string,
  timeoutMs = 600_000,
  maxRetries = 5,
): void {
  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    try {
      execSync(command, {
        cwd,
        stdio: "inherit",
        timeout: timeoutMs,
      });
      return;
    } catch (error) {
      const message = formatError(error);
      const canRetry = message.includes("EAGAIN") && attempt <= maxRetries;

      if (!canRetry) {
        throw error;
      }

      const waitSeconds = attempt * 2;
      log(
        `Transient EAGAIN while running "${command}" (attempt ${attempt}/${maxRetries + 1}). Retrying in ${waitSeconds}s...`,
      );
      execSync(`sleep ${waitSeconds}`);
    }
  }
}

function toOutAssetPath(outDir: string, webPath: string): string {
  const normalized = webPath.replace(/^\//, "").split("?")[0].split("#")[0];
  return path.join(outDir, normalized);
}

function escapeInlineScriptForHtml(scriptContent: string): string {
  return scriptContent.replace(/<\/script/gi, "<\\/script");
}

async function inlineFontUrlsInCss(cssContent: string, outDir: string): Promise<string> {
  const fontUrlRegex = /url\((['"]?)(\/_next\/static\/media\/[^)'"?#]+\.woff2(?:\?[^)'"#]*)?(?:#[^)'"#]*)?)\1\)/g;

  const matchedUrls = new Set<string>();
  for (const match of cssContent.matchAll(fontUrlRegex)) {
    const matchedUrl = match[2];
    if (matchedUrl) {
      matchedUrls.add(matchedUrl);
    }
  }

  let inlinedCss = cssContent;

  for (const matchedUrl of matchedUrls) {
    const fontPath = toOutAssetPath(outDir, matchedUrl);
    const fontFile = await readFile(fontPath);
    const dataUri = `data:font/woff2;base64,${fontFile.toString("base64")}`;
    inlinedCss = inlinedCss.split(matchedUrl).join(dataUri);
  }

  return inlinedCss;
}

async function inlineTemplateAssets(templateDir: string): Promise<void> {
  const outDir = path.join(templateDir, "out");
  const indexHtmlPath = path.join(outDir, "index.html");
  const previewDir = path.join(templateDir, "preview");
  const previewHtmlPath = path.join(previewDir, "index.html");

  const html = await readFile(indexHtmlPath, "utf8");
  const $ = cheerio.load(html);

  const stylesheetLinks = $("link[rel='stylesheet'][href]").toArray();
  for (const element of stylesheetLinks) {
    const link = $(element);
    const href = link.attr("href");
    if (!href || !href.startsWith("/_next/static/")) {
      continue;
    }

    const cssPath = toOutAssetPath(outDir, href);
    const rawCss = await readFile(cssPath, "utf8");
    const inlinedCss = await inlineFontUrlsInCss(rawCss, outDir);

    const styleNode = $("<style></style>");
    styleNode.text(inlinedCss);

    const attributes = element.attribs ?? {};
    for (const [name, value] of Object.entries(attributes)) {
      if (name === "href" || name === "rel") {
        continue;
      }
      styleNode.attr(name, value);
    }

    link.replaceWith(styleNode);
  }

  const scriptTags = $("script[src]").toArray();
  for (const element of scriptTags) {
    const script = $(element);
    const src = script.attr("src");
    if (!src || !src.startsWith("/_next/static/")) {
      continue;
    }

    const scriptPath = toOutAssetPath(outDir, src);
    const scriptContent = await readFile(scriptPath, "utf8");
    const escapedScriptContent = escapeInlineScriptForHtml(scriptContent);

    const attrs = Object.entries(element.attribs ?? {})
      .filter(([name]) => name !== "src")
      .map(([k, v]) => (v === "" ? k : `${k}="${v}"`))
      .join(" ");
    const attrStr = attrs ? ` ${attrs}` : "";
    script.replaceWith(`<script${attrStr}>${escapedScriptContent}</script>`);
  }

  $("link[rel='preload']").remove();

  await mkdir(previewDir, { recursive: true });
  await writeFile(previewHtmlPath, $.html(), "utf8");
}

async function cleanupTemplateBuildArtifacts(templateDir: string): Promise<void> {
  const outDir = path.join(templateDir, "out");
  const nextDir = path.join(templateDir, ".next");
  const nodeModulesDir = path.join(templateDir, "node_modules");

  await Promise.all([
    rm(outDir, { recursive: true, force: true }),
    rm(nextDir, { recursive: true, force: true }),
    rm(nodeModulesDir, { recursive: true, force: true }),
  ]);
}

async function main(): Promise<void> {
  const projectRoot = process.cwd();
  const registryPath = path.resolve(projectRoot, "templates", "registry.json");

  log(`Loading template registry from ${registryPath}`);

  const registryRaw = await readFile(registryPath, "utf8");
  const registry = JSON.parse(registryRaw) as RegistryFile;

  const targetTemplateId = process.env.TEMPLATE_ID?.trim();
  const nextTemplates = registry.templates.filter((template) => {
    if (template.type !== "nextjs") {
      return false;
    }
    if (!targetTemplateId) {
      return true;
    }
    return template.id === targetTemplateId;
  });

  if (nextTemplates.length === 0) {
    log("No Next.js templates found in registry.");
    return;
  }

  log(`Found ${nextTemplates.length} Next.js template(s) to process.`);
  let failedTemplates = 0;

  for (const template of nextTemplates) {
    const templateDir = path.resolve(projectRoot, "templates", template.path);

    log(`---`);
    log(`Template: ${template.id} (${template.path})`);

    try {
      log("Step 1/4: Installing dependencies (npm install)");
      runCommand(
        "npm install --legacy-peer-deps --ignore-scripts --no-audit --no-fund",
        templateDir,
        300_000,
      );

      log("Step 2/4: Building static export (CI=1 npx next build)");
      runCommand("CI=1 npx next build", templateDir, 600_000);

      log("Step 3/4: Inlining CSS/JS/fonts into preview/index.html");
      await inlineTemplateAssets(templateDir);

      log("Template preview generated successfully.");
    } catch (error) {
      failedTemplates += 1;
      logError(`Template ${template.id} failed: ${formatError(error)}`);
    } finally {
      log("Step 4/4: Cleaning build artifacts (out/, node_modules/)");
      try {
        await cleanupTemplateBuildArtifacts(templateDir);
      } catch (cleanupError) {
        logError(
          `Cleanup failed for ${template.id}: ${formatError(cleanupError)}`,
        );
      }
    }
  }

  if (failedTemplates > 0) {
    logError(`Completed with ${failedTemplates} failed template(s).`);
    process.exitCode = 1;
    return;
  }

  log("Done.");
}

main().catch((error) => {
  logError(`Unhandled failure: ${formatError(error)}`);
  process.exitCode = 1;
});
