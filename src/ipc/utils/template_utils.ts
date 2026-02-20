import path from "node:path";
import { app } from "electron";
import log from "electron-log";
import fs from "fs-extra";
import type { Template, TemplateRegistry } from "../../shared/templates";

const logger = log.scope("template_utils");

const TEMPLATE_REPO_OWNER = "SL-IT-AMAZING";
const TEMPLATE_REPO_NAME = "SLIT-ANYON";
const TEMPLATE_BRANCH = "main";
const REGISTRY_PATH = "templates/registry.json";

let registryCache: TemplateRegistry | null = null;
let registryFetchPromise: Promise<TemplateRegistry> | null = null;
const templateContentCache = new Map<string, string>();

function getLocalRegistryPath(): string {
  return path.join(app.getAppPath(), "templates", "registry.json");
}

function getLocalTemplateHtmlPath(templatePath: string): string {
  return path.join(app.getAppPath(), "templates", templatePath, "index.html");
}

function getLocalTemplatePreviewHtmlPath(templatePath: string): string {
  return path.join(
    app.getAppPath(),
    "templates",
    templatePath,
    "preview",
    "index.html",
  );
}

async function fetchLocalTemplateRegistry(): Promise<TemplateRegistry> {
  const localRegistryPath = getLocalRegistryPath();
  logger.info(`Falling back to local template registry: ${localRegistryPath}`);
  return (await fs.readJson(localRegistryPath)) as TemplateRegistry;
}

export function getRegistryRawUrl(): string {
  return `https://raw.githubusercontent.com/${TEMPLATE_REPO_OWNER}/${TEMPLATE_REPO_NAME}/${TEMPLATE_BRANCH}/${REGISTRY_PATH}`;
}

export function getTemplateRepoUrl(): string {
  return `https://github.com/${TEMPLATE_REPO_OWNER}/${TEMPLATE_REPO_NAME}.git`;
}

export async function fetchTemplateRegistry(): Promise<TemplateRegistry> {
  if (registryCache) {
    return registryCache;
  }

  if (registryFetchPromise) {
    return registryFetchPromise;
  }

  registryFetchPromise = (async (): Promise<TemplateRegistry> => {
    try {
      const url = getRegistryRawUrl();
      logger.info(`Fetching template registry from ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch registry: ${response.status} ${response.statusText}`,
        );
      }

      const registry: TemplateRegistry = await response.json();
      registryCache = registry;
      return registry;
    } catch (error) {
      logger.error("Failed to fetch template registry from GitHub:", error);
      try {
        const localRegistry = await fetchLocalTemplateRegistry();
        registryCache = localRegistry;
        return localRegistry;
      } catch (localError) {
        logger.error(
          "Failed to fetch template registry from local filesystem:",
          localError,
        );
        registryFetchPromise = null;
        return { version: 1, categories: [], templates: [] };
      }
    }
  })();

  return registryFetchPromise;
}

/**
 * Fetches template HTML content, trying preview/index.html first (for pre-built
 * Next.js/Vite templates), then falling back to index.html (for plain HTML templates).
 * Each path is tried via GitHub first, then local filesystem.
 */
export async function fetchTemplateContent(
  templatePath: string,
): Promise<string> {
  const cached = templateContentCache.get(templatePath);
  if (cached !== undefined) {
    return cached;
  }

  // Try preview/index.html first (pre-built Next.js/Vite templates)
  const previewGithubUrl = `https://raw.githubusercontent.com/${TEMPLATE_REPO_OWNER}/${TEMPLATE_REPO_NAME}/${TEMPLATE_BRANCH}/templates/${templatePath}/preview/index.html`;

  try {
    logger.info(`Fetching template preview HTML from ${previewGithubUrl}`);
    const response = await fetch(previewGithubUrl);

    if (response.ok) {
      const html = await response.text();
      templateContentCache.set(templatePath, html);
      return html;
    }
  } catch {
    logger.debug(
      `No preview HTML on GitHub for ${templatePath}, trying local preview`,
    );
  }

  try {
    const localPreviewPath = getLocalTemplatePreviewHtmlPath(templatePath);
    const html = await fs.readFile(localPreviewPath, "utf8");
    logger.info(`Loaded local preview HTML: ${localPreviewPath}`);
    templateContentCache.set(templatePath, html);
    return html;
  } catch {
    logger.debug(
      `No local preview HTML for ${templatePath}, trying index.html`,
    );
  }

  // Fall back to index.html (plain HTML templates)
  const githubUrl = `https://raw.githubusercontent.com/${TEMPLATE_REPO_OWNER}/${TEMPLATE_REPO_NAME}/${TEMPLATE_BRANCH}/templates/${templatePath}/index.html`;

  try {
    logger.info(`Fetching template HTML from ${githubUrl}`);
    const response = await fetch(githubUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch template HTML: ${response.status} ${response.statusText}`,
      );
    }

    const html = await response.text();
    templateContentCache.set(templatePath, html);
    return html;
  } catch (error) {
    logger.error(
      `Failed to fetch template HTML from GitHub (${templatePath}):`,
      error,
    );
  }

  try {
    const localHtmlPath = getLocalTemplateHtmlPath(templatePath);
    logger.info(`Falling back to local template HTML: ${localHtmlPath}`);
    const html = await fs.readFile(localHtmlPath, "utf8");
    templateContentCache.set(templatePath, html);
    return html;
  } catch (localError) {
    logger.error(
      `Failed to fetch template HTML from local filesystem (${templatePath}):`,
      localError,
    );
  }

  templateContentCache.set(templatePath, "");
  return "";
}

export async function getMarketTemplateOrThrow(
  templateId: string,
): Promise<Template> {
  const registry = await fetchTemplateRegistry();
  const template = registry.templates.find((t) => t.id === templateId);

  if (!template) {
    throw new Error(
      `Template ${templateId} not found. Please select a different template.`,
    );
  }

  return template;
}
