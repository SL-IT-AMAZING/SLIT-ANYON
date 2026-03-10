import fs from "node:fs";
import path from "node:path";
import type { PlanningArtifactType } from "../types/planning_artifacts";
import {
  buildFrontmatter,
  ensureAnyonGitignored,
  parsePlanFile,
  slugify,
  validatePlanId,
} from "./planUtils";

const ARTIFACT_DIRECTORY_BY_TYPE: Record<PlanningArtifactType, string> = {
  draft: "drafts",
  founder_brief: "briefs",
  internal_build_spec: "specs",
  user_flow_spec: "flows",
};

export function getPlanningArtifactSlug(params: {
  chatId: number | string;
  artifactType: PlanningArtifactType;
  title: string;
}) {
  return `chat-${params.chatId}-${params.artifactType.replace(/_/g, "-")}-${slugify(params.title)}`;
}

export async function writePlanningArtifactFile(params: {
  appPath: string;
  chatId: number | string;
  artifactType: PlanningArtifactType;
  title: string;
  summary?: string;
  content: string;
  metadata?: Record<string, string>;
}) {
  const artifactDir = path.join(
    params.appPath,
    ".anyon",
    ARTIFACT_DIRECTORY_BY_TYPE[params.artifactType],
  );
  await fs.promises.mkdir(artifactDir, { recursive: true });
  await ensureAnyonGitignored(params.appPath);

  const slug = getPlanningArtifactSlug({
    chatId: params.chatId,
    artifactType: params.artifactType,
    title: params.title,
  });
  validatePlanId(slug);

  const filePath = path.join(artifactDir, `${slug}.md`);
  let createdAt = new Date().toISOString();
  try {
    const existing = await fs.promises.readFile(filePath, "utf-8");
    const { meta } = parsePlanFile(existing);
    createdAt = meta.createdAt ?? createdAt;
  } catch {}

  const updatedAt = new Date().toISOString();
  const frontmatter = buildFrontmatter({
    title: params.title,
    summary: params.summary ?? "",
    chatId: String(params.chatId),
    createdAt,
    updatedAt,
    ...(params.metadata ?? {}),
  });

  await fs.promises.writeFile(filePath, frontmatter + params.content, "utf-8");

  return {
    id: slug,
    relativePath: `.anyon/${ARTIFACT_DIRECTORY_BY_TYPE[params.artifactType]}/${slug}.md`,
    filePath,
  };
}
