# Authentication Flow Documentation

This directory contains comprehensive documentation of the Anyon Electron app's authentication system.

## 📚 Documentation Files

### 1. **AUTH_FLOW_MAP.md** (Complete Reference)

The most detailed, comprehensive reference guide containing:

- Complete OAuth flow entry points with line numbers and code snippets
- Deep link callback handlers and processing flow
- Full token storage mechanism with encryption details
- Token refresh logic for both Supabase and Vercel
- How tokens are used in API calls
- OAuth proxy server configuration and endpoints
- Security analysis and implications for credential-based flows

**Best for:** Understanding the complete system, implementation details, security measures

### 2. **AUTH_QUICK_REFERENCE.md** (Quick Lookup)

Fast-access guide for developers containing:

- Visual flow overview
- Key files map (entry points, handlers, storage, refresh, clients, proxy)
- Token storage format (JSON structure)
- Token lifecycle for both providers
- Security features summary
- Implementation guide for AI agent credential flow
- Troubleshooting section
- Development notes

**Best for:** Quick lookups, troubleshooting, development reference

### 3. **AUTH_FLOW_DIAGRAMS.md** (Visual Reference)

ASCII diagrams and flowcharts including:

- Complete OAuth flow diagram (end-to-end)
- Token refresh flow
- Data flow for OAuth return handling
- Token storage structure and encryption process
- Component interaction diagram
- Security flow and attack prevention

**Best for:** Understanding architecture visually, presentations, understanding interactions

---

## 🎯 Quick Start: Which File to Read?

- **"I need to understand the complete flow"** → Read `AUTH_FLOW_MAP.md`
- **"I need to find a specific component/handler"** → Use `AUTH_QUICK_REFERENCE.md` key files map
- **"I need to visualize how it works"** → Check `AUTH_FLOW_DIAGRAMS.md`
- **"I'm implementing credential-based login"** → See AUTH_QUICK_REFERENCE.md section 🔧
- **"I need to debug an issue"** → Use AUTH_QUICK_REFERENCE.md troubleshooting section
- **"I want to understand security"** → See AUTH_FLOW_MAP.md section 8 or AUTH_FLOW_DIAGRAMS.md section 6

---

## 🔑 Key Findings Summary

### Current Architecture

- **OAuth 2.0 flows** for both Supabase and Vercel
- **No username/password authentication** exists
- Tokens encrypted with Electron's **safeStorage** (OS-level encryption)
- Automatic **token refresh** for Supabase (5-minute buffer)
- **OAuth proxy server** handles sensitive exchanges (https://server-green-seven.vercel.app)

### Token Storage

- **Location:** `~/.config/anyon/user-settings.json` (platform-specific path)
- **Encryption:** Electron safeStorage + Base64 encoding
- **Multi-org support:** Supabase tokens stored per-organization
- **Format:** `{ value: "encrypted_string", encryptionType: "electron-safe-storage" }`

### Deep Link Protocol

- **Format:** `anyon://{provider}-oauth-return?token=...&refreshToken=...&expiresIn=...`
- **Handlers:** `src/main.ts:438` (main) and handler files
- **React Listener:** `src/contexts/DeepLinkContext.tsx`

### Security

1. **CSRF Protection:** State parameter validated on callback
2. **PKCE Protection (Vercel):** Code verifier validation
3. **Encryption:** OS-level credential storage
4. **No Logging:** Tokens not logged (only protocol/hostname)

---

## 📊 File Statistics

| File                    | Lines | Sections   | Focus                              |
| ----------------------- | ----- | ---------- | ---------------------------------- |
| AUTH_FLOW_MAP.md        | 900+  | 8 major    | Complete reference, implementation |
| AUTH_QUICK_REFERENCE.md | 350+  | 6 major    | Quick lookup, troubleshooting      |
| AUTH_FLOW_DIAGRAMS.md   | 800+  | 6 diagrams | Visual architecture, flows         |

---

## 🚀 For Implementation: AI Agent Credential Flow

To implement credential-based authentication for the AI agent:

**1. OAuth Proxy Endpoints (server/)**

```
POST /api/oauth/supabase/login-with-credentials
POST /api/oauth/vercel/login-with-credentials
```

**2. IPC Handlers (src/ipc/handlers/)**

```
ipc.supabase.loginWithCredentials({ email, password })
ipc.vercel.loginWithCredentials({ apiToken })
```

**3. Reuse Existing Infrastructure**

- Same token storage mechanism (encryption, settings file)
- Same token refresh logic
- Same API clients
- Same deep link handling (if needed)

**See:** AUTH_QUICK_REFERENCE.md section "🔧 Implementation: For AI Agent Credential Flow"

---

## 🔗 Cross-References

### Main Code Files Referenced

- `src/components/SupabaseConnector.tsx` - UI entry point
- `src/components/VercelConnector.tsx` - UI entry point
- `src/main.ts` - Deep link protocol handler
- `src/contexts/DeepLinkContext.tsx` - React event system
- `src/supabase_admin/supabase_return_handler.ts` - OAuth callback handler
- `src/vercel_admin/vercel_return_handler.ts` - OAuth callback handler
- `src/main/settings.ts` - Token encryption/decryption
- `src/supabase_admin/supabase_management_client.ts` - Token refresh logic
- `src/ipc/handlers/vercel_handlers.ts` - API integration
- `src/lib/oauthConfig.ts` - OAuth endpoint configuration
- `server/app/api/oauth/*/` - OAuth proxy server endpoints

### Related Documentation

- `AGENTS.md` - Repository agent guidelines
- `CONTRIBUTING.md` - Contribution guidelines

---

## ✅ Verification Checklist

Before implementing credential-based authentication:

- [ ] Understand current OAuth flow (read AUTH_FLOW_MAP.md)
- [ ] Identify token storage mechanism (safeStorage encryption)
- [ ] Review token refresh logic (auto-refresh for Supabase)
- [ ] Understand component interaction (DeepLinkContext)
- [ ] Plan OAuth proxy modifications for credential endpoints
- [ ] Design permission model for agent credentials
- [ ] Implement token revocation mechanism
- [ ] Test encryption/decryption with user credentials
- [ ] Validate end-to-end flow with credentials

---

## 🤝 Contributing

When modifying authentication flows:

1. Update documentation with line number references
2. Add security implications for changes
3. Test with both Supabase and Vercel
4. Verify token encryption in settings file
5. Check IPC contracts are in sync
6. Update diagrams if architecture changes

---

## 📝 Document Maintenance

These documents were generated from a complete codebase analysis:

- All line numbers are accurate as of analysis date
- Code snippets are verbatim from source files
- Architecture reflects current implementation
- Security analysis is current as of version
- Update these docs when authentication system changes

---

## 💡 Tips for Using These Docs

1. **Bookmark the Quick Reference** - Use it daily for lookups
2. **Print the Diagrams** - They're helpful for understanding architecture
3. **Search line numbers** - Go directly to implementation in IDE
4. **Cross-reference files** - Use file path references to navigate code
5. **Check troubleshooting first** - Many common issues are documented

---

Generated: 2026-02-15
Analysis Tool: Codebase Exploration Specialist
Repository: anyon-ui/SLIT-ANYON
