import type { ToolSpec } from "./spec";
import { addVercelDomainTool } from "./add_vercel_domain";
import { configureAuthTool } from "./configure_auth";
import { createSupabaseProjectTool } from "./create_supabase_project";
import { getConnectionStatusTool } from "./get_connection_status";
import { manageSecretsTool } from "./manage_secrets";
import { setVercelEnvVarsTool } from "./set_vercel_env_vars";

export const ALL_TOOLS: ToolSpec[] = [
  getConnectionStatusTool,
  createSupabaseProjectTool,
  manageSecretsTool,
  configureAuthTool,
  setVercelEnvVarsTool,
  addVercelDomainTool,
];

export {
  addVercelDomainTool,
  configureAuthTool,
  createSupabaseProjectTool,
  getConnectionStatusTool,
  manageSecretsTool,
  setVercelEnvVarsTool,
};

export type { ToolSpec } from "./spec";
