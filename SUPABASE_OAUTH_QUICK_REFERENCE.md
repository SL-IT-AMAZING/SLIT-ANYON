# Supabase OAuth in Dyad - Quick Reference

## What Gets Enabled After OAuth

```
User Authenticates via Supabase OAuth
         ↓
Access Token Stored in Settings
         ↓
┌─────────────────────────────────────────────────────┐
│ 5 MAJOR CAPABILITIES UNLOCKED                       │
├─────────────────────────────────────────────────────┤
│ 1. PROJECT DISCOVERY                                │
│    • Browse all Supabase projects across orgs      │
│    • See project details, regions, metadata        │
│                                                     │
│ 2. DATABASE BRANCHING                               │
│    • Switch between main and preview branches      │
│    • Dev workflow: branch per feature              │
│                                                     │
│ 3. EDGE FUNCTION DEPLOYMENT                         │
│    • Write TypeScript functions in supabase/       │
│    • Deploy to Supabase serverless environment     │
│    • Automatic shared module bundling              │
│    • Automatic pruning of stale functions          │
│                                                     │
│ 4. SCHEMA INTROSPECTION                             │
│    • Query live database structure                 │
│    • Get all tables, columns, RLS policies         │
│    • Fetch database functions and triggers         │
│                                                     │
│ 5. AI CONTEXT GENERATION                            │
│    • AI understands your database schema           │
│    • AI can write SQL queries                      │
│    • AI can generate edge function code            │
│    • AI suggests migrations                        │
└─────────────────────────────────────────────────────┘
```

## Token Lifecycle

```
OAuth Token Request
  ↓
Token Stored (access + refresh)
  ↓
Token Used in API Calls
  ↓
Automatic Refresh (when < 5 min to expiry)
  ↓
Token Expires → User Must Re-Authenticate
```

## Data Flow for Edge Functions

```
Developer writes code in:
  supabase/functions/hello/index.ts
  supabase/functions/_shared/utils.ts
         ↓
Save triggers file watcher
         ↓
App collects files
         ↓
Creates ZIP with import map
         ↓
POST to Supabase API
         ↓
Supabase bundles + deploys
         ↓
Function lives at:
  https://{projectId}.supabase.co/functions/v1/hello
         ↓
Optionally prunes old functions not in codebase
```

## Multi-Organization Support

```
User has multiple Supabase Organizations:
  org1 (3 projects)
  org2 (5 projects)
  org3 (2 projects)

Token per Organization:
  settings.supabase.organizations = {
    org1: { accessToken, refreshToken, expiresIn },
    org2: { accessToken, refreshToken, expiresIn },
    org3: { accessToken, refreshToken, expiresIn }
  }

Per-App Linking:
  App A → org1/project-5
  App B → org2/project-1
  App C → org3/project-3
```

## IPC Handlers (Frontend → Main Process)

```javascript
// List all connected organizations
ipc.supabase.listOrganizations()
// → [{ slug, name, ownerEmail }, ...]

// Get all projects across orgs
ipc.supabase.listAllProjects()
// → [{ id, name, region, organizationSlug }, ...]

// Get database branches for a project
ipc.supabase.listBranches({ projectId, organizationSlug })
// → [{ id, name, isDefault, projectRef, parentProjectRef }, ...]

// Get edge function logs
ipc.supabase.getEdgeLogs({ projectId, appId, organizationSlug })
// → [{ level, type, message, timestamp, sourceName }, ...]

// Link app to project
ipc.supabase.setAppProject({ appId, projectId, organizationSlug })

// Unlink app from project
ipc.supabase.unsetAppProject({ app })

// Remove organization connection
ipc.supabase.deleteOrganization({ organizationSlug })
```

## Settings Controlled by User

```
📍 In Settings → Supabase Integration

☑️ Write SQL migration files
   When toggled ON: Generates SQL files when schema changes
   When toggled OFF: No migration files

☑️ Keep extra Supabase edge functions
   When toggled ON: Don't delete deployed functions not in codebase
   When toggled OFF: Auto-prune stale functions
```

## Files That Use Supabase Connection

### Core Implementation
- `src/supabase_admin/supabase_management_client.ts` - Main API wrapper
- `src/supabase_admin/supabase_context.ts` - Schema extraction
- `src/supabase_admin/supabase_utils.ts` - Function deployment
- `src/ipc/handlers/supabase_handlers.ts` - IPC handlers
- `src/ipc/types/supabase.ts` - Contracts

### UI Components
- `src/components/SupabaseConnector.tsx` - Per-app project linking
- `src/components/SupabaseIntegration.tsx` - Global settings
- `src/components/SupabaseHubConnector.tsx` - Hub integration

### Chat/AI
- `src/ipc/handlers/chat_stream_handlers.ts` - Passes schema to AI
- `src/ipc/processors/response_processor.ts` - Function deployment during chat

### Settings
- `src/main/settings.ts` - Stores OAuth tokens

## Error Scenarios

| Scenario | What Happens |
|----------|-------------|
| Token Expires | Automatically refreshed (5 min buffer) |
| Refresh Fails | User gets error: "disconnect and reconnect" |
| API Rate Limit | Automatic retry with exponential backoff |
| Network Down | Request fails, user sees error |
| Project Deleted | "Project not found" when trying to link |
| Function Deploy Fails | Error message shows Supabase API error |

## Performance Optimizations

1. **Token Caching** - Don't refresh if valid
2. **File Signature Caching** - Skip re-reading unchanged `_shared/` files
3. **Parallel Requests** - Fetch org details and members concurrently
4. **Bulk Function Updates** - Update all functions at once, not individually
5. **Rate Limit Handling** - Retry with exponential backoff

## Key Concepts

**Access Token** - Bearer token that expires, used in API requests
**Refresh Token** - Long-lived token used to get new access tokens
**Organization** - Container for Supabase projects, owned by user
**Project** - Supabase instance with database, functions, auth, storage
**Branch** - Database copy/preview, linked to parent project
**Edge Function** - TypeScript function deployed to Supabase Edge Runtime
**Shared Module** - Code in `_shared/` included in all function deployments
