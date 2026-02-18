import fs from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { chats, messages } from "../../db/schema";
import { getAnyonAppPath } from "../../paths/paths";
import { safeJoin } from "../utils/path_utils";

import { readSettings } from "@/main/settings";
import log from "electron-log";
import type { UserSettings } from "../../lib/schemas";
import { applySearchReplace } from "../../pro/main/ipc/processors/search_replace_processor";
import {
  deleteSupabaseFunction,
  deploySupabaseFunction,
  executeSupabaseSql,
} from "../../supabase_admin/supabase_management_client";
import {
  deployAllSupabaseFunctions,
  extractFunctionNameFromPath,
  isServerFunction,
  isSharedServerModule,
} from "../../supabase_admin/supabase_utils";
import {
  getAnyonAddDependencyTags,
  getAnyonDeleteTags,
  getAnyonExecuteSqlTags,
  getAnyonRenameTags,
  getAnyonSearchReplaceTags,
  getAnyonWriteTags,
} from "../utils/anyon_tag_parser";
import { writeMigrationFile } from "../utils/file_utils";
import {
  getGitUncommittedFiles,
  gitAdd,
  gitAddAll,
  gitCommit,
  gitRemove,
} from "../utils/git_utils";
import { executeAddDependency } from "./executeAddDependency";

import { FileUploadsState } from "../utils/file_uploads_state";

const readFile = fs.promises.readFile;
const logger = log.scope("response_processor");

interface Output {
  message: string;
  error: unknown;
}

function normalizePath(input: string): string {
  return input.replace(/\\/g, "/").replace(/\/+$/, "");
}

function isFunctionDirectoryPath(input: string): boolean {
  return /^supabase\/functions\/[^/]+$/.test(normalizePath(input));
}

function isFunctionEntrypointPath(input: string): boolean {
  return /^supabase\/functions\/[^/]+\/index\.ts$/.test(normalizePath(input));
}

function shouldDeleteFunctionForPath(input: string): boolean {
  return isFunctionDirectoryPath(input) || isFunctionEntrypointPath(input);
}

function hasFunctionEntrypoint(appPath: string, functionName: string): boolean {
  const entrypointPath = path.join(
    appPath,
    "supabase",
    "functions",
    functionName,
    "index.ts",
  );
  return fs.existsSync(entrypointPath);
}

export async function dryRunSearchReplace({
  fullResponse,
  appPath,
}: {
  fullResponse: string;
  appPath: string;
}) {
  const issues: { filePath: string; error: string }[] = [];
  const anyonSearchReplaceTags = getAnyonSearchReplaceTags(fullResponse);
  for (const tag of anyonSearchReplaceTags) {
    const filePath = tag.path;
    const fullFilePath = safeJoin(appPath, filePath);
    try {
      if (!fs.existsSync(fullFilePath)) {
        issues.push({
          filePath,
          error: `Search-replace target file does not exist: ${filePath}`,
        });
        continue;
      }

      const original = await readFile(fullFilePath, "utf8");
      const result = applySearchReplace(original, tag.content);
      if (!result.success || typeof result.content !== "string") {
        issues.push({
          filePath,
          error:
            "Unable to apply search-replace to file because: " + result.error,
        });
        logger.warn(
          `Unable to apply search-replace to file ${filePath} because: ${result.error}. Original content:\n${original}\n Diff content:\n${tag.content}`,
        );
        continue;
      }
    } catch (error) {
      issues.push({
        filePath,
        error: error?.toString() ?? "Unknown error",
      });
    }
  }
  return issues;
}

export async function processFullResponseActions(
  fullResponse: string,
  chatId: number,
  {
    chatSummary,
    messageId,
  }: {
    chatSummary: string | undefined;
    messageId: number;
  },
): Promise<{
  updatedFiles?: boolean;
  error?: string;
  extraFiles?: string[];
  extraFilesError?: string;
}> {
  const fileUploadsState = FileUploadsState.getInstance();
  const fileUploadsMap = fileUploadsState.getFileUploadsForChat(chatId);
  fileUploadsState.clear(chatId);
  logger.log("processFullResponseActions for chatId", chatId);
  // Get the app associated with the chat
  const chatWithApp = await db.query.chats.findFirst({
    where: eq(chats.id, chatId),
    with: {
      app: true,
    },
  });
  if (!chatWithApp || !chatWithApp.app) {
    logger.error(`No app found for chat ID: ${chatId}`);
    return {};
  }

  const settings: UserSettings = readSettings();
  const appPath = getAnyonAppPath(chatWithApp.app.path);
  const writtenFiles: string[] = [];
  const renamedFiles: string[] = [];
  const deletedFiles: string[] = [];
  let hasChanges = false;
  // Track if any shared modules were modified
  let sharedModulesChanged = false;

  const warnings: Output[] = [];
  const errors: Output[] = [];

  try {
    // Extract all tags
    const anyonWriteTags = getAnyonWriteTags(fullResponse);
    const anyonRenameTags = getAnyonRenameTags(fullResponse);
    const anyonDeletePaths = getAnyonDeleteTags(fullResponse);
    const anyonAddDependencyPackages = getAnyonAddDependencyTags(fullResponse);
    const anyonExecuteSqlQueries = chatWithApp.app.supabaseProjectId
      ? getAnyonExecuteSqlTags(fullResponse)
      : [];

    const message = await db.query.messages.findFirst({
      where: and(
        eq(messages.id, messageId),
        eq(messages.role, "assistant"),
        eq(messages.chatId, chatId),
      ),
    });

    if (!message) {
      logger.error(`No message found for ID: ${messageId}`);
      return {};
    }

    // Handle SQL execution tags
    if (anyonExecuteSqlQueries.length > 0) {
      for (const query of anyonExecuteSqlQueries) {
        try {
          await executeSupabaseSql({
            supabaseProjectId: chatWithApp.app.supabaseProjectId!,
            query: query.content,
            organizationSlug: chatWithApp.app.supabaseOrganizationSlug ?? null,
          });

          // Only write migration file if SQL execution succeeded
          if (settings.enableSupabaseWriteSqlMigration) {
            try {
              const migrationFilePath = await writeMigrationFile(
                appPath,
                query.content,
                query.description,
              );
              writtenFiles.push(migrationFilePath);
            } catch (error) {
              errors.push({
                message: `Failed to write SQL migration file for: ${query.description}`,
                error: error,
              });
            }
          }
        } catch (error) {
          errors.push({
            message: `Failed to execute SQL query: ${query.content}`,
            error: error,
          });
        }
      }
      logger.log(`Executed ${anyonExecuteSqlQueries.length} SQL queries`);
    }

    // TODO: Handle add dependency tags
    if (anyonAddDependencyPackages.length > 0) {
      try {
        await executeAddDependency({
          packages: anyonAddDependencyPackages,
          message: message,
          appPath,
        });
      } catch (error) {
        errors.push({
          message: `Failed to add dependencies: ${anyonAddDependencyPackages.join(", ")}`,
          error: error,
        });
      }
      writtenFiles.push("package.json");
      const pnpmFilename = "pnpm-lock.yaml";
      if (fs.existsSync(safeJoin(appPath, pnpmFilename))) {
        writtenFiles.push(pnpmFilename);
      }
      const packageLockFilename = "package-lock.json";
      if (fs.existsSync(safeJoin(appPath, packageLockFilename))) {
        writtenFiles.push(packageLockFilename);
      }
    }

    //////////////////////
    // File operations //
    // Do it in this order:
    // 1. Deletes
    // 2. Renames
    // 3. Writes
    //
    // Why?
    // - Deleting first avoids path conflicts before the other operations.
    // - LLMs like to rename and then edit the same file.
    //////////////////////

    // Process all file deletions
    for (const filePath of anyonDeletePaths) {
      const fullFilePath = safeJoin(appPath, filePath);

      // Track if this is a shared module
      if (isSharedServerModule(filePath)) {
        sharedModulesChanged = true;
      }

      // Delete the file if it exists
      if (fs.existsSync(fullFilePath)) {
        if (fs.lstatSync(fullFilePath).isDirectory()) {
          fs.rmdirSync(fullFilePath, { recursive: true });
        } else {
          fs.unlinkSync(fullFilePath);
        }
        logger.log(`Successfully deleted file: ${fullFilePath}`);
        deletedFiles.push(filePath);

        // Remove the file from git
        try {
          await gitRemove({ path: appPath, filepath: filePath });
        } catch (error) {
          logger.warn(`Failed to git remove deleted file ${filePath}:`, error);
          // Continue even if remove fails as the file was still deleted
        }
      } else {
        logger.warn(`File to delete does not exist: ${fullFilePath}`);
      }
      if (isServerFunction(filePath)) {
        const functionName = extractFunctionNameFromPath(filePath);
        try {
          if (shouldDeleteFunctionForPath(filePath)) {
            await deleteSupabaseFunction({
              supabaseProjectId: chatWithApp.app.supabaseProjectId!,
              functionName,
              organizationSlug:
                chatWithApp.app.supabaseOrganizationSlug ?? null,
            });
          } else if (!sharedModulesChanged) {
            await deploySupabaseFunction({
              supabaseProjectId: chatWithApp.app.supabaseProjectId!,
              functionName,
              appPath,
              organizationSlug:
                chatWithApp.app.supabaseOrganizationSlug ?? null,
            });
          }
        } catch (error) {
          errors.push({
            message: shouldDeleteFunctionForPath(filePath)
              ? `Failed to delete Supabase function: ${filePath}`
              : `Failed to redeploy Supabase function after delete: ${filePath}`,
            error: error,
          });
        }
      }
    }

    // Process all file renames
    for (const tag of anyonRenameTags) {
      const fromPath = safeJoin(appPath, tag.from);
      const toPath = safeJoin(appPath, tag.to);

      // Track if this involves shared modules
      if (isSharedServerModule(tag.from) || isSharedServerModule(tag.to)) {
        sharedModulesChanged = true;
      }

      // Ensure target directory exists
      const dirPath = path.dirname(toPath);
      fs.mkdirSync(dirPath, { recursive: true });

      // Rename the file
      if (fs.existsSync(fromPath)) {
        fs.renameSync(fromPath, toPath);
        logger.log(`Successfully renamed file: ${fromPath} -> ${toPath}`);
        renamedFiles.push(tag.to);

        // Add the new file and remove the old one from git
        await gitAdd({ path: appPath, filepath: tag.to });
        try {
          await gitRemove({ path: appPath, filepath: tag.from });
        } catch (error) {
          logger.warn(`Failed to git remove old file ${tag.from}:`, error);
          // Continue even if remove fails as the file was still renamed
        }
      } else {
        logger.warn(`Source file for rename does not exist: ${fromPath}`);
      }
      const fromIsServerFunction = isServerFunction(tag.from);
      const toIsServerFunction = isServerFunction(tag.to);
      const fromFunctionName = fromIsServerFunction
        ? extractFunctionNameFromPath(tag.from)
        : undefined;
      const toFunctionName = toIsServerFunction
        ? extractFunctionNameFromPath(tag.to)
        : undefined;

      const shouldDeleteFromFunction =
        fromIsServerFunction && shouldDeleteFunctionForPath(tag.from);

      if (fromIsServerFunction) {
        try {
          if (shouldDeleteFromFunction) {
            await deleteSupabaseFunction({
              supabaseProjectId: chatWithApp.app.supabaseProjectId!,
              functionName: fromFunctionName!,
              organizationSlug:
                chatWithApp.app.supabaseOrganizationSlug ?? null,
            });
          } else if (
            !sharedModulesChanged &&
            (!toIsServerFunction || fromFunctionName !== toFunctionName)
          ) {
            await deploySupabaseFunction({
              supabaseProjectId: chatWithApp.app.supabaseProjectId!,
              functionName: fromFunctionName!,
              appPath,
              organizationSlug:
                chatWithApp.app.supabaseOrganizationSlug ?? null,
            });
          }
        } catch (error) {
          warnings.push({
            message: shouldDeleteFromFunction
              ? `Failed to delete Supabase function: ${tag.from} as part of renaming ${tag.from} to ${tag.to}`
              : `Failed to redeploy Supabase function: ${tag.from} after renaming ${tag.from} to ${tag.to}`,
            error: error,
          });
        }
      }
      if (toIsServerFunction && !sharedModulesChanged) {
        try {
          if (
            toFunctionName &&
            hasFunctionEntrypoint(appPath, toFunctionName)
          ) {
            await deploySupabaseFunction({
              supabaseProjectId: chatWithApp.app.supabaseProjectId!,
              functionName: toFunctionName,
              appPath,
              organizationSlug:
                chatWithApp.app.supabaseOrganizationSlug ?? null,
            });
          }
        } catch (error) {
          errors.push({
            message: `Failed to deploy Supabase function: ${tag.to} as part of renaming ${tag.from} to ${tag.to}`,
            error: error,
          });
        }
      }
    }

    // Process all search-replace edits
    const anyonSearchReplaceTags = getAnyonSearchReplaceTags(fullResponse);
    for (const tag of anyonSearchReplaceTags) {
      const filePath = tag.path;
      const fullFilePath = safeJoin(appPath, filePath);

      // Track if this is a shared module
      if (isSharedServerModule(filePath)) {
        sharedModulesChanged = true;
      }

      try {
        if (!fs.existsSync(fullFilePath)) {
          // Do not show warning to user because we already attempt to do a <anyon-write> tag to fix it.
          logger.warn(`Search-replace target file does not exist: ${filePath}`);
          continue;
        }
        const original = await readFile(fullFilePath, "utf8");
        const result = applySearchReplace(original, tag.content);
        if (!result.success || typeof result.content !== "string") {
          // Do not show warning to user because we already attempt to do a <anyon-write> and/or a subsequent <anyon-search-replace> tag to fix it.
          logger.warn(
            `Failed to apply search-replace to ${filePath}: ${result.error ?? "unknown"}`,
          );
          continue;
        }
        // Write modified content
        fs.writeFileSync(fullFilePath, result.content);
        writtenFiles.push(filePath);

        // If server function (not shared), redeploy (skip if shared modules changed)
        if (isServerFunction(filePath) && !sharedModulesChanged) {
          try {
            await deploySupabaseFunction({
              supabaseProjectId: chatWithApp.app.supabaseProjectId!,
              functionName: extractFunctionNameFromPath(filePath),
              appPath,
              organizationSlug:
                chatWithApp.app.supabaseOrganizationSlug ?? null,
            });
          } catch (error) {
            errors.push({
              message: `Failed to deploy Supabase function after search-replace: ${filePath}`,
              error: error,
            });
          }
        }
      } catch (error) {
        errors.push({
          message: `Error applying search-replace to ${filePath}`,
          error: error,
        });
      }
    }

    // Process all file writes
    for (const tag of anyonWriteTags) {
      const filePath = tag.path;
      let content: string | Buffer = tag.content;
      const fullFilePath = safeJoin(appPath, filePath);

      // Track if this is a shared module
      if (isSharedServerModule(filePath)) {
        sharedModulesChanged = true;
      }

      // Check if content (stripped of whitespace) exactly matches a file ID and replace with actual file content
      if (fileUploadsMap) {
        const trimmedContent = tag.content.trim();
        const fileInfo = fileUploadsMap.get(trimmedContent);
        if (fileInfo) {
          try {
            const fileContent = await readFile(fileInfo.filePath);
            content = fileContent;
            logger.log(
              `Replaced file ID ${trimmedContent} with content from ${fileInfo.originalName}`,
            );
          } catch (error) {
            logger.error(
              `Failed to read uploaded file ${fileInfo.originalName}:`,
              error,
            );
            errors.push({
              message: `Failed to read uploaded file: ${fileInfo.originalName}`,
              error: error,
            });
          }
        }
      }

      // Ensure directory exists
      const dirPath = path.dirname(fullFilePath);
      fs.mkdirSync(dirPath, { recursive: true });

      // Write file content
      fs.writeFileSync(fullFilePath, content);
      logger.log(`Successfully wrote file: ${fullFilePath}`);
      writtenFiles.push(filePath);
      // Deploy individual function (skip if shared modules changed - will be handled later)
      if (
        isServerFunction(filePath) &&
        typeof content === "string" &&
        !sharedModulesChanged
      ) {
        try {
          await deploySupabaseFunction({
            supabaseProjectId: chatWithApp.app.supabaseProjectId!,
            functionName: extractFunctionNameFromPath(filePath),
            appPath,
            organizationSlug: chatWithApp.app.supabaseOrganizationSlug ?? null,
          });
        } catch (error) {
          errors.push({
            message: `Failed to deploy Supabase function: ${filePath}`,
            error: error,
          });
        }
      }
    }

    // If shared modules changed, redeploy all functions
    if (sharedModulesChanged && chatWithApp.app.supabaseProjectId) {
      try {
        logger.info(
          "Shared modules changed, redeploying all Supabase functions",
        );
        const settings = readSettings();
        const deployErrors = await deployAllSupabaseFunctions({
          appPath,
          supabaseProjectId: chatWithApp.app.supabaseProjectId,
          supabaseOrganizationSlug:
            chatWithApp.app.supabaseOrganizationSlug ?? null,
          skipPruneEdgeFunctions: settings.skipPruneEdgeFunctions ?? false,
        });
        if (deployErrors.length > 0) {
          for (const err of deployErrors) {
            errors.push({
              message:
                "Failed to deploy Supabase function after shared module change",
              error: err,
            });
          }
        }
      } catch (error) {
        errors.push({
          message:
            "Failed to redeploy all Supabase functions after shared module change",
          error: error,
        });
      }
    }

    // If we have any file changes, commit them all at once
    hasChanges =
      writtenFiles.length > 0 ||
      renamedFiles.length > 0 ||
      deletedFiles.length > 0 ||
      anyonAddDependencyPackages.length > 0;

    let uncommittedFiles: string[] = [];
    let extraFilesError: string | undefined;

    if (hasChanges) {
      // Stage all written files
      for (const file of writtenFiles) {
        await gitAdd({ path: appPath, filepath: file });
      }

      // Create commit with details of all changes
      const changes = [];
      if (writtenFiles.length > 0)
        changes.push(`wrote ${writtenFiles.length} file(s)`);
      if (renamedFiles.length > 0)
        changes.push(`renamed ${renamedFiles.length} file(s)`);
      if (deletedFiles.length > 0)
        changes.push(`deleted ${deletedFiles.length} file(s)`);
      if (anyonAddDependencyPackages.length > 0)
        changes.push(
          `added ${anyonAddDependencyPackages.join(", ")} package(s)`,
        );
      if (anyonExecuteSqlQueries.length > 0)
        changes.push(`executed ${anyonExecuteSqlQueries.length} SQL queries`);

      const message = chatSummary
        ? `[anyon] ${chatSummary} - ${changes.join(", ")}`
        : `[anyon] ${changes.join(", ")}`;
      // Use chat summary, if provided, or default for commit message
      let commitHash = await gitCommit({
        path: appPath,
        message,
      });
      logger.log(`Successfully committed changes: ${changes.join(", ")}`);

      // Check for any uncommitted changes after the commit
      uncommittedFiles = await getGitUncommittedFiles({ path: appPath });

      if (uncommittedFiles.length > 0) {
        // Stage all changes
        await gitAddAll({ path: appPath });
        try {
          commitHash = await gitCommit({
            path: appPath,
            message: message + " + extra files edited outside of Anyon",
            amend: true,
          });
          logger.log(
            `Amend commit with changes outside of anyon: ${uncommittedFiles.join(", ")}`,
          );
        } catch (error) {
          // Just log, but don't throw an error because the user can still
          // commit these changes outside of Anyon if needed.
          logger.error(
            `Failed to commit changes outside of anyon: ${uncommittedFiles.join(", ")}`,
          );
          extraFilesError = (error as any).toString();
        }
      }

      // Save the commit hash to the message
      await db
        .update(messages)
        .set({
          commitHash: commitHash,
        })
        .where(eq(messages.id, messageId));
    }
    logger.log("mark as approved: hasChanges", hasChanges);
    // Update the message to approved
    await db
      .update(messages)
      .set({
        approvalState: "approved",
      })
      .where(eq(messages.id, messageId));

    return {
      updatedFiles: hasChanges,
      extraFiles: uncommittedFiles.length > 0 ? uncommittedFiles : undefined,
      extraFilesError,
    };
  } catch (error: unknown) {
    logger.error("Error processing files:", error);
    return { error: (error as any).toString() };
  } finally {
    const appendedContent = `
    ${warnings
      .map(
        (warning) =>
          `<anyon-output type="warning" message="${warning.message}">${warning.error}</anyon-output>`,
      )
      .join("\n")}
    ${errors
      .map(
        (error) =>
          `<anyon-output type="error" message="${error.message}">${error.error}</anyon-output>`,
      )
      .join("\n")}
    `;
    if (appendedContent.length > 0) {
      await db
        .update(messages)
        .set({
          content: fullResponse + "\n\n" + appendedContent,
        })
        .where(eq(messages.id, messageId));
    }
  }
}
