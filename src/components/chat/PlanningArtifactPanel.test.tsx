import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { PlanningArtifactPanel } from "./PlanningArtifactPanel";

vi.mock("@/hooks/usePlanningArtifactList", () => ({
  usePlanningArtifactList: () => ({
    hasArtifacts: true,
    artifacts: [
      {
        key: "draft",
        label: "Draft",
        title: "Marketplace Discovery",
        status: "draft",
        content: "# Draft\n\n## Questions",
      },
      {
        key: "founder_brief",
        label: "Founder Brief",
        title: "Marketplace Brief",
        status: "approved",
        content: "# Founder Brief\n\n## Primary User Flows",
      },
      {
        key: "user_flow_spec",
        label: "User Flows",
        title: "Marketplace User Flows",
        status: "draft",
        content: "# User Flows\n\n## Buyer Flow",
      },
    ],
  }),
}));

describe("PlanningArtifactPanel", () => {
  test("renders Builder artifacts and selected artifact content", () => {
    render(<PlanningArtifactPanel />);

    expect(screen.getByText("Builder Artifacts")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Draft" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Founder Brief" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "User Flows" })).toBeTruthy();
    expect(screen.getByText("Marketplace Discovery")).toBeTruthy();
    expect(screen.getByText("Questions")).toBeTruthy();
  });
});
