import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { AppUpgrade } from "@/ipc/types";
import { eq } from "drizzle-orm";
import log from "electron-log";
import { db } from "../../db";
import { apps } from "../../db/schema";
import { getAnyonAppPath } from "../../paths/paths";
import { gitAddAll, gitCommit } from "../utils/git_utils";
import { simpleSpawn } from "../utils/simpleSpawn";
import { createLoggedHandler } from "./safe_handle";

export const logger = log.scope("app_upgrade_handlers");
const handle = createLoggedHandler(logger);

const availableUpgrades: Omit<AppUpgrade, "isNeeded">[] = [
  {
    id: "component-tagger",
    title: "Enable select component to edit",
    description:
      "Installs the Anyon component tagger for Vite and Next.js apps.",
    manualUpgradeUrl: "https://docs.any-on.dev/upgrades/select-component",
  },
  {
    id: "capacitor",
    title: "Upgrade to hybrid mobile app with Capacitor",
    description:
      "Adds Capacitor to your app lets it run on iOS and Android in addition to the web.",
    manualUpgradeUrl:
      "https://docs.any-on.dev/guides/mobile-app#upgrade-your-app",
  },
];

async function getApp(appId: number) {
  const app = await db.query.apps.findFirst({
    where: eq(apps.id, appId),
  });
  if (!app) {
    throw new Error(`App with id ${appId} not found`);
  }
  return app;
}

function isViteApp(appPath: string): boolean {
  return getViteConfigPath(appPath) !== null;
}

function getViteConfigPath(appPath: string): string | null {
  const viteConfigPathJs = path.join(appPath, "vite.config.js");
  const viteConfigPathTs = path.join(appPath, "vite.config.ts");

  if (fs.existsSync(viteConfigPathTs)) {
    return viteConfigPathTs;
  }

  if (fs.existsSync(viteConfigPathJs)) {
    return viteConfigPathJs;
  }

  return null;
}

function getNextConfigPath(appPath: string): string | null {
  const nextConfigPathTs = path.join(appPath, "next.config.ts");
  const nextConfigPathJs = path.join(appPath, "next.config.js");
  const nextConfigPathMjs = path.join(appPath, "next.config.mjs");

  if (fs.existsSync(nextConfigPathTs)) {
    return nextConfigPathTs;
  }

  if (fs.existsSync(nextConfigPathJs)) {
    return nextConfigPathJs;
  }

  if (fs.existsSync(nextConfigPathMjs)) {
    return nextConfigPathMjs;
  }

  return null;
}

function isComponentTaggerUpgradeNeeded(appPath: string): boolean {
  const viteConfigPath = getViteConfigPath(appPath);
  if (viteConfigPath) {
    try {
      const viteConfigContent = fs.readFileSync(viteConfigPath, "utf-8");
      return !viteConfigContent.includes("anyon-component-tagger");
    } catch (e) {
      logger.error("Error reading vite config", e);
      return false;
    }
  }

  const nextConfigPath = getNextConfigPath(appPath);
  if (nextConfigPath) {
    try {
      const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");
      return !hasNextComponentTaggerConfig(nextConfigContent);
    } catch (e) {
      logger.error("Error reading next config", e);
      return false;
    }
  }

  return false;
}

export function hasNextComponentTaggerConfig(content: string): boolean {
  return /anyon-component-tagger|nextjs-webpack-component-tagger/.test(content);
}

function buildNextWebpackRuleBlock(
  configVar: string,
  useExpression: string,
): string {
  return `
    if (process.env.NODE_ENV === "development") {
      ${configVar}.module = ${configVar}.module || {};
      ${configVar}.module.rules = ${configVar}.module.rules || [];
      ${configVar}.module.rules.push({
        test: /\\.(jsx|tsx)$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: ${useExpression},
      });
    }
`;
}

function buildStandaloneNextWebpackConfig(useExpression: string): string {
  return `
  webpack: (config) => {
    if (process.env.NODE_ENV === "development") {
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /\\.(jsx|tsx)$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: ${useExpression},
      });
    }

    return config;
  },
`;
}

export function injectNextComponentTaggerToConfig(
  content: string,
  useExpression: string,
): string {
  if (hasNextComponentTaggerConfig(content)) {
    return content;
  }

  const existingWebpackPatterns = [
    /webpack\s*:\s*\(\s*([A-Za-z_$][\w$]*)[^)]*\)\s*=>\s*{/,
    /webpack\s*:\s*function\s*\(\s*([A-Za-z_$][\w$]*)[^)]*\)\s*{/,
    /webpack\s*\(\s*([A-Za-z_$][\w$]*)[^)]*\)\s*{/,
  ];

  for (const pattern of existingWebpackPatterns) {
    const match = pattern.exec(content);
    if (!match) {
      continue;
    }

    const configVar = match[1] || "config";
    const insertPos = match.index + match[0].length;

    return (
      content.slice(0, insertPos) +
      buildNextWebpackRuleBlock(configVar, useExpression) +
      content.slice(insertPos)
    );
  }

  const standaloneConfig = buildStandaloneNextWebpackConfig(useExpression);
  const configObjectPatterns = [
    /const\s+nextConfig[^=]*=\s*{/,
    /module\.exports\s*=\s*{/,
    /export\s+default\s*{/,
  ];

  for (const pattern of configObjectPatterns) {
    const match = pattern.exec(content);
    if (!match) {
      continue;
    }

    const insertPos = match.index + match[0].length;
    return (
      content.slice(0, insertPos) + standaloneConfig + content.slice(insertPos)
    );
  }

  throw new Error(
    "Could not automatically update Next.js config. Add the Anyon component tagger loader manually.",
  );
}

function isCapacitorUpgradeNeeded(appPath: string): boolean {
  // Check if it's a Vite app first
  if (!isViteApp(appPath)) {
    return false;
  }

  // Check if Capacitor is already installed
  const capacitorConfigJs = path.join(appPath, "capacitor.config.js");
  const capacitorConfigTs = path.join(appPath, "capacitor.config.ts");
  const capacitorConfigJson = path.join(appPath, "capacitor.config.json");

  // If any Capacitor config exists, the upgrade is not needed
  if (
    fs.existsSync(capacitorConfigJs) ||
    fs.existsSync(capacitorConfigTs) ||
    fs.existsSync(capacitorConfigJson)
  ) {
    return false;
  }

  return true;
}

const ANYON_TAGGER_PLUGIN_SOURCE = `import { parse } from "@babel/parser";
import MagicString from "magic-string";
import path from "node:path";
import { walk } from "estree-walker";

const VALID_EXTENSIONS = new Set([".jsx", ".tsx"]);

export default function anyonTagger() {
  return {
    name: "vite-plugin-anyon-tagger",
    apply: "serve",
    enforce: "pre",
    async transform(code, id) {
      try {
        if (!VALID_EXTENSIONS.has(path.extname(id)) || id.includes("node_modules"))
          return null;
        const ast = parse(code, { sourceType: "module", plugins: ["jsx", "typescript"] });
        const ms = new MagicString(code);
        const fileRelative = path.relative(process.cwd(), id);
        walk(ast, {
          enter(node) {
            try {
              if (node.type !== "JSXOpeningElement") return;
              if (node.name?.type !== "JSXIdentifier") return;
              const tagName = node.name.name;
              if (!tagName) return;
              const alreadyTagged = node.attributes?.some(
                (attr) => attr.type === "JSXAttribute" && attr.name?.name === "data-anyon-id"
              );
              if (alreadyTagged) return;
              const loc = node.loc?.start;
              if (!loc) return;
              const componentId = fileRelative + ":" + loc.line + ":" + loc.column;
              if (node.name.end != null) {
                ms.appendLeft(node.name.end, ' data-anyon-id="' + componentId + '" data-anyon-name="' + tagName + '"');
              }
            } catch (error) {
              console.warn("[anyon-tagger] Warning: Failed to process JSX node in " + id + ":", error);
            }
          },
        });
        if (ms.toString() === code) return null;
        return { code: ms.toString(), map: ms.generateMap({ hires: true }) };
      } catch (error) {
        console.warn("[anyon-tagger] Warning: Failed to transform " + id + ":", error);
        return null;
      }
    },
  };
}
`;

const ANYON_NEXT_TAGGER_LOADER_SOURCE = `import path from "node:path";
import { parse } from "@babel/parser";
import { walk } from "estree-walker";
import MagicString from "magic-string";

const VALID_EXTENSIONS = new Set([".jsx", ".tsx"]);

export default function anyonTaggerLoader(code) {
  const callback = this.async();

  const transform = async () => {
    try {
      if (
        !VALID_EXTENSIONS.has(path.extname(this.resourcePath)) ||
        this.resourcePath.includes("node_modules")
      ) {
        return null;
      }

      const ast = parse(code, {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
        sourceFilename: this.resourcePath,
      });

      const ms = new MagicString(code);
      const fileRelative = path.relative(this.rootContext, this.resourcePath);
      let transformCount = 0;

      walk(ast, {
        enter: (node) => {
          try {
            if (node.type !== "JSXOpeningElement") return;

            if (node.name?.type !== "JSXIdentifier") return;
            const tagName = node.name.name;
            if (!tagName) return;

            const alreadyTagged = node.attributes?.some(
              (attr) =>
                attr.type === "JSXAttribute" &&
                attr.name?.name === "data-anyon-id",
            );
            if (alreadyTagged) return;

            const loc = node.loc?.start;
            if (!loc) return;
            const componentId = fileRelative + ":" + loc.line + ":" + loc.column;

            if (node.name.end != null) {
              ms.appendLeft(
                node.name.end,
                ' data-anyon-id="' + componentId + '" data-anyon-name="' + tagName + '"',
              );
              transformCount++;
            }
          } catch (error) {
            console.warn(
              "[anyon-tagger] Warning: Failed to process JSX node in " + this.resourcePath + ":",
              error,
            );
          }
        },
      });

      if (transformCount === 0) {
        return null;
      }

      const transformedCode = ms.toString();
      return {
        code: transformedCode,
        map: ms.generateMap({ hires: true }),
      };
    } catch (error) {
      console.warn(
        "[anyon-tagger] Warning: Failed to transform " + this.resourcePath + ":",
        error,
      );
      return null;
    }
  };

  transform()
    .then((result) => {
      if (result) {
        callback(null, result.code, result.map);
      } else {
        callback(null, code);
      }
    })
    .catch((err) => {
      console.error("[anyon-tagger] ERROR in " + this.resourcePath + ":", err);
      callback(null, code);
    });
}
`;

function getNextLoaderUseExpression(nextConfigPath: string): string {
  if (nextConfigPath.endsWith(".mjs")) {
    return '"./plugins/anyon-component-tagger.mjs"';
  }

  return 'require.resolve("./plugins/anyon-component-tagger.mjs")';
}

async function installComponentTaggerDependencies(
  appPath: string,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    logger.info("Installing anyon-component-tagger dependencies");
    const child = spawn(
      'pnpm add -D "@babel/parser" "estree-walker@^2.0.2" "magic-string" || npm install --save-dev --legacy-peer-deps "@babel/parser" "estree-walker@^2.0.2" "magic-string"',
      {
        cwd: appPath,
        shell: true,
        stdio: "pipe",
      },
    );

    child.stdout?.on("data", (data) => logger.info(data.toString()));
    child.stderr?.on("data", (data) => logger.error(data.toString()));

    child.on("close", (code) => {
      if (code === 0) {
        logger.info("Component tagger dependencies installed successfully");
        resolve();
      } else {
        logger.error(`Failed to install dependencies, exit code ${code}`);
        reject(new Error("Failed to install component tagger dependencies"));
      }
    });

    child.on("error", (err) => {
      logger.error("Failed to spawn package manager", err);
      reject(err);
    });
  });
}

async function commitComponentTaggerChanges(appPath: string): Promise<void> {
  try {
    logger.info("Staging and committing changes");
    await gitAddAll({ path: appPath });
    await gitCommit({
      path: appPath,
      message: "[anyon] add Anyon component tagger",
    });
    logger.info("Successfully committed changes");
  } catch (err) {
    logger.warn(
      "Failed to commit changes. This may happen if the project is not in a git repository, or if there are no changes to commit.",
      err,
    );
  }
}

async function applyComponentTaggerForVite(
  appPath: string,
  viteConfigPath: string,
): Promise<void> {
  const pluginsDir = path.join(appPath, "plugins");
  await fs.promises.mkdir(pluginsDir, { recursive: true });

  const pluginExt = viteConfigPath.endsWith(".ts") ? ".ts" : ".js";
  const pluginFilePath = path.join(
    pluginsDir,
    `anyon-component-tagger${pluginExt}`,
  );
  await fs.promises.writeFile(pluginFilePath, ANYON_TAGGER_PLUGIN_SOURCE);
  logger.info("Created anyon-component-tagger plugin file");

  let content = await fs.promises.readFile(viteConfigPath, "utf-8");

  if (!content.includes("anyon-component-tagger")) {
    const lines = content.split("\n");
    let lastImportIndex = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith("import ")) {
        lastImportIndex = i;
        break;
      }
    }
    lines.splice(
      lastImportIndex + 1,
      0,
      'import anyonComponentTagger from "./plugins/anyon-component-tagger";',
    );
    content = lines.join("\n");
  }

  if (content.includes("plugins: [")) {
    if (!content.includes("anyonComponentTagger()")) {
      content = content.replace(
        "plugins: [",
        "plugins: [anyonComponentTagger(), ",
      );
    }
  } else {
    throw new Error(
      "Could not find `plugins: [` in vite config. Manual installation required.",
    );
  }

  await fs.promises.writeFile(viteConfigPath, content);
  await installComponentTaggerDependencies(appPath);
  await commitComponentTaggerChanges(appPath);
}

async function applyComponentTaggerForNext(
  appPath: string,
  nextConfigPath: string,
): Promise<void> {
  const pluginsDir = path.join(appPath, "plugins");
  await fs.promises.mkdir(pluginsDir, { recursive: true });

  const pluginFilePath = path.join(pluginsDir, "anyon-component-tagger.mjs");
  await fs.promises.writeFile(pluginFilePath, ANYON_NEXT_TAGGER_LOADER_SOURCE);
  logger.info("Created Next.js anyon-component-tagger loader file");

  const nextConfigContent = await fs.promises.readFile(nextConfigPath, "utf-8");
  const useExpression = getNextLoaderUseExpression(nextConfigPath);
  const updatedConfigContent = injectNextComponentTaggerToConfig(
    nextConfigContent,
    useExpression,
  );
  await fs.promises.writeFile(nextConfigPath, updatedConfigContent);

  await installComponentTaggerDependencies(appPath);
  await commitComponentTaggerChanges(appPath);
}

async function applyComponentTagger(appPath: string): Promise<void> {
  const viteConfigPath = getViteConfigPath(appPath);
  if (viteConfigPath) {
    await applyComponentTaggerForVite(appPath, viteConfigPath);
    return;
  }

  const nextConfigPath = getNextConfigPath(appPath);
  if (nextConfigPath) {
    await applyComponentTaggerForNext(appPath, nextConfigPath);
    return;
  }

  throw new Error(
    "Could not find vite.config or next.config. Manual installation required.",
  );
}

async function applyCapacitor({
  appName,
  appPath,
}: {
  appName: string;
  appPath: string;
}) {
  // Install Capacitor dependencies
  await simpleSpawn({
    command:
      "pnpm add @capacitor/core@7.4.4 @capacitor/cli@7.4.4 @capacitor/ios@7.4.4 @capacitor/android@7.4.4 || npm install @capacitor/core@7.4.4 @capacitor/cli@7.4.4 @capacitor/ios@7.4.4 @capacitor/android@7.4.4 --legacy-peer-deps",
    cwd: appPath,
    successMessage: "Capacitor dependencies installed successfully",
    errorPrefix: "Failed to install Capacitor dependencies",
  });

  // Initialize Capacitor
  await simpleSpawn({
    command: `npx cap init "${appName}" "com.example.${appName.toLowerCase().replace(/[^a-z0-9]/g, "")}" --web-dir=dist`,
    cwd: appPath,
    successMessage: "Capacitor initialized successfully",
    errorPrefix: "Failed to initialize Capacitor",
  });

  // Add iOS and Android platforms
  await simpleSpawn({
    command: "npx cap add ios && npx cap add android",
    cwd: appPath,
    successMessage: "iOS and Android platforms added successfully",
    errorPrefix: "Failed to add iOS and Android platforms",
  });

  // Commit changes
  try {
    logger.info("Staging and committing Capacitor changes");
    await gitAddAll({ path: appPath });
    await gitCommit({
      path: appPath,
      message: "[anyon] add Capacitor for mobile app support",
    });
    logger.info("Successfully committed Capacitor changes");
  } catch (err) {
    logger.warn(
      "Failed to commit changes. This may happen if the project is not in a git repository, or if there are no changes to commit.",
      err,
    );
    throw new Error(
      `Failed to commit Capacitor changes. Please commit them manually. Error: ${err}`,
    );
  }
}

export function registerAppUpgradeHandlers() {
  handle(
    "get-app-upgrades",
    async (_, { appId }: { appId: number }): Promise<AppUpgrade[]> => {
      const app = await getApp(appId);
      const appPath = getAnyonAppPath(app.path);

      const upgradesWithStatus = availableUpgrades.map((upgrade) => {
        let isNeeded = false;
        if (upgrade.id === "component-tagger") {
          isNeeded = isComponentTaggerUpgradeNeeded(appPath);
        } else if (upgrade.id === "capacitor") {
          isNeeded = isCapacitorUpgradeNeeded(appPath);
        }
        return { ...upgrade, isNeeded };
      });

      return upgradesWithStatus;
    },
  );

  handle(
    "execute-app-upgrade",
    async (_, { appId, upgradeId }: { appId: number; upgradeId: string }) => {
      if (!upgradeId) {
        throw new Error("upgradeId is required");
      }

      const app = await getApp(appId);
      const appPath = getAnyonAppPath(app.path);

      if (upgradeId === "component-tagger") {
        await applyComponentTagger(appPath);
      } else if (upgradeId === "capacitor") {
        await applyCapacitor({ appName: app.name, appPath });
      } else {
        throw new Error(`Unknown upgrade id: ${upgradeId}`);
      }
    },
  );
}
