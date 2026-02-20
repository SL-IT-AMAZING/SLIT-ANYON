import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { db } from "@/db";
import { apps } from "@/db/schema";
import { eq } from "drizzle-orm";
import log from "electron-log";

type PackageManager = "bun" | "yarn" | "pnpm" | "npm";
type FrameworkInfo = { name: string; portFlag: string };

const logger = log.scope("profileLearning");

function detectPackageManager(appPath: string): PackageManager {
  const bunLock = path.join(appPath, "bun.lock");
  const bunLockb = path.join(appPath, "bun.lockb");
  if (fs.existsSync(bunLock) || fs.existsSync(bunLockb)) {
    return "bun";
  }

  if (fs.existsSync(path.join(appPath, "yarn.lock"))) {
    return "yarn";
  }

  if (fs.existsSync(path.join(appPath, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (fs.existsSync(path.join(appPath, "package-lock.json"))) {
    return "npm";
  }

  return "npm";
}

function readPackageJson(appPath: string): Record<string, any> {
  const packageJsonPath = path.join(appPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(
      "This project is missing necessary configuration files. Make sure package.json exists in the project folder.",
    );
  }

  try {
    const packageJsonRaw = fs.readFileSync(packageJsonPath, "utf8");
    return JSON.parse(packageJsonRaw) as Record<string, any>;
  } catch {
    throw new Error(
      "The project configuration file is damaged and couldn't be read. Try re-creating the project.",
    );
  }
}

function detectFramework(
  packageJson: Record<string, any>,
): FrameworkInfo | null {
  const dependencies = (packageJson.dependencies ?? {}) as Record<
    string,
    string
  >;
  const devDependencies = (packageJson.devDependencies ?? {}) as Record<
    string,
    string
  >;
  const scripts = (packageJson.scripts ?? {}) as Record<string, string>;

  if (dependencies.next) {
    return { name: "nextjs", portFlag: "-p {port}" };
  }

  if (devDependencies.vite || scripts.dev?.includes("vite")) {
    return { name: "vite", portFlag: "--port {port}" };
  }

  if (dependencies.nuxt) {
    return { name: "nuxt", portFlag: "--port {port}" };
  }

  if (dependencies.astro) {
    return { name: "astro", portFlag: "--port {port}" };
  }

  if (dependencies["@remix-run/dev"]) {
    return { name: "remix", portFlag: "--port {port}" };
  }

  if (dependencies["react-scripts"]) {
    return { name: "cra", portFlag: "PORT={port}" };
  }

  return null;
}

function composeInstallCommand(pm: PackageManager): string {
  if (pm === "bun") {
    return "bun install";
  }

  if (pm === "yarn") {
    return "(yarn --version || corepack enable yarn) && yarn install";
  }

  if (pm === "pnpm") {
    return "pnpm install";
  }

  return "npm install --legacy-peer-deps";
}

function composeStartCommand(
  pm: PackageManager,
  framework: FrameworkInfo | null,
  scripts: Record<string, string> | undefined,
): string {
  const runCmd = pm === "bun" ? "bun run" : `${pm} run`;

  if (framework) {
    if (framework.name === "cra") {
      return `${framework.portFlag} ${runCmd} start`;
    }

    if (framework.name === "nextjs") {
      return `${runCmd} dev -- --webpack ${framework.portFlag}`;
    }

    if (
      framework.name === "vite" ||
      framework.name === "nuxt" ||
      framework.name === "astro" ||
      framework.name === "remix"
    ) {
      return `${runCmd} dev -- ${framework.portFlag}`;
    }
  }

  if (scripts?.dev) {
    return `${runCmd} dev -- --port {port}`;
  }

  if (scripts?.start) {
    return `${runCmd} start -- --port {port}`;
  }

  throw new Error(
    "Couldn't figure out how to start this project. Make sure it has a 'dev' or 'start' script in package.json.",
  );
}

function isHtmlOnlyProject(appPath: string): boolean {
  if (fs.existsSync(path.join(appPath, "package.json"))) {
    return false;
  }

  try {
    const entries = fs.readdirSync(appPath);
    return entries.some((entry) => entry.endsWith(".html"));
  } catch {
    return false;
  }
}

const SKIP_TAGS_LIST =
  "html,head,meta,link,script,style,title,!doctype,!DOCTYPE";

function sanitizePackageName(name: string): string {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return sanitized || "anyon-html-app";
}

const VITE_HTML_TAGGER_PLUGIN = `
function anyonHtmlTagger() {
  const SKIP = new Set("${SKIP_TAGS_LIST}".split(",").map((tag) => tag.toLowerCase()));
  const RAW_TEXT = new Set(["script", "style"]);

  function escapeAttr(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function getLineOffsets(html) {
    const offsets = [0];
    for (let i = 0; i < html.length; i++) {
      if (html[i] === "\\n") {
        offsets.push(i + 1);
      }
    }
    return offsets;
  }

  function toLineColumn(offsets, pos) {
    let lo = 0;
    let hi = offsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (offsets[mid] <= pos) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return String(lo + 1) + ":" + String(pos - offsets[lo] + 1);
  }

  function findTagEnd(html, start) {
    let quote = null;
    for (let i = start; i < html.length; i++) {
      const ch = html[i];
      if (quote) {
        if (ch === quote) {
          quote = null;
        }
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        continue;
      }
      if (ch === ">") {
        return i;
      }
    }
    return -1;
  }

  function tagHtml(html, file) {
    const lowerHtml = html.toLowerCase();
    const offsets = getLineOffsets(html);
    let out = "";
    let i = 0;

    while (i < html.length) {
      if (html.startsWith("<!--", i)) {
        const endComment = html.indexOf("-->", i + 4);
        if (endComment === -1) {
          out += html.slice(i);
          break;
        }
        out += html.slice(i, endComment + 3);
        i = endComment + 3;
        continue;
      }

      if (html[i] !== "<") {
        out += html[i];
        i += 1;
        continue;
      }

      const next = html[i + 1];
      if (next === "/" || next === "!" || next === "?") {
        const endSpecial = html.indexOf(">", i + 1);
        if (endSpecial === -1) {
          out += html.slice(i);
          break;
        }
        out += html.slice(i, endSpecial + 1);
        i = endSpecial + 1;
        continue;
      }

      let nameStart = i + 1;
      let nameEnd = nameStart;
      while (nameEnd < html.length && /[A-Za-z0-9-]/.test(html[nameEnd])) {
        nameEnd += 1;
      }

      if (nameEnd === nameStart) {
        out += html[i];
        i += 1;
        continue;
      }

      const tagName = html.slice(nameStart, nameEnd);
      const lowerTag = tagName.toLowerCase();
      const end = findTagEnd(html, nameEnd);

      if (end === -1) {
        out += html.slice(i);
        break;
      }

      const originalTag = html.slice(i, end + 1);
      const alreadyTagged = originalTag.includes("data-anyon-id");

      if (SKIP.has(lowerTag) || alreadyTagged) {
        out += originalTag;
      } else {
        const lc = toLineColumn(offsets, i);
        const id = escapeAttr(file + ":" + lc);
        const safeName = escapeAttr(tagName);
        out +=
          "<" +
          tagName +
          ' data-anyon-id="' +
          id +
          '" data-anyon-name="' +
          safeName +
          '"' +
          html.slice(nameEnd, end + 1);
      }

      i = end + 1;

      if (RAW_TEXT.has(lowerTag)) {
        const closeStart = lowerHtml.indexOf("</" + lowerTag, i);
        if (closeStart === -1) {
          out += html.slice(i);
          break;
        }
        out += html.slice(i, closeStart);
        i = closeStart;
      }
    }

    return out;
  }

  return {
    name: "vite-plugin-anyon-html-tagger",
    apply: "serve",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const file =
          typeof ctx?.filename === "string" && ctx.filename.length > 0
            ? path.relative(process.cwd(), ctx.filename)
            : "index.html";
        return tagHtml(html, file);
      },
    },
  };
}`.trim();

async function scaffoldViteForHtmlProject(appPath: string): Promise<void> {
  logger.info("Scaffolding Vite for HTML-only project", { appPath });

  const packageJsonPath = path.join(appPath, "package.json");
  const viteConfigJsPath = path.join(appPath, "vite.config.js");
  const hasExistingViteConfig =
    fs.existsSync(viteConfigJsPath) ||
    fs.existsSync(path.join(appPath, "vite.config.ts"));

  const packageJson = {
    name: sanitizePackageName(path.basename(appPath)),
    private: true,
    type: "module",
    scripts: {
      dev: "vite",
    },
    devDependencies: {
      vite: "^6.0.0",
    },
  };

  await fsPromises.writeFile(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`,
  );

  const viteConfig = `import { defineConfig } from "vite";
import path from "node:path";

${VITE_HTML_TAGGER_PLUGIN}

export default defineConfig({
  plugins: [anyonHtmlTagger()],
});
`;

  if (!hasExistingViteConfig) {
    await fsPromises.writeFile(viteConfigJsPath, viteConfig);
  }

  logger.info("Vite scaffold complete for HTML-only project", { appPath });
}

export async function learnAppProfile(
  appPath: string,
  appId: number,
): Promise<{ installCommand: string; startCommand: string }> {
  if (isHtmlOnlyProject(appPath)) {
    await scaffoldViteForHtmlProject(appPath);
  }

  const packageJson = readPackageJson(appPath);
  const packageManager = detectPackageManager(appPath);
  const framework = detectFramework(packageJson);
  const installCommand = composeInstallCommand(packageManager);
  const startCommand = composeStartCommand(
    packageManager,
    framework,
    packageJson.scripts as Record<string, string> | undefined,
  );

  logger.info("Detected package manager", { packageManager, appId, appPath });
  logger.info("Detected framework", {
    framework: framework?.name ?? null,
    appId,
  });
  logger.info("Composed profile commands", {
    installCommand,
    startCommand,
    appId,
  });

  await db
    .update(apps)
    .set({
      installCommand,
      startCommand,
      profileLearned: true,
      profileSource: "detected",
    })
    .where(eq(apps.id, appId));

  return { installCommand, startCommand };
}
