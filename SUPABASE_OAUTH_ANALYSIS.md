# Supabase OAuth Integration Analysis - Anyon App

## Overview

The Anyon app (Electron-based) uses Supabase OAuth authentication to enable powerful backend integration capabilities. After users authenticate via OAuth, the access token is stored in settings and used to unlock database, edge function, and project management features.

---

## 1. OAuth Flow & Token Management

### Authentication Flow

- **Endpoint**: `oauthEndpoints.supabase.login` (Supabase OAuth URL)
- **Token Storage**: Settings file (`settings.supabase`)
- **Stored Credentials**:
  - `accessToken` - Bearer token for API requests
  - `refreshToken` - Used to refresh the access token
  - `expiresIn` - Token expiration time (in seconds)
  - `tokenTimestamp` - When the token was obtained

### Token Refresh Strategy

- **Automatic Refresh**: Tokens are automatically refreshed when they're within 5 minutes of expiration
- **Refresh Handler**: `refreshSupabaseToken()` makes POST request to Supabase refresh endpoint
- **Multi-Organization Support**: Each organization has its own access token + refresh token pair

### File Structure

```
src/supabase_admin/
├── supabase_management_client.ts  # Main API client & token management
├── supabase_context.ts            # Context generation for AI
├── supabase_schema_query.ts        # SQL queries for schema introspection
├── supabase_return_handler.ts      # OAuth return handler
└── supabase_utils.ts              # Edge function utilities
```

---

## 2. Core Functionality Enabled by Supabase Connection

### A. **Project & Organization Management**

- **List Organizations**: Fetch all connected Supabase organizations with details
- **List Projects**: Get all projects across all connected organizations
- **Fetch Project Details**: Get project name, metadata, and settings
- **Fetch Organization Members**: Get team members and their roles

**IPC Handlers**:

- `supabase:list-organizations` - Returns org slug, name, owner email
- `supabase:list-all-projects` - Returns id, name, region, organizationSlug for each project
- `supabase:delete-organization` - Disconnect an organization

**Files**:

- `src/ipc/handlers/supabase_handlers.ts`
- `src/ipc/types/supabase.ts`

---

### B. **Database Branch Management**

- **List Database Branches**: Fetch preview branches and main branch for a Supabase project
- **Branch Selection**: Users can select which branch their app connects to

**Data Returned**:

- `id`, `name`, `is_default`, `project_ref`, `parent_project_ref`

**IPC Handler**: `supabase:list-branches`

**Use Case**: Multi-tenant dev environments with database previews per PR

---

### C. **Edge Function Deployment & Management**

The system can deploy, list, update, and delete Supabase Edge Functions (serverless TypeScript functions).

#### Deployment Process

```
1. Collect function files from supabase/functions/{functionName}/
2. Collect shared modules from supabase/functions/_shared/
3. Build import map
4. Create multipart FormData with all files
5. POST to https://api.supabase.com/v1/projects/{id}/functions/deploy
6. Bulk update functions to activate them
7. Optionally prune "dangling" functions not in codebase
```

**Deployed Function Response**:

- `id`, `slug`, `name`, `status` (ACTIVE | REMOVED | THROTTLED)
- `version`, `created_at`, `updated_at`
- `verify_jwt`, `import_map`, `entrypoint_path`

**Functions Available**:

- `deploySupabaseFunction()` - Deploy a single edge function
- `listSupabaseFunctions()` - List deployed functions
- `deleteSupabaseFunction()` - Delete a function
- `bulkUpdateFunctions()` - Update multiple functions atomically
- `deployAllSupabaseFunctions()` - Deploy all functions with pruning

**Advanced Features**:

- **Shared Module Support**: `_shared/` directory content included in all function deployments
- **File Caching**: Shared file signatures cached to avoid re-reading unchanged files
- **Bundle Mode**: `bundleOnly=true` bundles code without immediate activation
- **Pruning**: Automatically deletes deployed functions not present in codebase (configurable)

**UI Setting**: Toggle `skipPruneEdgeFunctions` in app settings

---

### D. **Database Schema Introspection**

The system can query the live Supabase database schema using the access token.

#### Schema Query Includes

- **Tables**: Names, descriptions, columns, RLS status
- **Columns**: Name, data type, nullable, default values
- **RLS Policies**: Name, command (SELECT/UPDATE/INSERT/DELETE), conditions
- **Database Functions**: Name, arguments, return type, language, volatility, source code
- **Triggers**: Name, table, timing, event, action statement

#### Context Generation

The schema is used to generate AI context via `getSupabaseContext()`:

- Publishable API key (anon key)
- Secret environment variable names
- Full schema JSON for AI understanding

**SQL Execution**: `executeSupabaseSql()` - Run arbitrary SQL against the project

---

### E. **Edge Function Logging**

- **Get Logs**: Fetch edge function execution logs from Supabase
- **Log Filtering**: Query by timestamp range
- **Metadata**: Level (info/warn/error), type (edge-function), message, function name

**IPC Handler**: `supabase:get-edge-logs`

- Returns `ConsoleEntry` objects formatted for the app's console

**Logging Features**:

- Extract function name from log messages: `[function-name] message`
- Convert microsecond timestamps to milliseconds
- Map severity levels to standard log levels

---

## 3. App-to-Supabase Project Linking

### Association Model

Each Anyon **app** can be linked to one Supabase **project**:

```
App {
  supabaseProjectId: string         // Current branch project ID
  supabaseParentProjectId?: string  // Parent project (for preview branches)
  supabaseOrganizationSlug?: string // Which org owns the project
  supabaseProjectName?: string      // Cached project name
}
```

### IPC Handlers for Linking

- `supabase:set-app-project` - Link app to a project
- `supabase:unset-app-project` - Remove the link

### UI Component

`SupabaseConnector` component provides:

1. Project selection dropdown (grouped by organization)
2. Branch selection for linked project
3. Organization management (disconnect organizations)
4. Link to external Supabase dashboard

---

## 4. AI Chat Integration

### Supabase Context in Chat

When an app has a linked Supabase project, the AI receives:

- Full database schema (via `getSupabaseContext()`)
- Project publishable key
- List of environment secrets
- This enables AI to understand and generate appropriate database queries

**Used in**: `src/ipc/handlers/chat_stream_handlers.ts`

- Passed to AI system prompt when processing chat messages
- Enables AI to write SQL, understand table relationships, etc.

### Client Code Generation

`getSupabaseClientCode()` generates:

```typescript
import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://{projectId}.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "{key}";
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

---

## 5. UI Components

### SupabaseConnector.tsx (Per-App)

Located in: `src/components/SupabaseConnector.tsx`

**States**:

1. **Connected + Project Linked**: Shows project card with branch selector
2. **Connected + No Project**: Shows project selector dropdown (grouped by org)
3. **Not Connected**: Shows connect button

**Features**:

- List connected organizations with owner email
- Refresh project list
- Add new organizations
- Select project by organization + project ID
- Switch database branches
- Disconnect project
- Deep link handling for OAuth callback

### SupabaseIntegration.tsx (Global Settings)

Located in: `src/components/SupabaseIntegration.tsx`

**Features**:

- Show count of connected organizations
- List all connected organizations with disconnect option
- Toggle `enableSupabaseWriteSqlMigration` - Generate SQL migration files
- Toggle `skipPruneEdgeFunctions` - Keep extra deployed functions

---

## 6. Settings Management

### Schema

```typescript
settings.supabase = {
  // Legacy single-account support (if only one org)
  accessToken: { value: string }
  refreshToken: { value: string }
  expiresIn: number
  tokenTimestamp: number

  // Multi-organization support
  organizations: {
    [organizationSlug: string]: {
      accessToken: { value: string }
      refreshToken: { value: string }
      expiresIn: number
      tokenTimestamp: number
    }
  }
}

// Related settings
settings.enableSupabaseWriteSqlMigration: boolean
settings.skipPruneEdgeFunctions: boolean
```

### Token Validation

`isSupabaseConnected()` checks if user has authenticated at least once

---

## 7. IPC Contract Summary

**Channel**: `supabase:*`

| Handler               | Input                                                     | Output                     | Purpose                      |
| --------------------- | --------------------------------------------------------- | -------------------------- | ---------------------------- |
| `list-organizations`  | void                                                      | SupabaseOrganizationInfo[] | List all connected orgs      |
| `delete-organization` | { organizationSlug }                                      | void                       | Disconnect an org            |
| `list-all-projects`   | void                                                      | SupabaseProject[]          | Get all projects across orgs |
| `list-branches`       | { projectId, organizationSlug? }                          | SupabaseBranch[]           | Get database branches        |
| `get-edge-logs`       | { projectId, timestampStart?, appId, organizationSlug }   | ConsoleEntry[]             | Fetch function logs          |
| `set-app-project`     | { appId, projectId, parentProjectId?, organizationSlug? } | void                       | Link app to project          |
| `unset-app-project`   | { app }                                                   | void                       | Unlink app from project      |

---

## 8. Error Handling

### Token Refresh Failures

- User must reconnect via Settings
- Clear error message directs to disconnect/reconnect flow

### API Rate Limiting

- `retryWithRateLimit()` utility with exponential backoff
- Detects 429 responses and retries automatically

### Network/Permission Errors

- Wrapped in `SupabaseManagementAPIError`
- Includes HTTP status and response body
- Detailed error messages for debugging

---

## 9. Security Considerations

### Token Storage

- Stored in local settings file (persistent)
- Refresh tokens stored securely (same as access tokens)
- Token expiration monitored (5-minute buffer)

### API Usage

- Access token used as Bearer token in Authorization header
- All requests to `api.supabase.com/v1/*`
- Isolated per organization

### Scope Limitations

- Token obtained via OAuth has specific scopes
- Cannot access user data without consent
- Function deployment requires appropriate project permissions

---

## 10. Summary: What Supabase Connection Enables

| Feature                | Enables                                                 |
| ---------------------- | ------------------------------------------------------- |
| **Project Discovery**  | Browse all your Supabase projects across organizations  |
| **Database Branching** | Switch between main database and preview branches       |
| **Edge Functions**     | Deploy, update, delete serverless TypeScript functions  |
| **Schema Access**      | Query live database schema, tables, policies, functions |
| **AI Code Generation** | AI understands your schema and can write SQL/functions  |
| **Logging**            | Monitor edge function execution in real-time            |
| **Migration Tracking** | Optionally generate SQL migration files                 |
| **Multi-Org**          | Manage multiple Supabase organizations from one place   |

---

## Key Files Reference

| File                            | Purpose                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| `supabase_management_client.ts` | Main API client, token refresh, org/project/branch listing |
| `supabase_context.ts`           | Schema queries, context generation, client code generation |
| `supabase_utils.ts`             | Edge function deployment, pruning, extraction utilities    |
| `supabase_handlers.ts`          | IPC handlers for all Supabase operations                   |
| `SupabaseConnector.tsx`         | Per-app UI for project linking and branch selection        |
| `SupabaseIntegration.tsx`       | Global Supabase settings and organization management       |
