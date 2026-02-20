import log from "electron-log";
import type { Template, TemplateRegistry } from "../../shared/templates";

const logger = log.scope("template_utils");

const TEMPLATE_REPO_OWNER = "SL-IT-AMAZING";
const TEMPLATE_REPO_NAME = "SLIT-ANYON";
const TEMPLATE_BRANCH = "main";
const REGISTRY_PATH = "templates/registry.json";

let registryCache: TemplateRegistry | null = null;
let registryFetchPromise: Promise<TemplateRegistry> | null = null;

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
      logger.error("Failed to fetch template registry:", error);
      registryFetchPromise = null;
      return { version: 1, categories: [], templates: [] };
    }
  })();

  return registryFetchPromise;
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
