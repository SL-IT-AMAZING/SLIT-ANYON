import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { writePlanningArtifactFile } from "./planning_artifact_storage";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("writePlanningArtifactFile", () => {
  test(
    "writes founder brief markdown to typed artifact directory",
    async () => {
    const appPath = fs.mkdtempSync(path.join(os.tmpdir(), "anyon-artifact-"));
    tempDirs.push(appPath);

    const result = await writePlanningArtifactFile({
      appPath,
      chatId: 9,
      artifactType: "founder_brief",
      title: "Marketplace Brief",
      summary: "Buyer journey",
      content: "# Founder Brief\n\n## Primary User Flows",
      metadata: { status: "draft" },
    });

    const saved = fs.readFileSync(result.filePath, "utf-8");
    expect(result.relativePath).toBe(
      ".anyon/briefs/chat-9-founder-brief-marketplace-brief.md",
    );
    expect(saved).toContain('title: "Marketplace Brief"');
    expect(saved).toContain('status: "draft"');
    expect(saved).toContain("# Founder Brief");
    },
    15000,
  );
});
