# Implementation Plan: tweakcn Community Themes Integration

## Goal

Integrate 50+ tweakcn.com community themes into the Electron app's design system library, appearing as additional cards in the same grid as existing 6 design systems, with a new preview app and "Use This" scaffolding flow.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  BUILD TIME                                                     │
│                                                                 │
│  scripts/scrape-tweakcn.ts ──► src/shared/tweakcn-themes.json  │
│  (Playwright headless)         (bundled with app)               │
│                                                                 │
│  preview-apps/preview-themes/  ──► preview-dists/preview-themes │
│  (Vite + React + TW v4)           (built by build-previews.sh) │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  RUNTIME                                                        │
│                                                                 │
│  ┌──────────────────┐    IPC    ┌─────────────────────────────┐│
│  │  Renderer         │◄────────►│  Main Process               ││
│  │                   │          │                              ││
│  │  ThemesPage       │          │  theme_handlers.ts           ││
│  │   ├─ DesignSystem │          │   ├─ getThemes()            ││
│  │   │  Gallery      │          │   │  (loads JSON bundle)    ││
│  │   │  (6 cards)    │          │   └─ getPreviewUrl()        ││
│  │   │               │          │                              ││
│  │   └─ ThemeGallery │          │  createFromTemplate.ts       ││
│  │      (50+ cards)  │          │   └─ injectThemeCssVars()   ││
│  │                   │          │      (oklch → HSL + inject) ││
│  │  ThemePreview     │          │                              ││
│  │   Dialog          │          │  preview-protocol.ts         ││
│  │   ├─ iframe ──────│──────────│──► anyon-preview://themes/  ││
│  │   │  (postMsg)    │          │                              ││
│  │   └─ 5 tabs       │          └─────────────────────────────┘│
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Data Model: Separate `TweakcnTheme` type (NOT extending `DesignSystem`)

**Rationale**: `DesignSystem` has many inapplicable fields (`libraryName`, `scaffoldDir`, `componentCount`, `componentStrategy`, `importPattern`). Extending it would require making half the fields optional. Instead:

- Define `TweakcnTheme` with theme-specific fields
- Create `DesignSystemOrTheme` discriminated union for the UI grid
- Theme cards and design system cards render differently but coexist in the same grid

```typescript
interface TweakcnTheme {
  id: string; // e.g., "tweakcn-modern-minimal"
  slug: string; // e.g., "modern-minimal" (original tweakcn name)
  displayName: string; // e.g., "Modern Minimal"
  source: "builtin" | "community"; // built-in presets vs community themes
  author?: { name: string }; // community themes only
  tags: string[]; // e.g., ["minimal", "professional"]
  likeCount: number; // community popularity signal
  styles: {
    light: Record<string, string>; // oklch CSS variables
    dark: Record<string, string>; // oklch CSS variables
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  radius: string; // e.g., "0.375rem"
  colorScheme: {
    // for card gradient thumbnail fallback
    primary: string;
    secondary: string;
    background: string;
  };
}
```

### 2. Scraping: Two-source approach

| Source           | Method                        | Content                                      |
| ---------------- | ----------------------------- | -------------------------------------------- |
| Built-in presets | `GET /r/themes/registry.json` | ~15 curated themes with full registry format |
| Community themes | Playwright headless browser   | 50+ user-created themes via infinite scroll  |

The scraper runs at build time, outputs a single `tweakcn-themes.json` file bundled with the app.

**Key detail**: tweakcn uses Next.js server actions (not REST APIs) for community theme loading. The `useCommunityThemes` hook calls the `getCommunityThemes` server action which does cursor-based pagination (20 themes per page). The community page uses an `IntersectionObserver` to trigger infinite scroll.

**Scraping strategy**:

1. Fetch `/r/themes/registry.json` directly for built-in presets
2. Use Playwright to load `/community?sort=popular`, scroll repeatedly to trigger infinite loading
3. Extract theme data from the rendered DOM (each `CommunityThemeCard` has the theme data bound to it)
4. Alternative: Intercept Next.js RSC responses during scrolling to capture serialized `CommunityTheme` objects

### 3. Preview App: Single dynamic app with postMessage theme switching

Unlike existing preview apps (one per design system), `preview-themes` is a single app that serves ALL themes. The parent sends theme CSS variables via postMessage, and the preview app applies them to `:root` dynamically.

### 4. Color Format: oklch native in preview, oklch→HSL at scaffold time

- **preview-themes app**: Uses Tailwind v4 + oklch natively (no conversion)
- **"Use This" scaffolding**: Converts oklch → HSL when injecting into `scaffold/src/globals.css`, since the existing scaffold uses `hsl(var(--primary))` in its Tailwind config

### 5. Preview Tabs: Match tweakcn.com exactly

| Tab             | Width Req | Content                                  |
| --------------- | --------- | ---------------------------------------- |
| Cards (default) | Any       | 14 card variants from shadcn/ui examples |
| Dashboard       | 1400px+   | Full dashboard layout                    |
| Mail            | 1300px+   | Email client UI                          |
| Pricing         | Any       | Pricing page                             |
| Color Palette   | Any       | CSS variable swatches in 7 groups        |

### 6. Grid Layout: Themes section below design systems

The themes page has two sections:

- **Design Systems** (existing 6 cards) — unchanged
- **Community Themes** (50+ cards) — new section below with search/filter by tags

---

## Parallel Task Graph

### WAVE 1: Foundation (all independent, fully parallelizable)

#### Task 1.1: Scraper Script

- **Category**: Build tooling
- **Complexity**: Medium
- **Skills**: Node.js, Playwright
- **Files to create**:
  - `scripts/scrape-tweakcn.ts` — Main scraper
  - `scripts/tsconfig.scraper.json` — TypeScript config for scripts
- **Files to modify**:
  - `package.json` — Add `scrape-themes` script, add `playwright` devDependency
- **Details**:
  1. **Built-in presets**: Fetch `https://tweakcn.com/r/themes/registry.json`, parse items array. Each item has `name`, `title`, `cssVars.light`, `cssVars.dark`, `cssVars.theme` (fonts, radius). Transform into our `TweakcnTheme` shape.
  2. **Community themes**: Use Playwright to:
     - Navigate to `https://tweakcn.com/community?sort=popular`
     - Wait for initial theme cards to render
     - Repeatedly scroll to bottom to trigger IntersectionObserver (loads 20 per page)
     - After each scroll batch, extract theme data from the DOM
     - The `CommunityThemeCard` renders color swatches from the theme styles — need to extract the underlying data
     - **Alternative**: Monitor network/RSC responses during scrolling to capture the serialized `CommunityTheme` objects (contains full `styles.light` and `styles.dark` with all CSS vars)
  3. **Dedup**: Built-in presets may overlap with community themes — dedup by name
  4. **Output**: Write `src/shared/tweakcn-themes.json` conforming to `TweakcnTheme[]` schema
  5. **Validation**: Use Zod schema to validate each theme before writing
  6. **Error handling**: If a theme fails validation, log warning and skip (don't fail entire scrape)

#### Task 1.2: Shared Type Definitions

- **Category**: Types/interfaces
- **Complexity**: Low
- **Skills**: TypeScript
- **Files to create**:
  - `src/shared/tweakcnThemes.ts` — `TweakcnTheme` interface, Zod schema, loader function
- **Files to modify**:
  - `src/shared/designSystems.ts` — Export `DesignSystemOrTheme` discriminated union type
- **Details**:

  ```typescript
  // src/shared/tweakcnThemes.ts
  export interface TweakcnTheme { ... }  // As defined above
  export const tweakcnThemeSchema = z.object({ ... });
  export function getTweakcnThemes(): TweakcnTheme[] { ... }  // Loads from JSON
  export function getTweakcnThemeById(id: string): TweakcnTheme | undefined { ... }

  // Addition to src/shared/designSystems.ts
  export type DesignSystemOrTheme =
    | { type: "designSystem"; data: DesignSystem }
    | { type: "theme"; data: TweakcnTheme };
  ```

#### Task 1.3: Preview App Skeleton

- **Category**: Frontend, Vite setup
- **Complexity**: Medium
- **Skills**: React, Vite, Tailwind v4
- **Files to create** (entire `preview-apps/preview-themes/` directory):
  - `package.json` — React 19, Tailwind v4, Vite, shadcn/ui components
  - `vite.config.ts` — Standard config with `@` path alias
  - `tsconfig.json`, `tsconfig.app.json`
  - `index.html`
  - `src/main.tsx` — Entry point
  - `src/App.tsx` — Tab navigation + postMessage handler skeleton
  - `src/globals.css` — Default shadcn theme CSS vars (oklch format) + Tailwind v4 `@theme` directive
  - `src/lib/utils.ts` — `cn()` helper
  - `src/lib/postMessage.ts` — PostMessage protocol handler (nonce, origin validation)
  - `components.json` — shadcn/ui CLI configuration
- **Details**:
  - Use Tailwind v4 with oklch color format natively
  - CSS variables stored as full `oklch(...)` values, NOT bare numbers
  - Tailwind v4 `@theme` directive maps CSS vars directly (no `hsl()` wrapper needed)
  - PostMessage handler listens for `APPLY_THEME` message type (new, in addition to existing `NAVIGATE_COMPONENT` / `HANDSHAKE_ACK`)
  - Component registry with 5 tabs instead of 8 (matching tweakcn)
  - Install all needed shadcn/ui components via CLI during setup

#### Task 1.4: oklch → HSL Conversion Utility

- **Category**: Utility
- **Complexity**: Low-Medium
- **Skills**: Color science, TypeScript
- **Files to create**:
  - `src/shared/colorConvert.ts` — `oklchToHsl(oklchString: string): string` function
- **Details**:
  - Parse `oklch(L C H)` format strings
  - Convert via oklch → OKLAB → linear-sRGB → sRGB → HSL
  - Output format: `H S% L%` (bare HSL values matching existing scaffold format)
  - Handle edge cases: achromatic colors (C=0), out-of-gamut clamping
  - **Recommendation**: Use `culori` npm library for robust conversion instead of hand-rolling the math
  - Non-color variables (radius, spacing, font-family, shadows) pass through unchanged

---

### WAVE 2: Core Implementation (depends on Wave 1)

#### Task 2.1: Theme JSON Bundle Generation

- **Depends on**: 1.1 (scraper), 1.2 (types)
- **Category**: Build tooling
- **Complexity**: Low
- **Files to modify**:
  - `scripts/scrape-tweakcn.ts` — Integrate with TweakcnTheme Zod schema
  - `package.json` — Add `build:themes` script
- **Details**:
  - Run scraper → validate with Zod → write `src/shared/tweakcn-themes.json`
  - **Recommendation**: Commit the JSON file so builds are deterministic and don't require network access. Add a `refresh-themes` script for manual updates.
  - Each theme gets `colorScheme` derived from its `primary`, `secondary`, and `background` CSS vars (extracted from `styles.light`)
  - Generate stable IDs: `tweakcn-${slug}` for built-in presets, `tweakcn-community-${sanitizedName}` for community themes

#### Task 2.2: Preview App — Tab Components

- **Depends on**: 1.3 (preview skeleton)
- **Category**: Frontend, UI components
- **Complexity**: HIGH (most code-heavy task)
- **Skills**: React, shadcn/ui, Tailwind v4
- **Files to create** (in `preview-apps/preview-themes/src/`):
  - `previews/index.ts` — Tab registry (5 entries)
  - `previews/CardsPreview.tsx` — 14 card variants
  - `previews/DashboardPreview.tsx` — Full dashboard layout
  - `previews/MailPreview.tsx` — Email client UI
  - `previews/PricingPreview.tsx` — Pricing page
  - `previews/ColorPalettePreview.tsx` — CSS variable color swatches
  - `components/ui/*.tsx` — All needed shadcn/ui components
- **Details**:
  - **Cards tab**: Replicate tweakcn's 14 card variants (stats, calendar, chat, forms, payments, create-account, team-members, cookie-settings, share, report-issue, exercise-minutes, activity-goal, github-card, date-picker). Reference: tweakcn source `components/theme-preview/cards/` directory.
  - **Dashboard tab**: Full dashboard with sidebar, charts, metrics. Requires min-width 1400px container.
  - **Mail tab**: Email client with inbox list + message view. Requires min-width 1300px.
  - **Pricing tab**: Pricing tiers page with 3 plan comparison.
  - **Color Palette tab**: Groups CSS vars into 7 categories (Base, Primary/Secondary, Muted/Accent, Destructive, Sidebar, Chart, Typography/Radius) and renders color swatches with variable names + values. Reads values live from computed styles.
  - This task can be subdivided: one developer per tab.

#### Task 2.3: IPC Contracts for Themes

- **Depends on**: 1.2 (types)
- **Category**: IPC layer
- **Complexity**: Low
- **Skills**: TypeScript, Zod
- **Files to create**:
  - `src/ipc/types/themes.ts` — Theme IPC contracts + client
  - `src/ipc/handlers/theme_handlers.ts` — Handler implementations
- **Files to modify**:
  - `src/ipc/types/index.ts` — Re-export theme contracts/client, add to `ipc` namespace
  - `src/ipc/ipc_host.ts` — Register theme handlers
- **Contracts**:
  ```typescript
  getThemes: defineContract({
    channel: "get-themes",
    input: z.void(),
    output: z.array(TweakcnThemeSchema),
  });
  getThemeById: defineContract({
    channel: "get-theme-by-id",
    input: z.object({ themeId: z.string() }),
    output: TweakcnThemeSchema.nullable(),
  });
  getThemePreviewUrl: defineContract({
    channel: "get-theme-preview-url",
    input: z.object({ themeId: z.string() }),
    output: z.object({ url: z.string(), nonce: z.string() }),
  });
  ```

#### Task 2.4: Preview App — PostMessage Theme Injection

- **Depends on**: 1.3 (preview skeleton)
- **Category**: Frontend, protocol
- **Complexity**: Medium
- **Files to modify**:
  - `preview-apps/preview-themes/src/App.tsx` — Add `APPLY_THEME` handler
  - `preview-apps/preview-themes/src/lib/postMessage.ts` — Theme application logic
- **New message types**:
  ```typescript
  // Parent → iframe
  APPLY_THEME: {
    type: "APPLY_THEME";
    nonce: string;
    styles: {
      light: Record<string, string>;
      dark: Record<string, string>;
    }
    mode: "light" | "dark";
  }
  SET_THEME_MODE: {
    type: "SET_THEME_MODE";
    nonce: string;
    mode: "light" | "dark";
  }
  ```
- **Handler logic**: Iterates `styles[mode]`, calls `document.documentElement.style.setProperty(--${key}, value)` for each variable. Also handles Google Fonts loading for custom `font-sans`/`font-serif`/`font-mono` values.
- On `PREVIEW_READY`, sends component registry with 5 tabs (Cards, Dashboard, Mail, Pricing, Color Palette)

---

### WAVE 3: Integration (depends on Wave 2)

#### Task 3.1: Protocol + Build System Updates

- **Depends on**: 2.2 (preview tabs), 2.4 (postMessage)
- **Category**: Electron, build tooling
- **Complexity**: Low
- **Files to modify**:
  - `src/main/preview-protocol.ts` — Add `"themes"` to the allowlist
  - `src/shared/designSystems.ts` — Add `"themes"` to `DESIGN_SYSTEM_IDS` array (or create separate `PREVIEW_APP_IDS` that unions design systems + "themes")
  - `scripts/build-previews.sh` — Add `"themes"` to `PREVIEW_IDS` array
- **Details**:
  - Protocol handler already supports any ID in the allowlist — just adding the string suffices
  - Build script: add `preview-themes` to the iteration, ensure `npm install && npm run build` works
  - Output: `preview-apps/preview-themes/dist/` → `preview-dists/preview-themes/dist/`

#### Task 3.2: Theme Data Loading in Main Process

- **Depends on**: 2.1 (JSON bundle), 2.3 (IPC contracts)
- **Category**: Main process
- **Complexity**: Low
- **Files to modify**:
  - `src/ipc/handlers/theme_handlers.ts` — Implement actual data loading from JSON bundle
- **Details**:
  - `getThemes` handler: Import and return the JSON bundle (already validated at build time)
  - `getThemeById` handler: Filter by ID from the bundle
  - `getThemePreviewUrl` handler: Generate nonce, construct `anyon-preview://themes/index.html?nonce=...&parentOrigin=...` URL
  - Reuse existing `preview_server_manager.ts` pattern for nonce tracking

#### Task 3.3: Preview Hook for Themes

- **Depends on**: 2.3 (IPC), 2.4 (postMessage)
- **Category**: Renderer hooks
- **Complexity**: Medium
- **Files to create**:
  - `src/hooks/useThemePreview.ts` — React hook for theme preview communication
- **Details**:
  - Similar to existing `useDesignSystemPreview.ts` but extended:
    1. Calls `ipc.themes.getThemePreviewUrl({ themeId })`
    2. Loads iframe with returned URL
    3. On `PREVIEW_READY`: sends `HANDSHAKE_ACK` + immediately sends `APPLY_THEME` with the theme's CSS vars
    4. Exposes `navigateToTab(tabId)` to switch Cards/Dashboard/Mail/Pricing/Colors
    5. Exposes `setThemeMode(mode)` to toggle light/dark
    6. Cleanup on unmount: calls `ipc.designSystem.stopActivePreview()`

---

### WAVE 4: UI Components (depends on Wave 3)

#### Task 4.1: Theme Gallery Component

- **Depends on**: 3.2 (data loading), 3.1 (protocol)
- **Category**: UI components
- **Complexity**: Medium
- **Skills**: React, TanStack Query
- **Files to create**:
  - `src/components/ThemeGallery.tsx` — Grid of theme cards with search/filter
  - `src/components/ThemeCard.tsx` — Individual theme card with live preview
  - `src/hooks/useThemes.ts` — TanStack Query hook for fetching themes
- **Files to modify**:
  - `src/lib/queryKeys.ts` — Add `themes` key factory
  - `src/pages/themes.tsx` — Add "Community Themes" section below design systems
- **Details**:
  - **ThemeGallery**: Filter by tags (48 tags from tweakcn's tag set), search by name, sort by popularity/name
  - **ThemeCard**: Shows:
    - Color gradient placeholder (from `colorScheme`) + live iframe thumbnail on viewport intersection
    - Theme name + author name
    - Tag pills (max 3 shown)
    - Like count badge
    - "Preview" and "Use This" buttons
  - **ThemesPage integration**: Add a divider + "Community Themes" heading + ThemeGallery below the existing DesignSystemGallery
  - State management: `previewThemeId` and `createWithThemeId` state vars (parallel to existing design system state)

#### Task 4.2: Theme Preview Dialog

- **Depends on**: 3.3 (preview hook), 4.1 (gallery)
- **Category**: UI components
- **Complexity**: Medium
- **Files to create**:
  - `src/components/ThemePreviewDialog.tsx` — Full-screen preview with 5 tabs
- **Details**:
  - Reuse `DesignSystemPreviewDialog` layout pattern but with theme-specific sidebar:
    - 5 tab buttons: Cards, Dashboard, Mail, Pricing, Color Palette
    - Light/Dark mode toggle in the header bar
    - Theme name, author, tags displayed in header
  - "Use This Theme" button triggers create-app flow
  - Uses `useThemePreview` hook for iframe communication
  - Dialog dimensions: 95vw × 90vh (same as existing)

#### Task 4.3: Scaffolding Integration ("Use This" for Themes)

- **Depends on**: 1.4 (color conversion), 3.2 (data loading)
- **Category**: Main process, scaffolding
- **Complexity**: Medium
- **Files to create**:
  - `src/ipc/handlers/injectThemeCss.ts` — CSS variable injection utility
- **Files to modify**:
  - `src/ipc/handlers/createFromTemplate.ts` — Add theme-aware branch
  - `src/ipc/types/app.ts` — Add `themeId` to `CreateAppParamsSchema`
  - `src/ipc/handlers/app_handlers.ts` — Pass `themeId` through to createFromTemplate
- **Details**:
  1. When `createApp` is called with `themeId` (no explicit `designSystemId`):
     - Copy `scaffold/` directory (standard shadcn scaffold)
     - Call `injectThemeCssVars(globalsPath, theme)`:
       - Read `scaffold/src/globals.css`
       - Parse `:root { ... }` and `.dark { ... }` blocks via regex
       - For each color CSS variable in the theme's `styles.light`: convert oklch→HSL using `colorConvert.ts`, replace in `:root` block
       - For each in `styles.dark`: convert oklch→HSL, replace in `.dark` block
       - Non-color vars (font-family, radius, spacing, shadows): inject as-is
       - Write back the modified `globals.css`
     - Proceed with normal git init → git add → git commit
  2. The `designSystemId` stored in the DB should be `"shadcn"` for themed apps
  3. Additionally store the `themeId` in a new column or in app metadata (for AI context)

#### Task 4.4: CreateAppDialog Update

- **Depends on**: 4.1 (gallery), 4.3 (scaffolding)
- **Category**: UI components
- **Complexity**: Low
- **Files to modify**:
  - `src/components/CreateAppDialog.tsx` — Accept `initialThemeId` prop
  - `src/pages/themes.tsx` — Pass `createWithThemeId` to dialog
  - `src/hooks/useCreateApp.ts` — Pass `themeId` to IPC call
- **Details**:
  - When opening from a theme card, CreateAppDialog:
    - Pre-selects "shadcn" as the design system (since themes are shadcn-based)
    - Hides the design system selector grid (or shows "shadcn + [Theme Name]" as a fixed label)
    - Shows a small theme color preview swatch in the dialog
    - Passes `themeId` alongside `designSystemId: "shadcn"` in the `createApp` mutation

---

### WAVE 5: Polish + Testing (depends on Wave 4)

#### Task 5.1: Theme Card Thumbnails (Performance Optimization)

- **Depends on**: 4.1 (gallery), 3.1 (protocol)
- **Category**: UI polish, performance
- **Complexity**: Medium
- **Details**:
  - Problem: 50+ simultaneous iframes would destroy performance
  - Solution: Lazy-load iframe thumbnails using IntersectionObserver
    - Initially: render CSS gradient placeholder from `colorScheme.primary`, `colorScheme.secondary`, `colorScheme.background`
    - When card enters viewport: create iframe, send theme CSS vars
    - When card leaves viewport: optionally destroy iframe to reclaim memory
  - Theme CSS vars can be passed via URL hash parameter (base64-encoded JSON) so the preview app applies them immediately on load (before postMessage handshake), eliminating flash of default theme
  - Consider: limit concurrent preview iframes to 6-8 max, queue the rest

#### Task 5.2: E2E Testing

- **Depends on**: All of Wave 4
- **Category**: Testing
- **Complexity**: Medium
- **Files to create**:
  - `e2e-tests/themes.spec.ts` — E2E tests for the full theme flow
- **Details**:
  - Test 1 (broad): Navigate to themes page → verify theme cards appear → click "Preview" on a theme → verify preview dialog opens with correct 5 tabs → close
  - Test 2 (broad): Click "Use This" on a theme → verify CreateAppDialog → enter name → verify app is created → verify `globals.css` contains theme CSS variables
  - Per AGENTS.md: Keep to 1-2 broad E2E tests. Must run `npm run build` first.

#### Task 5.3: Unit Tests for Color Conversion

- **Depends on**: 1.4 (color conversion)
- **Category**: Testing
- **Complexity**: Low
- **Files to create**:
  - `src/shared/__tests__/colorConvert.test.ts`
- **Details**:
  - Test known oklch → HSL conversions (black, white, primary colors, grays)
  - Test achromatic edge case (chroma = 0)
  - Test out-of-sRGB-gamut colors (graceful clamping)
  - Test non-color passthrough (radius, font-family, spacing)

---

## Dependency Graph (Visual)

```
WAVE 1 (all parallel):
  [1.1 Scraper] ─────────────────┐
  [1.2 Types] ──────────┐        │
  [1.3 Preview Skeleton] │        │
  [1.4 Color Convert] ──┼────────┤
                         │        │
WAVE 2 (all parallel):   ▼        ▼
  [2.1 JSON Bundle] ◄── 1.1 + 1.2
  [2.2 Preview Tabs] ◄── 1.3
  [2.3 IPC Contracts] ◄── 1.2
  [2.4 PostMessage] ◄── 1.3
                    │
WAVE 3 (all parallel): ▼
  [3.1 Protocol+Build] ◄── 2.2 + 2.4
  [3.2 Data Loading] ◄── 2.1 + 2.3
  [3.3 Preview Hook] ◄── 2.3 + 2.4
                    │
WAVE 4 (mostly parallel): ▼
  [4.1 Theme Gallery] ◄── 3.1 + 3.2
  [4.2 Preview Dialog] ◄── 3.3 + 4.1
  [4.3 Scaffolding] ◄── 1.4 + 3.2
  [4.4 CreateAppDialog] ◄── 4.1 + 4.3
                    │
WAVE 5 (all parallel): ▼
  [5.1 Thumbnails] ◄── 4.1 + 3.1
  [5.2 E2E Tests] ◄── all Wave 4
  [5.3 Unit Tests] ◄── 1.4
```

**Critical path**: 1.3 → 2.2 → 3.1 → 4.1 → 4.2 → 5.2

---

## File Manifest

### New Files (24 files + shadcn components)

| File                                             | Wave | Purpose                                                    |
| ------------------------------------------------ | ---- | ---------------------------------------------------------- |
| `scripts/scrape-tweakcn.ts`                      | 1.1  | Playwright scraper for themes                              |
| `scripts/tsconfig.scraper.json`                  | 1.1  | TypeScript config for scripts                              |
| `src/shared/tweakcnThemes.ts`                    | 1.2  | TweakcnTheme type + Zod schema + loader                    |
| `src/shared/tweakcn-themes.json`                 | 2.1  | Generated theme data bundle (committed)                    |
| `src/shared/colorConvert.ts`                     | 1.4  | oklch → HSL conversion                                     |
| `src/shared/__tests__/colorConvert.test.ts`      | 5.3  | Color conversion unit tests                                |
| `src/ipc/types/themes.ts`                        | 2.3  | Theme IPC contracts + client                               |
| `src/ipc/handlers/theme_handlers.ts`             | 2.3  | Theme handler implementations                              |
| `src/ipc/handlers/injectThemeCss.ts`             | 4.3  | CSS var injection for scaffolding                          |
| `src/hooks/useThemes.ts`                         | 4.1  | TanStack Query hook for themes                             |
| `src/hooks/useThemePreview.ts`                   | 3.3  | Preview iframe communication hook                          |
| `src/components/ThemeGallery.tsx`                | 4.1  | Grid of theme cards                                        |
| `src/components/ThemeCard.tsx`                   | 4.1  | Individual theme card                                      |
| `src/components/ThemePreviewDialog.tsx`          | 4.2  | Full-screen preview dialog                                 |
| `preview-apps/preview-themes/package.json`       | 1.3  | Preview app package manifest                               |
| `preview-apps/preview-themes/vite.config.ts`     | 1.3  | Vite configuration                                         |
| `preview-apps/preview-themes/tsconfig.json`      | 1.3  | TypeScript config                                          |
| `preview-apps/preview-themes/index.html`         | 1.3  | Entry HTML                                                 |
| `preview-apps/preview-themes/src/main.tsx`       | 1.3  | React entry point                                          |
| `preview-apps/preview-themes/src/App.tsx`        | 1.3  | Main app + tabs + postMessage                              |
| `preview-apps/preview-themes/src/globals.css`    | 1.3  | Default theme + Tailwind v4 @theme                         |
| `preview-apps/preview-themes/src/previews/*.tsx` | 2.2  | 5 tab components (Cards, Dashboard, Mail, Pricing, Colors) |
| `preview-apps/preview-themes/src/lib/*.ts`       | 1.3  | Utils + postMessage handler                                |
| `e2e-tests/themes.spec.ts`                       | 5.2  | E2E tests                                                  |

### Modified Files (12)

| File                                     | Wave | Change                                                         |
| ---------------------------------------- | ---- | -------------------------------------------------------------- |
| `package.json`                           | 1.1  | Add `scrape-themes` script + playwright devDep                 |
| `src/shared/designSystems.ts`            | 1.2  | Export `DesignSystemOrTheme` union, extend `DESIGN_SYSTEM_IDS` |
| `src/main/preview-protocol.ts`           | 3.1  | Add "themes" to allowlist                                      |
| `scripts/build-previews.sh`              | 3.1  | Add "themes" to PREVIEW_IDS                                    |
| `src/ipc/types/index.ts`                 | 2.3  | Re-export theme contracts/client/types                         |
| `src/ipc/ipc_host.ts`                    | 2.3  | Register theme handlers                                        |
| `src/ipc/handlers/createFromTemplate.ts` | 4.3  | Add theme-aware scaffolding branch                             |
| `src/ipc/types/app.ts`                   | 4.3  | Add optional `themeId` to CreateAppParams                      |
| `src/ipc/handlers/app_handlers.ts`       | 4.3  | Pass themeId through                                           |
| `src/lib/queryKeys.ts`                   | 4.1  | Add themes query key factory                                   |
| `src/pages/themes.tsx`                   | 4.1  | Add ThemeGallery section below DesignSystemGallery             |
| `src/components/CreateAppDialog.tsx`     | 4.4  | Accept `initialThemeId`, handle theme create flow              |

---

## Estimated Effort

| Wave      | Tasks        | Effort         | Parallelism                        |
| --------- | ------------ | -------------- | ---------------------------------- |
| Wave 1    | 4 tasks      | 2-3 days       | Fully parallel (4 workers)         |
| Wave 2    | 4 tasks      | 3-5 days       | Fully parallel (4 workers)         |
| Wave 3    | 3 tasks      | 1-2 days       | Fully parallel (3 workers)         |
| Wave 4    | 4 tasks      | 2-3 days       | Mostly parallel (4.2 waits on 4.1) |
| Wave 5    | 3 tasks      | 1-2 days       | Fully parallel (3 workers)         |
| **Total** | **18 tasks** | **~9-15 days** | **Max 4 parallel streams**         |

---

## Open Questions

1. **Theme refresh cadence**: Should the scraper run in CI (daily/weekly) to pick up new community themes, or is manual `npm run refresh-themes` sufficient?

2. **Theme card thumbnail strategy**: 50+ iframes will be heavy. Recommended: (c) lazy-load iframes as cards scroll into view + (d) CSS gradient placeholder until iframe loads. Alternative: (b) generate static screenshots at scrape time.

3. **Community theme attribution**: Should we show author name/avatar on theme cards? The data includes `author.name`. Showing it provides proper attribution to community creators.

4. **Database themeId column**: When a user creates an app with a theme, should we store the `themeId` in the apps table (new column)? This lets the AI know which theme is applied when generating code.

5. **Scraper reliability**: If tweakcn changes their page structure, the Playwright scraper breaks. Mitigation options:
   - Pin to registry.json built-in presets only (reliable, but fewer themes)
   - Add version detection / fallback
   - Cache last successful scrape result

---

## Risk Assessment

| Risk                                      | Impact                              | Likelihood | Mitigation                                                |
| ----------------------------------------- | ----------------------------------- | ---------- | --------------------------------------------------------- |
| tweakcn changes page structure            | Scraper breaks                      | Medium     | Fallback to registry.json built-ins; cache last scrape    |
| oklch → HSL conversion is lossy           | Scaffolded theme looks slightly off | Low        | Use high-precision conversion via culori library          |
| 50+ iframe thumbnails degrade UI perf     | Jank on themes page                 | High       | Lazy-load + gradient placeholders + iframe pool           |
| Some community themes have poor quality   | Bad user experience                 | Medium     | Sort by popularity; consider minimum like-count threshold |
| Tailwind v4 API changes                   | Preview app breaks                  | Low        | Pin exact version in package.json                         |
| Preview app bundle too large (5 tabs)     | Slow preview load                   | Medium     | Code-split tabs; lazy-load non-default tabs               |
| tweakcn community themes use exotic fonts | Fonts don't load in preview         | Low        | Dynamic Google Fonts loading in postMessage handler       |

---

## Phases (Progress Tracking)

- [ ] Phase 1 (Wave 1): Foundation — Types, Scraper, Preview Skeleton, Color Convert
- [ ] Phase 2 (Wave 2): Core — JSON Bundle, Preview Tabs, IPC Contracts, PostMessage
- [ ] Phase 3 (Wave 3): Integration — Protocol, Data Loading, Preview Hook
- [ ] Phase 4 (Wave 4): UI — Gallery, Preview Dialog, Scaffolding, CreateAppDialog
- [ ] Phase 5 (Wave 5): Polish — Thumbnails, E2E Tests, Unit Tests

## Status

**Plan complete. Awaiting user review before implementation.**
