import {
  hasNextComponentTaggerConfig,
  injectNextComponentTaggerToConfig,
} from "@/ipc/handlers/app_upgrade_handlers";
import { describe, expect, it } from "vitest";

describe("next component tagger config helpers", () => {
  const useExpression = 'require.resolve("./plugins/anyon-component-tagger.mjs")';

  it("detects existing Next component tagger references", () => {
    const content = `const nextConfig = {\n  webpack: (config) => {\n    config.module.rules.push({ use: "@anyon/nextjs-webpack-component-tagger" });\n    return config;\n  },\n};`;
    expect(hasNextComponentTaggerConfig(content)).toBe(true);
  });

  it("injects into an existing webpack callback", () => {
    const content =
      "const nextConfig = {\n  webpack: (config) => {\n    return config;\n  },\n};\n\nexport default nextConfig;";

    const updated = injectNextComponentTaggerToConfig(content, useExpression);

    expect(updated).toContain("config.module.rules.push({");
    expect(updated).toContain(useExpression);
    expect(updated).toContain("return config;");
  });

  it("adds a webpack block when none exists", () => {
    const content =
      "const nextConfig = {\n  reactStrictMode: true,\n};\n\nexport default nextConfig;";

    const updated = injectNextComponentTaggerToConfig(content, useExpression);

    expect(updated).toContain("webpack: (config) => {");
    expect(updated).toContain("config.module.rules.push({");
    expect(updated).toContain(useExpression);
  });

  it("supports export default object at top-level", () => {
    const content = "export default {\n  reactStrictMode: true,\n};";

    const updated = injectNextComponentTaggerToConfig(content, useExpression);

    expect(updated).toContain("webpack: (config) => {");
    expect(updated).toContain("config.module.rules.push({");
  });

  it("does not change content when tagger is already configured", () => {
    const content = `const nextConfig = {\n  webpack: (config) => {\n    config.module.rules.push({\n      use: require.resolve("./plugins/anyon-component-tagger.mjs"),\n    });\n    return config;\n  },\n};`;

    const updated = injectNextComponentTaggerToConfig(content, useExpression);

    expect(updated).toBe(content);
  });
});
