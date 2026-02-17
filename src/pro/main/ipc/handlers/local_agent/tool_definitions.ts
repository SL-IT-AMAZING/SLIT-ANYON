import { addDependencyTool } from "./tools/add_dependency";
import { deleteFileTool } from "./tools/delete_file";
import { executeSqlTool } from "./tools/execute_sql";
import { renameFileTool } from "./tools/rename_file";
import { writeFileTool } from "./tools/write_file";

import { getSupabaseClientCode } from "@/supabase_admin/supabase_context";
import type { LanguageModelV3ToolResultOutput } from "@ai-sdk/provider";
import { addIntegrationTool } from "./tools/add_integration";
import { codeSearchTool } from "./tools/code_search";
import { editFileTool } from "./tools/edit_file";
import { exitPlanTool } from "./tools/exit_plan";
import { getSupabaseProjectInfoTool } from "./tools/get_supabase_project_info";
import { getSupabaseTableSchemaTool } from "./tools/get_supabase_table_schema";
import { grepTool } from "./tools/grep";
import { listFilesTool } from "./tools/list_files";
import { planningQuestionnaireTool } from "./tools/planning_questionnaire";
import { readFileTool } from "./tools/read_file";
import { readLogsTool } from "./tools/read_logs";
import { runTypeChecksTool } from "./tools/run_type_checks";
import { searchReplaceTool } from "./tools/search_replace";
import { setChatSummaryTool } from "./tools/set_chat_summary";
import {
  type AgentContext,
  FILE_EDIT_TOOL_NAMES,
  type FileEditToolName,
  type ToolDefinition,
  type ToolResult,
  escapeXmlAttr,
  escapeXmlContent,
} from "./tools/types";
import { updateTodosTool } from "./tools/update_todos";
import { webCrawlTool } from "./tools/web_crawl";
import { webSearchTool } from "./tools/web_search";
import { writePlanTool } from "./tools/write_plan";
// Combined tool definitions array
export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  writeFileTool,
  editFileTool,
  searchReplaceTool,
  deleteFileTool,
  renameFileTool,
  addDependencyTool,
  executeSqlTool,
  readFileTool,
  listFilesTool,
  grepTool,
  codeSearchTool,
  getSupabaseProjectInfoTool,
  getSupabaseTableSchemaTool,
  setChatSummaryTool,
  addIntegrationTool,
  readLogsTool,
  webSearchTool,
  webCrawlTool,
  updateTodosTool,
  runTypeChecksTool,
  // Plan mode tools
  planningQuestionnaireTool,
  writePlanTool,
  exitPlanTool,
];
// ============================================================================
// Agent Tool Name Type (derived from TOOL_DEFINITIONS)
// ============================================================================

export type AgentToolName = (typeof TOOL_DEFINITIONS)[number]["name"];

// ============================================================================
// Build Agent Tool Set
// ============================================================================

/**
 * Process placeholders in tool args (e.g. $$SUPABASE_CLIENT_CODE$$)
 * Recursively processes all string values in the args object.
 */
async function processArgPlaceholders<T extends Record<string, any>>(
  args: T,
  ctx: AgentContext,
): Promise<T> {
  if (!ctx.supabaseProjectId) {
    return args;
  }

  // Check if any string values contain the placeholder
  const argsStr = JSON.stringify(args);
  if (!argsStr.includes("$$SUPABASE_CLIENT_CODE$$")) {
    return args;
  }

  // Fetch the replacement value once
  const supabaseClientCode = await getSupabaseClientCode({
    projectId: ctx.supabaseProjectId,
    organizationSlug: ctx.supabaseOrganizationSlug ?? null,
  });

  // Process all string values in args
  const processValue = (value: any): any => {
    if (typeof value === "string") {
      return value.replace(/\$\$SUPABASE_CLIENT_CODE\$\$/g, supabaseClientCode);
    }
    if (Array.isArray(value)) {
      return value.map(processValue);
    }
    if (value && typeof value === "object") {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = processValue(v);
      }
      return result;
    }
    return value;
  };

  return processValue(args) as T;
}

/**
 * Convert our ToolResult to AI SDK format
 */
function convertToolResultForAiSdk(
  result: ToolResult,
): LanguageModelV3ToolResultOutput {
  if (typeof result === "string") {
    return { type: "text", value: result };
  }
  throw new Error(`Unsupported tool result type: ${typeof result}`);
}

export interface BuildAgentToolSetOptions {
  /**
   * If true, exclude tools that modify state (files, database, etc.).
   * Used for read-only modes like "ask" mode.
   */
  readOnly?: boolean;
  /**
   * If true, only include tools that are allowed in plan mode.
   * Plan mode has access to read-only tools plus planning-specific tools.
   */
  planModeOnly?: boolean;
}

const FILE_EDIT_TOOLS: Set<FileEditToolName> = new Set(FILE_EDIT_TOOL_NAMES);

/**
 * Track file edit tool usage for telemetry
 */
function trackFileEditTool(
  ctx: AgentContext,
  toolName: string,
  args: { file_path?: string; path?: string },
): void {
  if (!FILE_EDIT_TOOLS.has(toolName as FileEditToolName)) {
    return;
  }
  const filePath = args.file_path ?? args.path;
  if (!filePath) {
    return;
  }
  if (!ctx.fileEditTracker[filePath]) {
    ctx.fileEditTracker[filePath] = {
      write_file: 0,
      edit_file: 0,
      search_replace: 0,
    };
  }
  ctx.fileEditTracker[filePath][toolName as FileEditToolName]++;
}

/**
 * Planning-specific tools that are only available in plan mode.
 * In plan mode, all non-state-modifying tools are also included automatically.
 */
const PLANNING_SPECIFIC_TOOLS = new Set([
  "planning_questionnaire",
  "write_plan",
  "exit_plan",
]);

/**
 * Build ToolSet for AI SDK from tool definitions
 */
export function buildAgentToolSet(
  ctx: AgentContext,
  options: BuildAgentToolSetOptions = {},
) {
  const toolSet: Record<string, any> = {};

  for (const tool of TOOL_DEFINITIONS) {
    // In plan mode, skip state-modifying tools unless they're planning-specific
    if (
      options.planModeOnly &&
      tool.modifiesState &&
      !PLANNING_SPECIFIC_TOOLS.has(tool.name)
    ) {
      continue;
    }

    // Skip planning-specific tools when NOT in plan mode
    if (!options.planModeOnly && PLANNING_SPECIFIC_TOOLS.has(tool.name)) {
      continue;
    }

    // In read-only mode, skip tools that modify state
    if (options.readOnly && tool.modifiesState) {
      continue;
    }

    if (tool.isEnabled && !tool.isEnabled(ctx)) {
      continue;
    }

    toolSet[tool.name] = {
      description: tool.description,
      inputSchema: tool.inputSchema,
      execute: async (args: any) => {
        try {
          const processedArgs = await processArgPlaceholders(args, ctx);

          // Check consent before executing the tool
          const allowed = await ctx.requireConsent({
            toolName: tool.name,
            toolDescription: tool.description,
            inputPreview: tool.getConsentPreview?.(processedArgs) ?? null,
          });
          if (!allowed) {
            throw new Error(`User denied permission for ${tool.name}`);
          }

          // Track file edit tool usage before execution to capture all attempts
          // (including failures) for retry/fallback telemetry
          trackFileEditTool(ctx, tool.name, processedArgs);

          const result = await tool.execute(processedArgs, ctx);

          return convertToolResultForAiSdk(result);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          ctx.onXmlComplete(
            `<anyon-output type="error" message="Tool '${tool.name}' failed: ${escapeXmlAttr(errorMessage)}">${escapeXmlContent(errorMessage)}</anyon-output>`,
          );
          throw error;
        }
      },
    };
  }

  return toolSet;
}
