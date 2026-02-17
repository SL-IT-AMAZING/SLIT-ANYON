import fs from "node:fs";
import { promises as fsPromises } from "node:fs";
import path from "node:path";
import type {
  AnalyseComponentParams,
  ApplyVisualEditingChangesParams,
} from "@/ipc/types";
import { safeJoin } from "@/ipc/utils/path_utils";
import { eq } from "drizzle-orm";
import { ipcMain } from "electron";
import { normalizePath } from "../../../../../shared/normalizePath";
import { db } from "../../../../db";
import { apps } from "../../../../db/schema";
import { gitAdd, gitCommit } from "../../../../ipc/utils/git_utils";
import { getAnyonAppPath } from "../../../../paths/paths";
import {
  extractClassPrefixes,
  stylesToTailwind,
} from "../../../../utils/style-utils";
import {
  analyzeComponent,
  transformContent,
} from "../../utils/visual_editing_utils";

export function registerVisualEditingHandlers() {
  ipcMain.handle(
    "apply-visual-editing-changes",
    async (_event, params: ApplyVisualEditingChangesParams) => {
      const { appId, changes } = params;
      try {
        if (changes.length === 0) return;

        // Get the app to find its path
        const app = await db.query.apps.findFirst({
          where: eq(apps.id, appId),
        });

        if (!app) {
          throw new Error(`App not found: ${appId}`);
        }

        const appPath = getAnyonAppPath(app.path);
        const fileChanges = new Map<
          string,
          Map<
            number,
            { classes: string[]; prefixes: string[]; textContent?: string }
          >
        >();

        // Group changes by file and line
        for (const change of changes) {
          if (!fileChanges.has(change.relativePath)) {
            fileChanges.set(change.relativePath, new Map());
          }
          const tailwindClasses = stylesToTailwind(change.styles);
          const changePrefixes = extractClassPrefixes(tailwindClasses);

          fileChanges.get(change.relativePath)!.set(change.lineNumber, {
            classes: tailwindClasses,
            prefixes: changePrefixes,
            ...(change.textContent !== undefined && {
              textContent: change.textContent,
            }),
          });
        }

        // Apply changes to each file
        for (const [relativePath, lineChanges] of fileChanges) {
          const normalizedRelativePath = normalizePath(relativePath);
          const filePath = safeJoin(appPath, normalizedRelativePath);
          const content = await fsPromises.readFile(filePath, "utf-8");
          const transformedContent = transformContent(content, lineChanges);
          await fsPromises.writeFile(filePath, transformedContent, "utf-8");
          // Check if git repository exists and commit the change
          if (fs.existsSync(path.join(appPath, ".git"))) {
            await gitAdd({
              path: appPath,
              filepath: normalizedRelativePath,
            });

            await gitCommit({
              path: appPath,
              message: `Updated ${normalizedRelativePath}`,
            });
          }
        }
      } catch (error) {
        throw new Error(`Failed to apply visual editing changes: ${error}`);
      }
    },
  );

  ipcMain.handle(
    "analyze-component",
    async (_event, analyseComponentParams: AnalyseComponentParams) => {
      const { appId, componentId } = analyseComponentParams;
      try {
        const parts = componentId.split(":");
        if (parts.length < 2) {
          return { isDynamic: false, hasStaticText: false };
        }

        if (parts.length >= 3) {
          parts.pop();
        }

        const lineStr = parts.pop();
        const filePath = parts.join(":");
        const line = Number.parseInt(lineStr ?? "", 10);

        if (!filePath || Number.isNaN(line)) {
          return { isDynamic: false, hasStaticText: false };
        }

        // Get the app to find its path
        const app = await db.query.apps.findFirst({
          where: eq(apps.id, appId),
        });

        if (!app) {
          throw new Error(`App not found: ${appId}`);
        }

        const appPath = getAnyonAppPath(app.path);
        const fullPath = safeJoin(appPath, filePath);
        const content = await fsPromises.readFile(fullPath, "utf-8");
        return analyzeComponent(content, line);
      } catch (error) {
        console.error("Failed to analyze component:", error);
        return { isDynamic: false, hasStaticText: false };
      }
    },
  );
}
