import fs from "node:fs";
import path from "node:path";
import {
  buildFrontmatter,
  ensureAnyonGitignored,
  parsePlanFile,
  slugify,
  validatePlanId,
} from "./planUtils";

export function getWavePlanSlug(params: {
  chatId: string | number;
  title: string;
}) {
  return `chat-${params.chatId}-wave-1-${slugify(params.title)}`;
}

export function buildWavePlanContent(params: {
  title: string;
  artifactType: "founder_brief" | "internal_build_spec";
  artifactId: string;
  artifactContent: string;
  internalSpecContent?: string;
}) {
  const {
    title,
    artifactType,
    artifactId,
    artifactContent,
    internalSpecContent,
  } = params;

  return `# ${title} - Wave 1 Execution Plan

## Scope

- Build the first approved product wave from the Builder artifacts.
- Keep implementation aligned to the documented user flows.

## Source Artifact

- Type: ${artifactType}
- ID: ${artifactId}

## Approved Founder Context

${artifactContent}

${internalSpecContent ? `## Internal Build Spec

${internalSpecContent}

` : ""}## TODOs

- [ ] 1. Lock the wave 1 scope from the approved user flows and assumptions.
- [ ] 2. Implement the primary user flows required for the first founder-approved slice.
- [ ] 3. Implement supporting states, validation, and navigation needed for those flows.
- [ ] 4. Verify the finished wave against the approved flows and record progress in this plan.

## Verification

- [ ] The first user-visible wave works for the approved primary flow.
- [ ] The implemented scope stays inside the founder-approved brief/spec.
`;
}

export async function writeWavePlanFile(params: {
  appPath: string;
  chatId: string | number;
  title: string;
  summary?: string;
  artifactType: "founder_brief" | "internal_build_spec";
  artifactId: string;
  artifactContent: string;
  internalSpecContent?: string;
}) {
  const planDir = path.join(params.appPath, ".anyon", "plans");
  await fs.promises.mkdir(planDir, { recursive: true });
  await ensureAnyonGitignored(params.appPath);

  const slug = getWavePlanSlug({ chatId: params.chatId, title: params.title });
  validatePlanId(slug);

  const filePath = path.join(planDir, `${slug}.md`);
  let createdAt = new Date().toISOString();
  try {
    const existing = await fs.promises.readFile(filePath, "utf-8");
    const { meta } = parsePlanFile(existing);
    createdAt = meta.createdAt ?? createdAt;
  } catch {}

  const updatedAt = new Date().toISOString();
  const frontmatter = buildFrontmatter({
    title: `${params.title} - Wave 1 Execution Plan`,
    summary: params.summary ?? "Approved Builder wave 1 plan",
    chatId: String(params.chatId),
    createdAt,
    updatedAt,
    waveNumber: "1",
    sourceArtifactType: params.artifactType,
    sourceArtifactId: params.artifactId,
  });

  const body = buildWavePlanContent({
    title: params.title,
    artifactType: params.artifactType,
    artifactId: params.artifactId,
    artifactContent: params.artifactContent,
    internalSpecContent: params.internalSpecContent,
  });

  await fs.promises.writeFile(filePath, frontmatter + body, "utf-8");

  return {
    slug,
    relativePath: `.anyon/plans/${slug}.md`,
    filePath,
  };
}
