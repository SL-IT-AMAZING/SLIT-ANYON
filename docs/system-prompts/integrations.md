# Integration System Prompts

This document covers prompts for external service integrations in Anyon.

## Supabase Integration

### Source

- **File**: `src/prompts/supabase_prompt.ts`
- **Exports**:
  - `getSupabaseAvailableSystemPrompt(supabaseClientCode: string)`
  - `SUPABASE_NOT_AVAILABLE_SYSTEM_PROMPT`

---

## Supabase Available Prompt

Used when Supabase is configured for the project.

### Supabase Client Setup

Check if client exists at `src/integrations/supabase/client.ts`.

If it doesn't exist:

1. Create the client file with provided code
2. Add `@supabase/supabase-js` dependency

### Authentication Setup

When adding auth/login:

1. **User Profile Assessment**
   - Confirm if profile data storage needed (username, roles, avatars)
   - If yes: Create profiles table migration
   - If no: Proceed with basic auth

2. **Core Authentication Setup**
   - **UI Components**: Use `@supabase/auth-ui-react`, apply themes, skip third-party providers unless specified
   - **Session Management**: Wrap app with `SessionContextProvider`, implement `onAuthStateChange`
   - **Error Handling**: Implement `AuthApiError` handling, monitor auth state, DO NOT use `onError` prop (unsupported)

### Database with Row Level Security (RLS)

**SECURITY WARNING: ALWAYS ENABLE RLS ON ALL TABLES**

Without RLS policies, ANY user can read, insert, update, or delete ANY data.

#### Required Steps

1. Enable RLS on every table:

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

2. Create policies for each operation (SELECT, INSERT, UPDATE, DELETE)

3. Common patterns:
   - **Public read**: `FOR SELECT USING (true)` (only if specifically requested)
   - **User-specific**: `USING (auth.uid() = user_id)`

#### Security Checklist

- [ ] RLS enabled on table
- [ ] Appropriate SELECT policies
- [ ] Appropriate INSERT policies
- [ ] Appropriate UPDATE policies
- [ ] Appropriate DELETE policies
- [ ] Policies follow least privilege
- [ ] User can only access their own data
- [ ] Policies include `TO authenticated`

### Edge Functions

#### When to Use

- API-to-API communications
- Handling sensitive API tokens/secrets
- Backend work requiring server-side logic

#### Key Implementation Principles

| Principle            | Details                                                                    |
| -------------------- | -------------------------------------------------------------------------- |
| **Location**         | `supabase/functions/` folder, each in standalone directory with `index.ts` |
| **Shared utilities** | `supabase/functions/_shared/`                                              |
| **Deployment**       | Automatic after code update                                                |
| **Configuration**    | Do NOT edit `config.toml`                                                  |
| **Invocation**       | Use `supabase.functions.invoke()`, avoid raw HTTP                          |
| **Authentication**   | `verify_jwt` is FALSE by default - handle manually                         |

#### CORS Headers (Required)

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

if (req.method === "OPTIONS") {
  return new Response(null, { headers: corsHeaders });
}
```

#### Logging Rule

**CRITICAL**: Every log statement MUST start with `[function-name]`

```typescript
console.log("[function-name] message", { data });
console.error("[function-name] error message", { error });
```

#### Pre-configured Secrets

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

For new secrets: Direct user to Supabase Console > Project > Edge Functions > Manage Secrets

#### Template

```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Manual authentication (verify_jwt is false)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  // ... function logic
});
```

---

## Supabase Not Available Prompt

Used when Supabase is NOT configured for the project.

### Purpose

Prompt user to add Supabase integration when they request features requiring auth, database, or server-side functions.

### Integration Tag

```xml
<anyon-add-integration provider="supabase"></anyon-add-integration>
```

### Full Prompt

```
If the user wants to use supabase or do something that requires auth, database or server-side functions (e.g. loading API keys, secrets),
tell them that they need to add supabase to their app.

The following response will show a button that allows the user to add supabase to their app.

<anyon-add-integration provider="supabase"></anyon-add-integration>

# Examples

## Example 1: User wants to use Supabase

### User prompt
I want to use supabase in my app.

### Assistant response
You need to first add Supabase to your app.

<anyon-add-integration provider="supabase"></anyon-add-integration>

## Example 2: User wants to add auth to their app

### User prompt
I want to add auth to my app.

### Assistant response
You need to first add Supabase to your app and then we can add auth.

<anyon-add-integration provider="supabase"></anyon-add-integration>
```
