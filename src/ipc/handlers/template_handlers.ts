import log from "electron-log";
import { templateContracts } from "../types/templates";
import {
  fetchTemplateContent,
  fetchTemplateRegistry,
} from "../utils/template_utils";
import { createTypedHandler } from "./base";

const logger = log.scope("template_handlers");

export function registerTemplateHandlers() {
  createTypedHandler(templateContracts.getTemplates, async () => {
    try {
      return await fetchTemplateRegistry();
    } catch (error) {
      logger.error("Error fetching template registry:", error);
      return { version: 1, categories: [], templates: [] };
    }
  });

  createTypedHandler(
    templateContracts.getTemplateContent,
    async (_, { templatePath }) => {
      const html = await fetchTemplateContent(templatePath);
      return { html };
    },
  );
}
