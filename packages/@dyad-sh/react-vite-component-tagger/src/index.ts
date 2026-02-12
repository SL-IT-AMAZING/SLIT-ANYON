import path from "node:path";
import { parse } from "@babel/parser";
import { walk } from "estree-walker";
import MagicString from "magic-string";
import type { Plugin } from "vite";

const VALID_EXTENSIONS = new Set([".jsx", ".tsx"]);

/**
 * Returns a Vite / esbuild plug-in.
 */
export default function anyonTagger(): Plugin {
  return {
    name: "vite-plugin-anyon-tagger",
    apply: "serve",
    enforce: "pre",

    async transform(code: string, id: string) {
      try {
        if (
          !VALID_EXTENSIONS.has(path.extname(id)) ||
          id.includes("node_modules")
        )
          return null;

        const ast = parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
        });

        const ms = new MagicString(code);
        const fileRelative = path.relative(process.cwd(), id);

        walk(ast as any, {
          enter(node: any) {
            try {
              if (node.type !== "JSXOpeningElement") return;

              if (node.name?.type !== "JSXIdentifier") return;
              const tagName = node.name.name as string;
              if (!tagName) return;

              const alreadyTagged = node.attributes?.some(
                (attr: any) =>
                  attr.type === "JSXAttribute" &&
                  attr.name?.name === "data-anyon-id",
              );
              if (alreadyTagged) return;

              const loc = node.loc?.start;
              if (!loc) return;
              const componentId = `${fileRelative}:${loc.line}:${loc.column}`;

              if (node.name.end != null) {
                ms.appendLeft(
                  node.name.end,
                  ` data-anyon-id="${componentId}" data-anyon-name="${tagName}"`,
                );
              }
            } catch (error) {
              console.warn(
                `[anyon-tagger] Warning: Failed to process JSX node in ${id}:`,
                error,
              );
            }
          },
        });

        if (ms.toString() === code) return null;

        return {
          code: ms.toString(),
          map: ms.generateMap({ hires: true }),
        };
      } catch (error) {
        console.warn(
          `[anyon-tagger] Warning: Failed to transform ${id}:`,
          error,
        );
        return null;
      }
    },
  };
}
