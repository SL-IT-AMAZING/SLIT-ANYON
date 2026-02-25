import type { NativeTool } from "../tool_interface";
import { applyPatchTool } from "./apply_patch";
import { astGrepReplaceTool } from "./ast_grep_replace";
import { astGrepSearchTool } from "./ast_grep_search";
import { bashTool } from "./bash";
import { backgroundCancelTool } from "./background_cancel";
import { backgroundOutputTool } from "./background_output";
import { backgroundStatusTool } from "./background_status";
import { callOmoAgentTool } from "./call_omo_agent";
import { delegateTaskTool } from "./delegate_task";
import { globTool } from "./glob";
import { grepTool } from "./grep";
import { interactiveBashTool } from "./interactive_bash";
import { listTool } from "./list";
import { lookAtTool } from "./look_at";
import { lspDiagnosticsTool } from "./lsp_diagnostics";
import { lspFindReferencesTool } from "./lsp_find_references";
import { lspGotoDefinitionTool } from "./lsp_goto_definition";
import { lspPrepareRenameTool } from "./lsp_prepare_rename";
import { lspRenameTool } from "./lsp_rename";
import { lspSymbolsTool } from "./lsp_symbols";
import { readTool } from "./read";
import { sessionInfoTool } from "./session_info";
import { sessionListTool } from "./session_list";
import { sessionReadTool } from "./session_read";
import { sessionSearchTool } from "./session_search";
import { skillMcpTool } from "./skill_mcp_tool";
import { skillTool } from "./skill_tool";
import { slashcommandTool } from "./slashcommand_tool";
import { writeTool } from "./write";
import { codesearchTool } from "./codesearch";
import { editTool } from "./edit";
import { questionTool } from "./question";
import { todoReadTool } from "./todoread";
import { todoWriteTool } from "./todowrite";
import { webfetchTool } from "./webfetch";
import { websearchTool } from "./websearch";

export const allNativeTools: NativeTool[] = [
  astGrepReplaceTool,
  astGrepSearchTool,
  readTool,
  globTool,
  grepTool,
  sessionInfoTool,
  sessionListTool,
  sessionReadTool,
  sessionSearchTool,
  lookAtTool,
  skillTool,
  skillMcpTool,
  slashcommandTool,
  delegateTaskTool,
  callOmoAgentTool,
  backgroundOutputTool,
  backgroundCancelTool,
  backgroundStatusTool,
  lspGotoDefinitionTool,
  lspFindReferencesTool,
  lspSymbolsTool,
  lspDiagnosticsTool,
  lspPrepareRenameTool,
  lspRenameTool,
  interactiveBashTool,
  listTool,
  writeTool,
  editTool,
  applyPatchTool,
  bashTool,
  todoReadTool,
  todoWriteTool,
  websearchTool,
  webfetchTool,
  codesearchTool,
  questionTool,
];
