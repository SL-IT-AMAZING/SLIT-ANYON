/**
 * Comment Checker Hook — Detects leftover TODO/FIXME comments in modified files.
 *
 * After write/edit tool execution, reads the modified file and checks for
 * common comment markers (TODO, FIXME, HACK, XXX) that may indicate
 * incomplete work. Warnings are appended to tool output.
 */

import * as fs from "node:fs";
import * as path from "node:path";

import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:comment-checker");

const WRITE_TOOLS = ["write", "edit", "multiedit", "apply_patch"];

// Patterns to detect — organized by type for clarity
const COMMENT_PATTERNS = [
  { pattern: /\/\/\s*TODO\b/gi, label: "TODO" },
  { pattern: /\/\/\s*FIXME\b/gi, label: "FIXME" },
  { pattern: /\/\/\s*HACK\b/gi, label: "HACK" },
  { pattern: /\/\/\s*XXX\b/gi, label: "XXX" },
  { pattern: /#\s*TODO\b/gi, label: "TODO" },
  { pattern: /#\s*FIXME\b/gi, label: "FIXME" },
  { pattern: /<!--\s*TODO\b/gi, label: "TODO" },
];

// Track pending file paths from tool.execute.before
// Maps callID -> filePath so we can correlate before/after events
const pendingFiles = new Map<string, string>();

/** Typed view of the input that carries tool execution context. */
interface ToolInput {
  tool: string;
  callID?: string;
}

/** Typed view of the output we may mutate. */
interface ToolOutput {
  args?: Record<string, unknown>;
  output?: string;
}

/**
 * Extracts file path from various tool argument patterns.
 * Handles: filePath, path, file_path properties.
 */
function extractFilePath(args: Record<string, unknown>): string | undefined {
  return (
    (args.filePath as string | undefined) ??
    (args.path as string | undefined) ??
    (args.file_path as string | undefined)
  );
}

/**
 * Checks file content for comment markers.
 * Returns array of { line, label, text } for each finding.
 */
function checkCommentsInFile(
  content: string,
): Array<{ line: number; label: string; text: string }> {
  const lines = content.split("\n");
  const findings: Array<{ line: number; label: string; text: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    for (const { pattern, label } of COMMENT_PATTERNS) {
      // Reset regex state before test
      pattern.lastIndex = 0;
      if (pattern.test(lines[i])) {
        findings.push({
          line: i + 1,
          label,
          text: lines[i].trim().substring(0, 100),
        });
        break; // One finding per line
      }
    }
  }

  return findings;
}

/**
 * Formats findings into a warning message for tool output.
 */
function formatWarningMessage(
  relativePath: string,
  findings: Array<{ line: number; label: string; text: string }>,
): string {
  const preview = findings
    .slice(0, 5)
    .map((f) => `  Line ${f.line} [${f.label}]: ${f.text}`)
    .join("\n");

  const moreSuffix =
    findings.length > 5 ? `\n  ... and ${findings.length - 5} more` : "";

  return (
    `\n\n⚠️ Found ${findings.length} comment marker(s) in ${relativePath}:\n` +
    preview +
    moreSuffix +
    `\nPlease resolve these before committing.`
  );
}

export function registerCommentCheckerHook(registry: HookRegistry): void {
  // Capture file path from write/edit tool input (before hook)
  const captureHandler: HookHandler = async (input, output, _ctx) => {
    const { tool, callID } = input as ToolInput;

    // Only track write tools
    if (!WRITE_TOOLS.includes(tool) || !callID) {
      return { abort: false };
    }

    const args = (output as ToolOutput).args;
    if (!args) {
      return { abort: false };
    }

    const filePath = extractFilePath(args);
    if (filePath) {
      pendingFiles.set(callID, filePath);
    }
    return { abort: false };
  };

  registry.register(
    "tool.execute.before",
    "comment-checker:capture",
    captureHandler,
    90, // Low priority — run after other before hooks
    "global",
  );

  // Check for comments after tool execution (after hook)
  const checkHandler: HookHandler = async (input, output, ctx) => {
    const { tool, callID } = input as ToolInput;

    // Only check write tools
    if (!WRITE_TOOLS.includes(tool) || !callID) {
      return { abort: false };
    }

    const filePath = pendingFiles.get(callID);
    pendingFiles.delete(callID);

    if (!filePath) {
      return { abort: false };
    }

    // Resolve file path relative to working directory
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(ctx.directory, filePath);

    // Skip if file doesn't exist
    if (!fs.existsSync(resolvedPath)) {
      return { abort: false };
    }

    try {
      const content = fs.readFileSync(resolvedPath, "utf-8");
      const findings = checkCommentsInFile(content);

      if (findings.length > 0) {
        const relativePath = path.relative(ctx.directory, resolvedPath);
        const warning = formatWarningMessage(relativePath, findings);

        // Append warning to tool output
        const out = output as ToolOutput;
        out.output = (out.output ?? "") + warning;

        logger.log(
          `Found ${findings.length} comment marker(s) in ${relativePath}`,
        );
      }
    } catch (err) {
      logger.error(`Failed to check comments in ${filePath}:`, err);
    }
    return { abort: false };
  };

  registry.register(
    "tool.execute.after",
    "comment-checker:check",
    checkHandler,
    90, // Low priority — run after other after hooks
    "global",
  );

  logger.log("Comment checker hook registered");
}
