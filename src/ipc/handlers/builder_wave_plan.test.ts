import { describe, expect, test } from "vitest";
import { buildWavePlanContent, getWavePlanSlug } from "./builder_wave_plan";

describe("builder wave plan helpers", () => {
  test("creates deterministic wave plan slug", () => {
    expect(
      getWavePlanSlug({ chatId: 7, title: "Marketplace Founder Brief" }),
    ).toBe("chat-7-wave-1-marketplace-founder-brief");
  });

  test("creates thesis-safe wave plan markdown with top-level checkboxes", () => {
    const content = buildWavePlanContent({
      title: "Marketplace Founder Brief",
      artifactType: "founder_brief",
      artifactId: "chat-7-brief-1",
      artifactContent: "# Founder Brief\n\n## Primary User Flows",
      internalSpecContent: "# Internal Build Spec\n\n## Flow Inventory",
    });

    expect(content).toContain("# Marketplace Founder Brief - Wave 1 Execution Plan");
    expect(content).toContain("- [ ] 1. Lock the wave 1 scope");
    expect(content).toContain("- [ ] 4. Verify the finished wave");
    expect(content).toContain("## Internal Build Spec");
  });
});
