import * as z from "zod";
import { AnyonConfigSchema } from "../src/config/schema";

export function createAnyonJsonSchema(): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(AnyonConfigSchema, {
    target: "draft-7",
    unrepresentable: "any",
  });

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://raw.githubusercontent.com/SL-IT-AMAZING/anyon-cli/dev/assets/anyon.schema.json",
    title: "Oh My OpenCode Configuration",
    description: "Configuration schema for anyon plugin",
    ...jsonSchema,
  };
}
