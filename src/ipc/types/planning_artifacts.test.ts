import { describe, expect, test } from "vitest";
import {
  CreatePlanningArtifactParamsSchema,
  PlanningArtifactSchema,
  PlanningArtifactTypeSchema,
  UpdatePlanningArtifactParamsSchema,
} from "./planning_artifacts";

describe("planning artifact schemas", () => {
  test("accepts valid planning artifact types", () => {
    expect(PlanningArtifactTypeSchema.parse("draft")).toBe("draft");
    expect(PlanningArtifactTypeSchema.parse("founder_brief")).toBe(
      "founder_brief",
    );
    expect(PlanningArtifactTypeSchema.parse("internal_build_spec")).toBe(
      "internal_build_spec",
    );
    expect(PlanningArtifactTypeSchema.parse("user_flow_spec")).toBe(
      "user_flow_spec",
    );
  });

  test("validates planning artifact shape", () => {
    const artifact = PlanningArtifactSchema.parse({
      id: "chat-1-founder-brief-123",
      appId: 1,
      chatId: 1,
      artifactType: "founder_brief",
      title: "Marketplace founder brief",
      summary: "Core founder-facing summary",
      content: "# Founder Brief\n\n## Primary User Flows",
      metadata: {
        status: "approved",
        draftId: "chat-1-draft-100",
      },
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });

    expect(artifact.artifactType).toBe("founder_brief");
    expect(artifact.metadata.status).toBe("approved");
  });

  test("validates user flow artifact shape", () => {
    const artifact = PlanningArtifactSchema.parse({
      id: "chat-3-user-flows-marketplace",
      appId: 1,
      chatId: 3,
      artifactType: "user_flow_spec",
      title: "Marketplace User Flows",
      summary: "Primary and secondary flows",
      content: "# User Flows\n\n## Buyer Flow",
      metadata: { status: "draft" },
      createdAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z",
    });

    expect(artifact.artifactType).toBe("user_flow_spec");
  });

  test("validates create params with metadata", () => {
    const params = CreatePlanningArtifactParamsSchema.parse({
      appId: 2,
      chatId: 10,
      artifactType: "internal_build_spec",
      title: "Internal spec",
      summary: "Implementation detail",
      content: "# Internal Build Spec",
      metadata: {
        briefId: "chat-10-brief-100",
        waveCount: "3",
      },
    });

    expect(params.metadata?.briefId).toBe("chat-10-brief-100");
  });

  test("validates update params", () => {
    const params = UpdatePlanningArtifactParamsSchema.parse({
      appId: 2,
      id: "chat-10-spec-101",
      artifactType: "internal_build_spec",
      content: "# Updated Internal Build Spec",
      metadata: {
        status: "active",
      },
    });

    expect(params.id).toBe("chat-10-spec-101");
    expect(params.metadata?.status).toBe("active");
  });
});
