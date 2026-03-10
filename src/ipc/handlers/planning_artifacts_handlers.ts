import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import log from "electron-log";
import { db } from "../../db";
import { apps } from "../../db/schema";
import { getAnyonAppPath } from "../../paths/paths";
import {
  type PlanningArtifactType,
  planningArtifactContracts,
} from "../types/planning_artifacts";
import { createTypedHandler } from "./base";
import {
  buildFrontmatter,
  ensureAnyonGitignored,
  parsePlanFile,
  slugify,
  validatePlanId,
} from "./planUtils";

const logger = log.scope("planning_artifacts_handlers");

const ARTIFACT_DIRECTORY_BY_TYPE: Record<PlanningArtifactType, string> = {
  draft: "drafts",
  founder_brief: "briefs",
  internal_build_spec: "specs",
  user_flow_spec: "flows",
};

async function getArtifactDir(
  appId: number,
  artifactType: PlanningArtifactType,
): Promise<string> {
  const app = await db.query.apps.findFirst({ where: eq(apps.id, appId) });
  if (!app) throw new Error("App not found");

  const appPath = getAnyonAppPath(app.path);
  const artifactDir = path.join(
    appPath,
    ".anyon",
    ARTIFACT_DIRECTORY_BY_TYPE[artifactType],
  );
  await fs.promises.mkdir(artifactDir, { recursive: true });
  await ensureAnyonGitignored(appPath);
  return artifactDir;
}

function toArtifactResult(params: {
  appId: number;
  artifactId: string;
  artifactType: PlanningArtifactType;
  meta: Record<string, string>;
  content: string;
}) {
  const { appId, artifactId, artifactType, meta, content } = params;
  const {
    title = "",
    summary = "",
    chatId,
    createdAt,
    updatedAt,
    ...metadata
  } = meta;

  if (!chatId) {
    throw new Error(`Artifact missing chatId: ${artifactId}`);
  }

  return {
    id: artifactId,
    appId,
    chatId: Number(chatId),
    artifactType,
    title,
    summary: summary || null,
    content,
    metadata,
    createdAt: createdAt ?? new Date().toISOString(),
    updatedAt: updatedAt ?? new Date().toISOString(),
  };
}

export function registerPlanningArtifactHandlers() {
  createTypedHandler(
    planningArtifactContracts.createPlanningArtifact,
    async (_, params) => {
      const {
        appId,
        chatId,
        artifactType,
        title,
        summary,
        content,
        metadata,
      } = params;
      const artifactDir = await getArtifactDir(appId, artifactType);
      const now = new Date().toISOString();
      const slug = `chat-${chatId}-${slugify(title)}-${Date.now()}`;
      validatePlanId(slug);

      const frontmatter = buildFrontmatter({
        title,
        summary: summary ?? "",
        chatId: String(chatId),
        createdAt: now,
        updatedAt: now,
        ...(metadata ?? {}),
      });

      const filePath = path.join(artifactDir, `${slug}.md`);
      await fs.promises.writeFile(filePath, frontmatter + content, "utf-8");

      logger.info("Created planning artifact:", slug, artifactType);

      return slug;
    },
  );

  createTypedHandler(
    planningArtifactContracts.getPlanningArtifact,
    async (_, { appId, artifactId, artifactType }) => {
      validatePlanId(artifactId);
      const artifactDir = await getArtifactDir(appId, artifactType);
      const filePath = path.join(artifactDir, `${artifactId}.md`);
      let raw: string;
      try {
        raw = await fs.promises.readFile(filePath, "utf-8");
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          throw new Error(`Planning artifact not found: ${artifactId}`);
        }
        throw err;
      }

      const { meta, content } = parsePlanFile(raw);
      return toArtifactResult({
        appId,
        artifactId,
        artifactType,
        meta,
        content,
      });
    },
  );

  createTypedHandler(
    planningArtifactContracts.getPlanningArtifactForChat,
    async (_, { appId, chatId, artifactType }) => {
      const artifactDir = await getArtifactDir(appId, artifactType);
      let files: string[];
      try {
        files = await fs.promises.readdir(artifactDir);
      } catch {
        return null;
      }

      const matches = files
        .filter((file) => file.endsWith(".md"))
        .filter((file) => file.startsWith(`chat-${chatId}-`));
      if (matches.length === 0) return null;

      matches.sort();
      const match = matches[matches.length - 1];
      const raw = await fs.promises.readFile(path.join(artifactDir, match), "utf-8");
      const { meta, content } = parsePlanFile(raw);

      return toArtifactResult({
        appId,
        artifactId: match.replace(/\.md$/, ""),
        artifactType,
        meta,
        content,
      });
    },
  );

  createTypedHandler(
    planningArtifactContracts.listPlanningArtifactsForChat,
    async (_, { appId, chatId }) => {
      const artifactTypes: PlanningArtifactType[] = [
        "draft",
        "founder_brief",
        "internal_build_spec",
        "user_flow_spec",
      ];

      const artifacts = await Promise.all(
        artifactTypes.map((artifactType) =>
          (async () => {
            const artifactDir = await getArtifactDir(appId, artifactType);
            let files: string[];
            try {
              files = await fs.promises.readdir(artifactDir);
            } catch {
              return [] as ReturnType<typeof toArtifactResult>[];
            }

            const matches = files
              .filter((file) => file.endsWith(".md"))
              .filter((file) => file.startsWith(`chat-${chatId}-`))
              .sort();

            return Promise.all(
              matches.map(async (match) => {
                const raw = await fs.promises.readFile(
                  path.join(artifactDir, match),
                  "utf-8",
                );
                const { meta, content } = parsePlanFile(raw);
                return toArtifactResult({
                  appId,
                  artifactId: match.replace(/\.md$/, ""),
                  artifactType,
                  meta,
                  content,
                });
              }),
            );
          })(),
        ),
      );

      return artifacts.flat();
    },
  );

  createTypedHandler(
    planningArtifactContracts.updatePlanningArtifact,
    async (_, params) => {
      const { appId, id, artifactType, ...updates } = params;
      validatePlanId(id);
      const artifactDir = await getArtifactDir(appId, artifactType);
      const filePath = path.join(artifactDir, `${id}.md`);
      const raw = await fs.promises.readFile(filePath, "utf-8");
      const { meta, content } = parsePlanFile(raw);

      if (updates.title !== undefined) meta.title = updates.title;
      if (updates.summary !== undefined) meta.summary = updates.summary;
      if (updates.metadata !== undefined) {
        for (const [key, value] of Object.entries(updates.metadata)) {
          meta[key] = value;
        }
      }
      meta.updatedAt = new Date().toISOString();

      const nextContent = updates.content !== undefined ? updates.content : content;
      const frontmatter = buildFrontmatter(meta);
      await fs.promises.writeFile(filePath, frontmatter + nextContent, "utf-8");

      logger.info("Updated planning artifact:", id, artifactType);
    },
  );

  createTypedHandler(
    planningArtifactContracts.deletePlanningArtifact,
    async (_, { appId, artifactId, artifactType }) => {
      validatePlanId(artifactId);
      const artifactDir = await getArtifactDir(appId, artifactType);
      const filePath = path.join(artifactDir, `${artifactId}.md`);
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") {
          throw new Error(`Planning artifact not found: ${artifactId}`);
        }
        throw err;
      }

      logger.info("Deleted planning artifact:", artifactId, artifactType);
    },
  );
}
