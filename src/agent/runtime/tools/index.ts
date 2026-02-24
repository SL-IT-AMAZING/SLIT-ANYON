import type { NativeTool } from "../tool_interface";
import { applyPatchTool } from "./apply_patch";
import { bashTool } from "./bash";
import { globTool } from "./glob";
import { grepTool } from "./grep";
import { listTool } from "./list";
import { readTool } from "./read";
import { writeTool } from "./write";
import { codesearchTool } from "./codesearch";
import { editTool } from "./edit";
import { questionTool } from "./question";
import { todoReadTool } from "./todoread";
import { todoWriteTool } from "./todowrite";
import { webfetchTool } from "./webfetch";
import { websearchTool } from "./websearch";

export const allNativeTools: NativeTool[] = [
  readTool,
  globTool,
  grepTool,
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
