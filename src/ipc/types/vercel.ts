import { z } from "zod";
import {
  createClient,
  createStreamClient,
  defineContract,
  defineStream,
} from "../contracts/core";

// =============================================================================
// Vercel Schemas
// =============================================================================

export const VercelProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  framework: z.string().nullable().optional(),
});

export type VercelProject = z.infer<typeof VercelProjectSchema>;

export const VercelDeploymentSchema = z.object({
  uid: z.string(),
  url: z.string(),
  state: z.string(),
  createdAt: z.number(),
  target: z.string(),
  readyState: z.string(),
});

export type VercelDeployment = z.infer<typeof VercelDeploymentSchema>;

export const SaveVercelAccessTokenParamsSchema = z.object({
  token: z.string(),
});

export type SaveVercelAccessTokenParams = z.infer<
  typeof SaveVercelAccessTokenParamsSchema
>;

export const ConnectToExistingVercelProjectParamsSchema = z.object({
  appId: z.number(),
  projectId: z.string(),
});

export type ConnectToExistingVercelProjectParams = z.infer<
  typeof ConnectToExistingVercelProjectParamsSchema
>;

export const IsVercelProjectAvailableParamsSchema = z.object({
  name: z.string(),
});

export type IsVercelProjectAvailableParams = z.infer<
  typeof IsVercelProjectAvailableParamsSchema
>;

export const IsVercelProjectAvailableResponseSchema = z.object({
  available: z.boolean(),
  error: z.string().optional(),
});

export type IsVercelProjectAvailableResponse = z.infer<
  typeof IsVercelProjectAvailableResponseSchema
>;

export const CreateVercelProjectParamsSchema = z.object({
  name: z.string(),
  appId: z.number(),
});

export type CreateVercelProjectParams = z.infer<
  typeof CreateVercelProjectParamsSchema
>;

export const GetVercelDeploymentsParamsSchema = z.object({
  appId: z.number(),
});

export type GetVercelDeploymentsParams = z.infer<
  typeof GetVercelDeploymentsParamsSchema
>;

export const DisconnectVercelProjectParamsSchema = z.object({
  appId: z.number(),
});

export type DisconnectVercelProjectParams = z.infer<
  typeof DisconnectVercelProjectParamsSchema
>;

export const SyncSupabaseEnvParamsSchema = z.object({
  appId: z.number(),
});

export type SyncSupabaseEnvParams = z.infer<typeof SyncSupabaseEnvParamsSchema>;

export const DeviceAuthStartResponseSchema = z.object({
  userCode: z.string(),
  verificationUri: z.string(),
  verificationUriComplete: z.string(),
  expiresIn: z.number(),
  interval: z.number(),
});

export type DeviceAuthStartResponse = z.infer<
  typeof DeviceAuthStartResponseSchema
>;

export const DeviceAuthPollResponseSchema = z.object({
  status: z.enum(["pending", "success", "expired", "denied", "error"]),
  error: z.string().optional(),
});

export type DeviceAuthPollResponse = z.infer<
  typeof DeviceAuthPollResponseSchema
>;

// --- Direct Deploy Schemas ---

export const DirectDeployParamsSchema = z.object({
  appId: z.number(),
  /** If true, deploy to production target. Default: true */
  production: z.boolean().optional().default(true),
});

export type DirectDeployParams = z.infer<typeof DirectDeployParamsSchema>;

export const DeployProgressChunkSchema = z.object({
  appId: z.number(),
  phase: z.enum([
    "collecting", // Scanning/hashing files
    "uploading", // Uploading files to Vercel
    "creating", // Creating the deployment
    "building", // Vercel is building
    "ready", // Deployment is live
  ]),
  message: z.string(),
  /** 0-100 progress within the current phase */
  progress: z.number().optional(),
  /** Total files found (set during collecting phase) */
  totalFiles: z.number().optional(),
  /** Files uploaded so far (set during uploading phase) */
  filesUploaded: z.number().optional(),
});

export type DeployProgressChunk = z.infer<typeof DeployProgressChunkSchema>;

export const DeployEndSchema = z.object({
  appId: z.number(),
  url: z.string(),
  deploymentId: z.string(),
  readyState: z.string(),
});

export type DeployEnd = z.infer<typeof DeployEndSchema>;

export const DeployErrorSchema = z.object({
  appId: z.number(),
  error: z.string(),
  phase: z.string().optional(),
});

export type DeployError = z.infer<typeof DeployErrorSchema>;

// =============================================================================
// Vercel Contracts
// =============================================================================

export const vercelContracts = {
  saveToken: defineContract({
    channel: "vercel:save-token",
    input: SaveVercelAccessTokenParamsSchema,
    output: z.void(),
  }),

  startDeviceAuth: defineContract({
    channel: "vercel:start-device-auth",
    input: z.void(),
    output: DeviceAuthStartResponseSchema,
  }),

  pollDeviceAuth: defineContract({
    channel: "vercel:poll-device-auth",
    input: z.void(),
    output: DeviceAuthPollResponseSchema,
  }),

  listProjects: defineContract({
    channel: "vercel:list-projects",
    input: z.void(),
    output: z.array(VercelProjectSchema),
  }),

  isProjectAvailable: defineContract({
    channel: "vercel:is-project-available",
    input: IsVercelProjectAvailableParamsSchema,
    output: IsVercelProjectAvailableResponseSchema,
  }),

  createProject: defineContract({
    channel: "vercel:create-project",
    input: CreateVercelProjectParamsSchema,
    output: z.void(),
  }),

  connectExistingProject: defineContract({
    channel: "vercel:connect-existing-project",
    input: ConnectToExistingVercelProjectParamsSchema,
    output: z.void(),
  }),

  getDeployments: defineContract({
    channel: "vercel:get-deployments",
    input: GetVercelDeploymentsParamsSchema,
    output: z.array(VercelDeploymentSchema),
  }),

  disconnect: defineContract({
    channel: "vercel:disconnect",
    input: DisconnectVercelProjectParamsSchema,
    output: z.void(),
  }),

  syncSupabaseEnv: defineContract({
    channel: "vercel:sync-supabase-env",
    input: SyncSupabaseEnvParamsSchema,
    output: z.void(),
  }),

  triggerDeploy: defineContract({
    channel: "vercel:trigger-deploy",
    input: z.object({ appId: z.number() }),
    output: z.void(),
  }),
} as const;

// =============================================================================
// Vercel Client
// =============================================================================

export const vercelClient = createClient(vercelContracts);

// =============================================================================
// Vercel Direct Deploy Stream
// =============================================================================

export const vercelDeployStreamContract = defineStream({
  channel: "vercel:direct-deploy",
  input: DirectDeployParamsSchema,
  keyField: "appId" as const,
  events: {
    chunk: {
      channel: "vercel:deploy:progress",
      payload: DeployProgressChunkSchema,
    },
    end: {
      channel: "vercel:deploy:end",
      payload: DeployEndSchema,
    },
    error: {
      channel: "vercel:deploy:error",
      payload: DeployErrorSchema,
    },
  },
});

export const vercelDeployStreamClient = createStreamClient(
  vercelDeployStreamContract,
);
