import * as path from "node:path";
import log from "electron-log";
import type { HookRegistry } from "../hook_system";

const logger = log.scope("prometheus-md-only");

const PROMETHEUS_AGENTS = ["prometheus", "plan", "planner"];
const ALLOWED_EXTENSIONS = [".md", ".txt"];
const BLOCKED_TOOLS = ["write", "edit", "multiedit", "apply_patch"];
const TASK_TOOLS = ["delegate_task", "call_omo_agent"];

const PLANNING_CONSULT_WARNING = `\n\n<!-- SYSTEM: This task was delegated by a PLANNING agent (Prometheus). The delegated agent should focus on RESEARCH and ANALYSIS only. Do NOT make code changes. Return findings and recommendations. -->`;

/**
 * Check if a file path is within the .sisyphus directory and has an allowed extension.
 */
function isAllowedFile(filePath: string, workspaceRoot: string): boolean {
  const resolved = path.resolve(workspaceRoot, filePath);
  const rel = path.relative(workspaceRoot, resolved);

  // Reject if escapes root
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return false;
  }

  // Check if .sisyphus/ exists in the path
  if (!rel.includes(".sisyphus" + path.sep) && !rel.includes(".sisyphus/")) {
    return false;
  }

  // Check extension
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) =>
    resolved.toLowerCase().endsWith(ext.toLowerCase()),
  );

  return hasAllowedExtension;
}

export function registerPrometheusMdOnlyHook(registry: HookRegistry): void {
  registry.register(
    "tool.execute.before",
    "prometheus-md-only",
    async (input, output, ctx) => {
      const { tool } = input as { tool: string };
      const args = (output as { args: Record<string, unknown> }).args;
      const agentName = ctx.agent?.toLowerCase();

      // Only apply to prometheus-like agents
      if (!agentName || !PROMETHEUS_AGENTS.includes(agentName)) {
        return undefined;
      }

      // For task delegation tools, inject read-only warning
      if (TASK_TOOLS.includes(tool)) {
        const prompt = args.prompt as string | undefined;
        if (prompt && !prompt.includes("<!-- SYSTEM:")) {
          args.prompt = prompt + PLANNING_CONSULT_WARNING;
          logger.log(`Injected read-only warning to ${tool} from ${agentName}`);
        }
        return undefined;
      }

      // For blocked tools, check if writing to allowed path
      if (!BLOCKED_TOOLS.includes(tool)) {
        return undefined;
      }

      const filePath = (args.filePath ?? args.path ?? args.file) as
        | string
        | undefined;
      if (!filePath) {
        return undefined;
      }

      if (!isAllowedFile(filePath, ctx.directory)) {
        logger.warn(`Blocked: ${agentName} attempted to ${tool} ${filePath}`);
        throw new Error(
          `Prometheus (Planner) can only write/edit .md files inside .sisyphus/ directory. ` +
            `Attempted to modify: ${filePath}. ` +
            `Prometheus is a READ-ONLY planner. Use /start-work to execute the plan.`,
        );
      }

      logger.log(`Allowed: .sisyphus write by ${agentName}: ${filePath}`);
      return undefined;
    },
    50,
    "global",
  );

  logger.log("Prometheus MD-only hook registered");
}
