import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("router routes", () => {
  it("declares the /themes route in route file", () => {
    const themesRouteFile = path.resolve(process.cwd(), "src/routes/themes.ts");
    const source = fs.readFileSync(themesRouteFile, "utf8");
    expect(source).toContain('path: "/themes"');
  });

  it("registers themesRoute in the router tree", () => {
    const routerFile = path.resolve(process.cwd(), "src/router.ts");
    const source = fs.readFileSync(routerFile, "utf8");
    expect(source).toContain("themesRoute");
  });
});
