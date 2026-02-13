import fs from "node:fs";
import { z } from "zod";
import log from "electron-log";
import { ToolDefinition, AgentContext, escapeXmlAttr } from "./types";
import { safeJoin } from "@/ipc/utils/path_utils";
import { gitRemove } from "@/ipc/utils/git_utils";
import {
  deleteSupabaseFunction,
  deploySupabaseFunction,
} from "../../../../../../supabase_admin/supabase_management_client";
import {
  extractFunctionNameFromPath,
  isServerFunction,
  isSharedServerModule,
} from "../../../../../../supabase_admin/supabase_utils";

const logger = log.scope("delete_file");

function normalizePath(input: string): string {
  return input.replace(/\\/g, "/").replace(/\/+$/, "");
}

function isFunctionDirectoryPath(input: string): boolean {
  return /^supabase\/functions\/[^/]+$/.test(normalizePath(input));
}

function isFunctionEntrypointPath(input: string): boolean {
  return /^supabase\/functions\/[^/]+\/index\.ts$/.test(normalizePath(input));
}

const deleteFileSchema = z.object({
  path: z.string().describe("The file path to delete"),
});

export const deleteFileTool: ToolDefinition<z.infer<typeof deleteFileSchema>> =
  {
    name: "delete_file",
    description: "Delete a file from the codebase",
    inputSchema: deleteFileSchema,
    modifiesState: true,

    getConsentPreview: (args) => `Delete ${args.path}`,

    buildXml: (args, _isComplete) => {
      if (!args.path) return undefined;
      return `<anyon-delete path="${escapeXmlAttr(args.path)}"></anyon-delete>`;
    },

    execute: async (args, ctx: AgentContext) => {
      const fullFilePath = safeJoin(ctx.appPath, args.path);

      // Track if this is a shared module
      if (isSharedServerModule(args.path)) {
        ctx.isSharedModulesChanged = true;
      }

      if (fs.existsSync(fullFilePath)) {
        if (fs.lstatSync(fullFilePath).isDirectory()) {
          fs.rmdirSync(fullFilePath, { recursive: true });
        } else {
          fs.unlinkSync(fullFilePath);
        }
        logger.log(`Successfully deleted file: ${fullFilePath}`);

        // Remove from git
        try {
          await gitRemove({ path: ctx.appPath, filepath: args.path });
        } catch (error) {
          logger.warn(`Failed to git remove deleted file ${args.path}:`, error);
        }

        if (ctx.supabaseProjectId && isServerFunction(args.path)) {
          const functionName = extractFunctionNameFromPath(args.path);
          const shouldDeleteFunction =
            isFunctionDirectoryPath(args.path) ||
            isFunctionEntrypointPath(args.path);

          try {
            if (shouldDeleteFunction) {
              await deleteSupabaseFunction({
                supabaseProjectId: ctx.supabaseProjectId,
                functionName,
                organizationSlug: ctx.supabaseOrganizationSlug ?? null,
              });
            } else {
              await deploySupabaseFunction({
                supabaseProjectId: ctx.supabaseProjectId,
                functionName,
                appPath: ctx.appPath,
                organizationSlug: ctx.supabaseOrganizationSlug ?? null,
              });
            }
          } catch (error) {
            return shouldDeleteFunction
              ? `File deleted, but failed to delete Supabase function: ${error}`
              : `File deleted, but failed to redeploy Supabase function: ${error}`;
          }
        }
      } else {
        logger.warn(`File to delete does not exist: ${fullFilePath}`);
      }

      return `Successfully deleted ${args.path}`;
    },
  };
