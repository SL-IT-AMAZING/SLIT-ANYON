import { z } from "zod";

export const SecretSchema = z.object({
  value: z.string(),
  encryptionType: z.enum(["electron-safe-storage", "plaintext"]).optional(),
});
export type Secret = z.infer<typeof SecretSchema>;

/**
 * Zod schema for chat summary objects returned by the get-chats IPC
 */
export const ChatSummarySchema = z.object({
  id: z.number(),
  appId: z.number(),
  title: z.string().nullable(),
  createdAt: z.date(),
});

/**
 * Type derived from the ChatSummarySchema
 */
export type ChatSummary = z.infer<typeof ChatSummarySchema>;

/**
 * Zod schema for an array of chat summaries
 */
export const ChatSummariesSchema = z.array(ChatSummarySchema);

/**
 * Zod schema for chat search result objects returned by the search-chats IPC
 */
export const ChatSearchResultSchema = z.object({
  id: z.number(),
  appId: z.number(),
  title: z.string().nullable(),
  createdAt: z.date(),
  matchedMessageContent: z.string().nullable(),
});

/**
 * Type derived from the ChatSearchResultSchema
 */
export type ChatSearchResult = z.infer<typeof ChatSearchResultSchema>;

export const ChatSearchResultsSchema = z.array(ChatSearchResultSchema);

// Zod schema for app search result objects returned by the search-app IPC
export const AppSearchResultSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.date(),
  matchedChatTitle: z.string().nullable(),
  matchedChatMessage: z.string().nullable(),
});

// Type derived from AppSearchResultSchema
export type AppSearchResult = z.infer<typeof AppSearchResultSchema>;

export const AppSearchResultsSchema = z.array(AppSearchResultSchema);

const providers = [
  "openai",
  "anthropic",
  "google",
  "vertex",
  "openrouter",
  "ollama",
  "lmstudio",
  "azure",
  "xai",
  "bedrock",
] as const;

export const cloudProviders = providers.filter(
  (provider) => provider !== "ollama" && provider !== "lmstudio",
);

/**
 * Zod schema for large language model configuration
 */
export const LargeLanguageModelSchema = z.object({
  name: z.string(),
  provider: z.string(),
  customModelId: z.number().optional(),
});

/**
 * Type derived from the LargeLanguageModelSchema
 */
export type LargeLanguageModel = z.infer<typeof LargeLanguageModelSchema>;

/**
 * Zod schema for provider settings
 * Regular providers use only apiKey. Vertex has additional optional fields.
 */
export const RegularProviderSettingSchema = z.object({
  apiKey: SecretSchema.optional(),
});

export const AzureProviderSettingSchema = z.object({
  apiKey: SecretSchema.optional(),
  resourceName: z.string().optional(),
});

export const VertexProviderSettingSchema = z.object({
  // We make this undefined so that it makes existing callsites easier.
  apiKey: z.undefined(),
  projectId: z.string().optional(),
  location: z.string().optional(),
  serviceAccountKey: SecretSchema.optional(),
});

export const ProviderSettingSchema = z.union([
  // Must use more specific type first!
  // Zod uses the first type that matches.
  //
  // We use passthrough as a hack because Azure and Vertex
  // will match together since their required fields overlap.
  //
  // In addition, there may be future provider settings that
  // we may want to preserve (e.g. user downgrades to older version)
  // so doing passthrough keeps these extra fields.
  AzureProviderSettingSchema.passthrough(),
  VertexProviderSettingSchema.passthrough(),
  RegularProviderSettingSchema.passthrough(),
]);

/**
 * Type derived from the ProviderSettingSchema
 */
export type ProviderSetting = z.infer<typeof ProviderSettingSchema>;
export type RegularProviderSetting = z.infer<
  typeof RegularProviderSettingSchema
>;
export type AzureProviderSetting = z.infer<typeof AzureProviderSettingSchema>;
export type VertexProviderSetting = z.infer<typeof VertexProviderSettingSchema>;

export const RuntimeModeSchema = z.enum(["web-sandbox", "local-node", "unset"]);
export type RuntimeMode = z.infer<typeof RuntimeModeSchema>;

export const RuntimeMode2Schema = z.enum(["host", "docker"]);
export type RuntimeMode2 = z.infer<typeof RuntimeMode2Schema>;

export const GitHubSecretsSchema = z.object({
  accessToken: SecretSchema.nullable(),
});
export type GitHubSecrets = z.infer<typeof GitHubSecretsSchema>;

export const GithubUserSchema = z.object({
  email: z.string(),
});
export type GithubUser = z.infer<typeof GithubUserSchema>;

/**
 * Supabase organization credentials.
 * Each organization has its own OAuth tokens.
 */
export const SupabaseOrganizationCredentialsSchema = z.object({
  accessToken: SecretSchema,
  refreshToken: SecretSchema,
  expiresIn: z.number(),
  tokenTimestamp: z.number(),
});
export type SupabaseOrganizationCredentials = z.infer<
  typeof SupabaseOrganizationCredentialsSchema
>;

export const SupabaseSchema = z.object({
  // Map keyed by organizationSlug -> organization credentials
  organizations: z
    .record(z.string(), SupabaseOrganizationCredentialsSchema)
    .optional(),

  // Legacy fields - kept for backwards compat
  accessToken: SecretSchema.optional(),
  refreshToken: SecretSchema.optional(),
  expiresIn: z.number().optional(),
  tokenTimestamp: z.number().optional(),
});
export type Supabase = z.infer<typeof SupabaseSchema>;

export const VercelSchema = z.object({
  accessToken: SecretSchema.optional(),
  refreshToken: SecretSchema.optional(),
  expiresIn: z.number().optional(),
  tokenTimestamp: z.number().optional(),
  authMethod: z.enum(["device", "oauth", "pat"]).optional(),
  /** Team ID from Vercel Integration token exchange (if installed on a team) */
  teamId: z.string().optional(),
  /** Installation/configuration ID from Vercel Integration token exchange */
  installationId: z.string().optional(),
});
export type Vercel = z.infer<typeof VercelSchema>;

export const ExperimentsSchema = z.object({
  // Deprecated
  enableLocalAgent: z.boolean().describe("DEPRECATED").optional(),
  enableSupabaseIntegration: z.boolean().describe("DEPRECATED").optional(),
  enableFileEditing: z.boolean().describe("DEPRECATED").optional(),
});
export type Experiments = z.infer<typeof ExperimentsSchema>;

export const AnyonProBudgetSchema = z.object({
  budgetResetAt: z.string(),
  maxBudget: z.number(),
});
export type AnyonProBudget = z.infer<typeof AnyonProBudgetSchema>;

export const GlobPathSchema = z.object({
  globPath: z.string(),
});

export type GlobPath = z.infer<typeof GlobPathSchema>;

export const AppChatContextSchema = z.object({
  contextPaths: z.array(GlobPathSchema),
  smartContextAutoIncludes: z.array(GlobPathSchema),
  excludePaths: z.array(GlobPathSchema).optional(),
});
export type AppChatContext = z.infer<typeof AppChatContextSchema>;

export type ContextPathResult = GlobPath & {
  files: number;
  tokens: number;
};

export type ContextPathResults = {
  contextPaths: ContextPathResult[];
  smartContextAutoIncludes: ContextPathResult[];
  excludePaths: ContextPathResult[];
};

export const ReleaseChannelSchema = z.enum(["stable", "beta"]);
export type ReleaseChannel = z.infer<typeof ReleaseChannelSchema>;

export const ZoomLevelSchema = z.enum(["90", "100", "110", "125", "150"]);
export type ZoomLevel = z.infer<typeof ZoomLevelSchema>;

export const LanguageSchema = z.enum(["en", "ko"]);
export type Language = z.infer<typeof LanguageSchema>;

export const DeviceModeSchema = z.enum(["desktop", "tablet", "mobile"]);
export type DeviceMode = z.infer<typeof DeviceModeSchema>;

export const OpenCodeConnectionModeSchema = z.enum(["proxy", "direct"]);
export type OpenCodeConnectionMode = z.infer<
  typeof OpenCodeConnectionModeSchema
>;

export const SmartContextModeSchema = z.enum([
  "balanced",
  "conservative",
  "deep",
]);
export type SmartContextMode = z.infer<typeof SmartContextModeSchema>;

/**
 * Zod schema for user settings
 */
export const UserSettingsSchema = z
  .object({
    ////////////////////////////////
    // E2E TESTING ONLY.
    ////////////////////////////////
    isTestMode: z.boolean().optional(),

    ////////////////////////////////
    // DEPRECATED.
    ////////////////////////////////
    enableProSaverMode: z.boolean().optional(),
    anyonProBudget: AnyonProBudgetSchema.optional(),
    runtimeMode: RuntimeModeSchema.optional(),

    ////////////////////////////////
    // ACTIVE FIELDS.
    ////////////////////////////////
    selectedModel: LargeLanguageModelSchema,
    providerSettings: z.record(z.string(), ProviderSettingSchema),
    githubUser: GithubUserSchema.optional(),
    githubAccessToken: SecretSchema.optional(),
    vercelAccessToken: SecretSchema.optional(),
    supabase: SupabaseSchema.optional(),
    vercel: VercelSchema.optional(),
    autoApproveChanges: z.boolean().optional(),
    telemetryConsent: z.enum(["opted_in", "opted_out", "unset"]).optional(),
    telemetryUserId: z.string().optional(),
    hasRunBefore: z.boolean().optional(),
    enableAnyonPro: z.boolean().optional(),
    experiments: ExperimentsSchema.optional(),
    lastShownReleaseNotesVersion: z.string().optional(),
    maxChatTurnsInContext: z.number().optional(),
    thinkingBudget: z.enum(["low", "medium", "high"]).optional(),
    enableProLazyEditsMode: z.boolean().optional(),
    proLazyEditsMode: z.enum(["off", "v1", "v2"]).optional(),
    enableProSmartFilesContextMode: z.boolean().optional(),
    enableProWebSearch: z.boolean().optional(),
    proSmartContextOption: SmartContextModeSchema.optional(),
    selectedTemplateId: z.string(),
    selectedThemeId: z.string().optional(),
    selectedDesignSystemId: z.string().optional(),
    enableSupabaseWriteSqlMigration: z.boolean().optional(),
    skipPruneEdgeFunctions: z.boolean().optional(),
    selectedAgent: z.string().optional(),
    enableBooster: z.boolean().optional(),
    acceptedCommunityCode: z.boolean().optional(),
    zoomLevel: ZoomLevelSchema.optional(),
    language: LanguageSchema.optional(),
    previewDeviceMode: DeviceModeSchema.optional(),

    enableAutoFixProblems: z.boolean().optional(),
    autoExpandPreviewPanel: z.boolean().optional(),
    enableChatCompletionNotifications: z.boolean().optional(),
    enableNativeGit: z.boolean().optional(),
    openCodeConnectionMode: OpenCodeConnectionModeSchema.optional(),
    enableAutoUpdate: z.boolean(),
    releaseChannel: ReleaseChannelSchema,
    runtimeMode2: RuntimeMode2Schema.optional(),
    customNodePath: z.string().optional().nullable(),
    isRunning: z.boolean().optional(),
    lastKnownPerformance: z
      .object({
        timestamp: z.number(),
        memoryUsageMB: z.number(),
        cpuUsagePercent: z.number().optional(),
        systemMemoryUsageMB: z.number().optional(),
        systemMemoryTotalMB: z.number().optional(),
        systemCpuPercent: z.number().optional(),
      })
      .optional(),
    hideLocalAgentNewChatToast: z.boolean().optional(),

    // Auth state (Supabase Auth)
    auth: z
      .object({
        accessToken: SecretSchema.optional(),
        refreshToken: SecretSchema.optional(),
        userId: z.string().optional(),
        email: z.string().optional(),
        displayName: z.string().optional(),
        avatarUrl: z.string().optional(),
        provider: z.enum(["google", "email"]).optional(),
        codeVerifier: z.string().optional(), // temporary, for PKCE flow
      })
      .optional(),

    // Entitlement cache (synced from server)
    entitlementCache: z
      .object({
        plan: z.enum(["free", "starter", "pro", "power"]).optional(),
        isActive: z.boolean().optional(),
        expiresAt: z.string().optional(),
        polarSubscriptionId: z.string().optional(),
        syncedAt: z.string().optional(),
      })
      .optional(),
  })
  // Allow unknown properties to pass through (e.g. future settings
  // that should be preserved if user downgrades to an older version)
  .passthrough();

/**
 * Type derived from the UserSettingsSchema
 */
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export function isAnyonProEnabled(settings: UserSettings): boolean {
  if (isEntitlementProActive(settings)) return true;
  return settings.enableAnyonPro !== false;
}

export function hasAnyonProKey(settings: UserSettings): boolean {
  if (isEntitlementProActive(settings)) return true;
  return !!settings.providerSettings?.auto?.apiKey?.value;
}

const ENTITLEMENT_CACHE_TTL_MS = 72 * 60 * 60 * 1000;

export function isEntitlementProActive(settings: UserSettings): boolean {
  const cache = settings.entitlementCache;
  if (cache?.plan !== "pro" || cache?.isActive !== true) return false;
  if (!cache.syncedAt) return false;
  const syncedAt = new Date(cache.syncedAt).getTime();
  return Date.now() - syncedAt < ENTITLEMENT_CACHE_TTL_MS;
}

export function isSupabaseConnected(settings: UserSettings | null): boolean {
  if (!settings) {
    return false;
  }
  return Boolean(
    settings.supabase?.accessToken ||
    (settings.supabase?.organizations &&
      Object.keys(settings.supabase.organizations).length > 0),
  );
}

export function isTurboEditsV2Enabled(settings: UserSettings): boolean {
  return Boolean(
    isAnyonProEnabled(settings) &&
    settings.enableProLazyEditsMode === true &&
    settings.proLazyEditsMode === "v2",
  );
}

// Define interfaces for the props
export interface SecurityRisk {
  type: "warning" | "danger";
  title: string;
  description: string;
}

export interface FileChange {
  name: string;
  path: string;
  summary: string;
  type: "write" | "rename" | "delete";
  isServerFunction: boolean;
}

export interface CodeProposal {
  type: "code-proposal";
  title: string;
  securityRisks: SecurityRisk[];
  filesChanged: FileChange[];
  packagesAdded: string[];
  sqlQueries: SqlQuery[];
}

export type SuggestedAction =
  | RestartAppAction
  | SummarizeInNewChatAction
  | RefactorFileAction
  | WriteCodeProperlyAction
  | RebuildAction
  | RestartAction
  | RefreshAction
  | KeepGoingAction;

export interface RestartAppAction {
  id: "restart-app";
}

export interface SummarizeInNewChatAction {
  id: "summarize-in-new-chat";
}

export interface WriteCodeProperlyAction {
  id: "write-code-properly";
}

export interface RefactorFileAction {
  id: "refactor-file";
  path: string;
}

export interface RebuildAction {
  id: "rebuild";
}

export interface RestartAction {
  id: "restart";
}

export interface RefreshAction {
  id: "refresh";
}

export interface KeepGoingAction {
  id: "keep-going";
}

export interface ActionProposal {
  type: "action-proposal";
  actions: SuggestedAction[];
}

export interface TipProposal {
  type: "tip-proposal";
  title: string;
  description: string;
}

export type Proposal = CodeProposal | ActionProposal | TipProposal;

export interface ProposalResult {
  proposal: Proposal;
  chatId: number;
  messageId: number;
}

export interface SqlQuery {
  content: string;
  description?: string;
}
