import fs from "node:fs";
import path from "node:path";
import { and, desc, eq, gt, gte } from "drizzle-orm";
import log from "electron-log";
import { db } from "../../db";
import { apps, messages } from "../../db/schema";
import { readSettings } from "../../main/settings";
import { getAnyonAppPath } from "../../paths/paths";
import { deployAllSupabaseFunctions } from "../../supabase_admin/supabase_utils";
import type { GitCommit } from "../git_types";
import { versionContracts } from "../types/version";
import {
  gitCheckout,
  gitCommit,
  gitCurrentBranch,
  gitLog,
  gitStageToRevert,
  isGitStatusClean,
} from "../utils/git_utils";
import { withLock } from "../utils/lock_utils";
import { createTypedHandler } from "./base";

const logger = log.scope("version_handlers");

export function registerVersionHandlers() {
  createTypedHandler(versionContracts.listVersions, async (_, params) => {
    const { appId } = params;
    const app = await db.query.apps.findFirst({
      where: eq(apps.id, appId),
    });

    if (!app) {
      return [];
    }

    const appPath = getAnyonAppPath(app.path);

    if (!fs.existsSync(path.join(appPath, ".git"))) {
      return [];
    }

    const commits = await gitLog({
      path: appPath,
      depth: 100_000,
    });

    return commits.map((commit: GitCommit) => ({
      oid: commit.oid,
      message: commit.commit.message,
      timestamp: commit.commit.author.timestamp,
    }));
  });

  createTypedHandler(versionContracts.getCurrentBranch, async (_, params) => {
    const { appId } = params;
    const app = await db.query.apps.findFirst({
      where: eq(apps.id, appId),
    });

    if (!app) {
      throw new Error("App not found");
    }

    const appPath = getAnyonAppPath(app.path);

    if (!fs.existsSync(path.join(appPath, ".git"))) {
      throw new Error("Not a git repository");
    }

    try {
      const currentBranch = await gitCurrentBranch({ path: appPath });

      return {
        branch: currentBranch || "<no-branch>",
      };
    } catch (error: any) {
      logger.error(`Error getting current branch for app ${appId}:`, error);
      throw new Error(`Failed to get current branch: ${error.message}`);
    }
  });

  createTypedHandler(versionContracts.revertVersion, async (_, params) => {
    const { appId, previousVersionId, currentChatMessageId } = params;
    return withLock(appId, async () => {
      const successMessage = "Restored version";
      let warningMessage = "";
      const app = await db.query.apps.findFirst({
        where: eq(apps.id, appId),
      });

      if (!app) {
        throw new Error("App not found");
      }

      const appPath = getAnyonAppPath(app.path);

      await gitCheckout({
        path: appPath,
        ref: "main",
      });

      await gitStageToRevert({
        path: appPath,
        targetOid: previousVersionId,
      });
      const isClean = await isGitStatusClean({ path: appPath });
      if (!isClean) {
        await gitCommit({
          path: appPath,
          message: `Reverted all changes back to version ${previousVersionId}`,
        });
      }

      if (currentChatMessageId) {
        const { chatId, messageId } = currentChatMessageId;

        const messagesToDelete = await db.query.messages.findMany({
          where: and(eq(messages.chatId, chatId), gte(messages.id, messageId)),
          orderBy: desc(messages.id),
        });

        logger.log(
          `Deleting ${messagesToDelete.length} messages (id >= ${messageId}) from chat ${chatId}`,
        );

        if (messagesToDelete.length > 0) {
          await db
            .delete(messages)
            .where(
              and(eq(messages.chatId, chatId), gte(messages.id, messageId)),
            );
        }
      } else {
        const messageWithCommit = await db.query.messages.findFirst({
          where: eq(messages.commitHash, previousVersionId),
          with: {
            chat: true,
          },
        });

        if (messageWithCommit) {
          const chatId = messageWithCommit.chatId;

          const messagesToDelete = await db.query.messages.findMany({
            where: and(
              eq(messages.chatId, chatId),
              gt(messages.id, messageWithCommit.id),
            ),
            orderBy: desc(messages.id),
          });

          logger.log(
            `Deleting ${messagesToDelete.length} messages after commit ${previousVersionId} from chat ${chatId}`,
          );

          if (messagesToDelete.length > 0) {
            await db
              .delete(messages)
              .where(
                and(
                  eq(messages.chatId, chatId),
                  gt(messages.id, messageWithCommit.id),
                ),
              );
          }
        }
      }

      if (app.supabaseProjectId) {
        try {
          logger.info(
            `Re-deploying all Supabase edge functions for app ${appId} after revert`,
          );
          const settings = readSettings();
          const deployErrors = await deployAllSupabaseFunctions({
            appPath,
            supabaseProjectId: app.supabaseProjectId,
            supabaseOrganizationSlug: app.supabaseOrganizationSlug ?? null,
            skipPruneEdgeFunctions: settings.skipPruneEdgeFunctions ?? false,
          });

          if (deployErrors.length > 0) {
            warningMessage += `Some Supabase functions failed to deploy after revert: ${deployErrors.join(", ")}`;
            logger.warn(warningMessage);
          } else {
            logger.info(
              `Successfully re-deployed all Supabase edge functions for app ${appId}`,
            );
          }
        } catch (error) {
          warningMessage += `Error re-deploying Supabase edge functions after revert: ${error}`;
          logger.warn(warningMessage);
        }
      }
      if (warningMessage) {
        return { warningMessage };
      }
      return { successMessage };
    });
  });

  createTypedHandler(versionContracts.checkoutVersion, async (_, params) => {
    const { appId, versionId: gitRef } = params;
    return withLock(appId, async () => {
      const app = await db.query.apps.findFirst({
        where: eq(apps.id, appId),
      });

      if (!app) {
        throw new Error("App not found");
      }

      const fullAppPath = getAnyonAppPath(app.path);
      await gitCheckout({
        path: fullAppPath,
        ref: gitRef,
      });
    });
  });
}
