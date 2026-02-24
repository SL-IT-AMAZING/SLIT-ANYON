import type { ToolSpec } from "./spec";
import { addVercelDomainTool } from "./add_vercel_domain";
import { configureAuthTool } from "./configure_auth";
import { createSupabaseProjectTool } from "./create_supabase_project";
import { getConnectionStatusTool } from "./get_connection_status";
import { getSupabaseApiKeysTool } from "./get_supabase_api_keys";
import { manageSecretsTool } from "./manage_secrets";
import { setSupabaseAppProjectTool } from "./set_supabase_app_project";
import { setVercelEnvVarsTool } from "./set_vercel_env_vars";

export const ALL_TOOLS: ToolSpec[] = [
  getConnectionStatusTool,
  createSupabaseProjectTool,
  setSupabaseAppProjectTool,
  getSupabaseApiKeysTool,
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
  getSupabaseApiKeysTool,
  manageSecretsTool,
  setSupabaseAppProjectTool,
  setVercelEnvVarsTool,
};

export type { ToolSpec } from "./spec";
