import { eq, sql } from "drizzle-orm";
import log from "electron-log";
import { db } from "../../db";
import { apps } from "../../db/schema";
import { type Theme, themesData } from "../../shared/themes";
import { templateContracts } from "../types/templates";
import type { GetAppThemeParams, SetAppThemeParams } from "../types/templates";
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

  createTypedHandler(
    templateContracts.getThemes,
    async (): Promise<Theme[]> => {
      return themesData;
    },
  );

  createTypedHandler(
    templateContracts.setAppTheme,
    async (_, params: SetAppThemeParams): Promise<void> => {
      const { appId, themeId } = params;
      if (!themeId) {
        await db
          .update(apps)
          .set({ themeId: sql`NULL` })
          .where(eq(apps.id, appId));
      } else {
        await db.update(apps).set({ themeId }).where(eq(apps.id, appId));
      }
    },
  );

  createTypedHandler(
    templateContracts.getAppTheme,
    async (_, params: GetAppThemeParams): Promise<string | null> => {
      const app = await db.query.apps.findFirst({
        where: eq(apps.id, params.appId),
        columns: { themeId: true },
      });
      return app?.themeId ?? null;
    },
  );
}
