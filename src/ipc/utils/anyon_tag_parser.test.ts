import { describe, expect, test } from "vitest";
import { getAnyonWritePlanTags } from "./anyon_tag_parser";

describe("getAnyonWritePlanTags", () => {
  test("extracts Builder planning tags with content and attributes", () => {
    const tags = getAnyonWritePlanTags(`
<anyon-write-plan title="Marketplace Brief" summary="Buyer and seller flows" complete="true" artifactType="founder_brief">
# Founder Brief

## Primary User Flows
- Buyer browses products
</anyon-write-plan>
`);

    expect(tags).toHaveLength(1);
    expect(tags[0]).toEqual({
      title: "Marketplace Brief",
      summary: "Buyer and seller flows",
      complete: "true",
      artifactType: "founder_brief",
      artifactId: undefined,
      content: "# Founder Brief\n\n## Primary User Flows\n- Buyer browses products",
    });
  });

  test("strips code fences in planning tag content", () => {
    const tags = getAnyonWritePlanTags(`
<anyon-write-plan title="Spec" complete="true">
\`\`\`markdown
# Internal Build Spec
\`\`\`
</anyon-write-plan>
`);

    expect(tags[0]?.content).toBe("# Internal Build Spec");
  });
});
