import path from "node:path";
import { DESIGN_SYSTEMS } from "@/shared/designSystems";
import { DEFAULT_TEMPLATE_ID } from "@/shared/templates";
import { TWEAKCN_THEMES } from "@/shared/tweakcnThemes";
import { app } from "electron";
import log from "electron-log";
import fs from "fs-extra";
import { copyDirectoryRecursive } from "../utils/file_utils";
import { getCurrentCommitHash, gitClone } from "../utils/git_utils";
import {
  getMarketTemplateOrThrow,
  getTemplateRepoUrl,
} from "../utils/template_utils";

const logger = log.scope("createFromTemplate");

export async function createFromTemplate({
  fullAppPath,
  templateId = DEFAULT_TEMPLATE_ID,
  designSystemId,
  tweakcnThemeId,
}: {
  fullAppPath: string;
  templateId?: string;
  designSystemId?: string;
  tweakcnThemeId?: string;
}) {
  // Marketplace templates take priority over design system scaffolds.
  // These are pre-built HTML/CSS/JS templates that don't use React design systems.
  const isBuiltinScaffold = templateId === "react" || templateId === "next";

  if (!isBuiltinScaffold && templateId !== DEFAULT_TEMPLATE_ID) {
    const template = await getMarketTemplateOrThrow(templateId);
    const repoCachePath = await cloneRepo(getTemplateRepoUrl());
    const templateSourcePath = path.join(
      repoCachePath,
      "templates",
      template.path,
    );

    if (!fs.existsSync(templateSourcePath)) {
      throw new Error(
        `Template directory not found: templates/${template.path}`,
      );
    }

    await copyRepoToApp(templateSourcePath, fullAppPath);
    return;
  }

  if (designSystemId) {
    const designSystem = DESIGN_SYSTEMS.find((ds) => ds.id === designSystemId);
    if (!designSystem) {
      throw new Error(`Unknown design system: ${designSystemId}`);
    }
    const scaffoldPath = path.join(
      __dirname,
      "..",
      "..",
      designSystem.scaffoldDir,
    );
    if (!fs.existsSync(scaffoldPath)) {
      throw new Error(
        `Scaffold directory not found for design system: ${designSystemId}`,
      );
    }
    await copyDirectoryRecursive(scaffoldPath, fullAppPath);

    if (tweakcnThemeId) {
      await applyTweakcnThemeToScaffoldApp({ fullAppPath, tweakcnThemeId });
    }

    return;
  }

  if (templateId === "react") {
    await copyDirectoryRecursive(
      path.join(__dirname, "..", "..", "scaffold"),
      fullAppPath,
    );
    return;
  }

  if (templateId === "next") {
    await copyDirectoryRecursive(
      path.join(__dirname, "..", "..", "scaffold-nextjs"),
      fullAppPath,
    );
    return;
  }
}

const SCAFFOLD_VAR_NAME_MAP: Record<string, string> = {
  sidebar: "sidebar-background",
};

function mapThemeVarNameToScaffoldVarName(themeVarName: string): string {
  return SCAFFOLD_VAR_NAME_MAP[themeVarName] ?? themeVarName;
}

function buildCssVarLines(vars: Record<string, string>): string[] {
  return Object.entries(vars).map(([rawName, value]) => {
    const mappedName = mapThemeVarNameToScaffoldVarName(rawName);
    return `    --${mappedName}: ${value};`;
  });
}

function replaceCssBlock(
  inputCss: string,
  selector: string,
  replacementLines: string[],
): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRegex = new RegExp(
    `(${escapedSelector}\\s*\\{)([\\s\\S]*?)(\\n\\s*\\})`,
    "m",
  );

  if (!blockRegex.test(inputCss)) {
    throw new Error(`Could not find CSS block for selector: ${selector}`);
  }

  return inputCss.replace(blockRegex, (_match, open, _inner, close) => {
    const replacementBody = `\n${replacementLines.join("\n")}`;
    return `${open}${replacementBody}${close}`;
  });
}

async function applyTweakcnThemeToScaffoldApp({
  fullAppPath,
  tweakcnThemeId,
}: {
  fullAppPath: string;
  tweakcnThemeId: string;
}): Promise<void> {
  const theme = TWEAKCN_THEMES.find((item) => item.id === tweakcnThemeId);
  if (!theme) {
    throw new Error(`Unknown tweakcn theme: ${tweakcnThemeId}`);
  }

  const globalsCssPath = path.join(fullAppPath, "src", "globals.css");
  if (!fs.existsSync(globalsCssPath)) {
    throw new Error(
      `globals.css not found in scaffold output: ${globalsCssPath}`,
    );
  }

  const currentGlobalsCss = await fs.readFile(globalsCssPath, "utf8");
  const nextGlobalsCss = replaceCssBlock(
    replaceCssBlock(
      currentGlobalsCss,
      ":root",
      buildCssVarLines(theme.cssVars.light),
    ),
    ".dark",
    buildCssVarLines(theme.cssVars.dark),
  );
  await fs.writeFile(globalsCssPath, nextGlobalsCss, "utf8");

  const tailwindConfigPath = path.join(fullAppPath, "tailwind.config.ts");
  if (!fs.existsSync(tailwindConfigPath)) {
    throw new Error(
      `tailwind.config.ts not found in scaffold output: ${tailwindConfigPath}`,
    );
  }

  const currentTailwindConfig = await fs.readFile(tailwindConfigPath, "utf8");
  const nextTailwindConfig = currentTailwindConfig.replace(
    /hsl\(var\(--([^)]+)\)\)/g,
    "var(--$1)",
  );
  await fs.writeFile(tailwindConfigPath, nextTailwindConfig, "utf8");
}

async function cloneRepo(repoUrl: string): Promise<string> {
  const url = new URL(repoUrl);
  if (url.protocol !== "https:") {
    throw new Error("Repository URL must use HTTPS.");
  }
  if (url.hostname !== "github.com") {
    throw new Error("Repository URL must be a github.com URL.");
  }

  // Pathname will be like "/org/repo" or "/org/repo.git"
  const pathParts = url.pathname.split("/").filter((part) => part.length > 0);

  if (pathParts.length !== 2) {
    throw new Error(
      "Invalid repository URL format. Expected 'https://github.com/org/repo'",
    );
  }

  const orgName = pathParts[0];
  const repoName = path.basename(pathParts[1], ".git"); // Remove .git suffix if present

  if (!orgName || !repoName) {
    // This case should ideally be caught by pathParts.length !== 2
    throw new Error(
      "Failed to parse organization or repository name from URL.",
    );
  }
  logger.info(`Parsed org: ${orgName}, repo: ${repoName} from ${repoUrl}`);

  const cachePath = path.join(
    app.getPath("userData"),
    "templates",
    orgName,
    repoName,
  );

  if (fs.existsSync(cachePath)) {
    try {
      logger.info(
        `Repo ${repoName} already exists in cache at ${cachePath}. Checking for updates.`,
      );

      // Construct GitHub API URL
      const apiUrl = `https://api.github.com/repos/${orgName}/${repoName}/commits/HEAD`;
      logger.info(`Fetching remote SHA from ${apiUrl}`);

      // Use native fetch instead of isomorphic-git http.request
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Anyon", // GitHub API requires this
          Accept: "application/vnd.github.v3+json",
        },
      });
      // Handle non-200 responses
      if (!response.ok) {
        throw new Error(
          `GitHub API request failed with status ${response.status}: ${response.statusText}`,
        );
      }
      // Parse JSON directly (fetch handles streaming internally)
      const commitData = await response.json();
      const remoteSha = commitData.sha;
      if (!remoteSha) {
        throw new Error("SHA not found in GitHub API response.");
      }

      logger.info(`Successfully fetched remote SHA: ${remoteSha}`);

      // Compare with local SHA
      const localSha = await getCurrentCommitHash({ path: cachePath });

      if (remoteSha === localSha) {
        logger.info(
          `Local cache for ${repoName} is up to date (SHA: ${localSha}). Skipping clone.`,
        );
        return cachePath;
      }

      logger.info(
        `Local cache for ${repoName} (SHA: ${localSha}) is outdated (Remote SHA: ${remoteSha}). Removing and re-cloning.`,
      );
      fs.rmSync(cachePath, { recursive: true, force: true });
    } catch (err) {
      logger.warn(
        `Error checking for updates for ${repoName} at ${cachePath}. Removing cache and re-cloning. Error: `,
        err,
      );
      fs.rmSync(cachePath, { recursive: true, force: true });
    }
  }

  fs.ensureDirSync(path.dirname(cachePath));

  logger.info(`Cloning ${repoUrl} to ${cachePath}`);
  try {
    await gitClone({ path: cachePath, url: repoUrl, depth: 1 });
    logger.info(`Successfully cloned ${repoUrl} to ${cachePath}`);
  } catch (err) {
    logger.error(`Failed to clone ${repoUrl} to ${cachePath}: `, err);
    throw err; // Re-throw the error after logging
  }
  return cachePath;
}

async function copyRepoToApp(repoCachePath: string, appPath: string) {
  logger.info(`Copying from ${repoCachePath} to ${appPath}`);
  try {
    await fs.copy(repoCachePath, appPath, {
      filter: (src, _dest) => {
        const excludedDirs = ["node_modules", ".git"];
        const relativeSrc = path.relative(repoCachePath, src);
        if (excludedDirs.includes(path.basename(relativeSrc))) {
          logger.info(`Excluding ${src} from copy`);
          return false;
        }
        return true;
      },
    });
    logger.info("Finished copying repository contents.");
  } catch (err) {
    logger.error(
      `Error copying repository from ${repoCachePath} to ${appPath}: `,
      err,
    );
    throw err; // Re-throw the error after logging
  }
}
