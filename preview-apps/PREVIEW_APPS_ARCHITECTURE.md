# Preview Apps Architecture Documentation

## Overview

The project contains **6 independent preview applications**, each showcasing UI components styled with a different CSS framework or component library. These apps are designed to render components in isolation using a **PostMessage security pattern** for iframe communication.

---

## Directory Structure

```
preview-apps/
├── preview-shadcn/      # shadcn/ui + Tailwind CSS (light/dark CSS variables)
├── preview-antd/        # Ant Design v5 (JS theme config)
├── preview-chakra/      # Chakra UI v2 (JS theme provider)
├── preview-mui/         # Material-UI v5+ (createTheme)
├── preview-mantine/     # Mantine v7+ (MantineProvider)
└── preview-daisyui/     # DaisyUI v4 + Tailwind (Tailwind themes plugin)
```

Each app is a **standalone Vite + React application** with:

- Independent `package.json` and dependencies
- Separate component implementations (same component types, different markup)
- Framework-specific theme/styling approach
- Own build output (`dist/`)

---

## 1. Preview Apps List & Differences

### A. `preview-shadcn/` — shadcn/ui + Tailwind CSS

**Theme System:** CSS Custom Properties (CSS Variables) + Tailwind

**Files:**

- `src/globals.css` - Defines CSS variables (HSL format) for light/dark modes
- `tailwind.config.ts` - Maps Tailwind colors to CSS variables: `hsl(var(--primary))`
- `postcss.config.js` - PostCSS + Tailwind + Autoprefixer
- `src/components/ui/` - shadcn/ui components (Button, Card, Input, Dialog, etc.)

**Theme Flow:**

1. Light/dark CSS variables defined in `:root` and `.dark` (in `globals.css`)
2. Tailwind config extends colors from these variables
3. Components use Tailwind classes: `bg-primary`, `text-foreground`, etc.
4. Dark mode: add `dark` class to document root

**Key Features:**

- No runtime theme switching (compile-time, CSS-based)
- Highly customizable—easy to swap color values
- Supports light and dark modes via CSS class

---

### B. `preview-antd/` — Ant Design v5

**Theme System:** JavaScript `ThemeConfig` object

**Files:**

- `src/theme.ts` - Exports `themeConfig` with design tokens
  ```typescript
  export const themeConfig: ThemeConfig = {
    token: {
      colorPrimary: "#1890ff",
      borderRadius: 6,
    },
  };
  ```
- `src/App.tsx` - Wraps app with `<ConfigProvider theme={themeConfig}>`
- `src/globals.css` - Basic reset (no framework colors)

**Theme Flow:**

1. Create theme object in TypeScript
2. Pass to `<ConfigProvider>` at app root
3. All Ant Design components read from `ConfigProvider` context
4. Runtime theme switching possible by updating context

**Key Features:**

- Ant Design handles all styling internally
- No CSS files needed for components
- Fine-grained control via token system (colors, spacing, typography)
- Built for design systems (can export token values)

---

### C. `preview-chakra/` — Chakra UI v2

**Theme System:** JavaScript `theme` object + `ChakraProvider`

**Files:**

- `src/theme.ts` - Exports theme via `extendTheme()`
  ```typescript
  export const theme = extendTheme({
    config: {
      initialColorMode: "light",
      useSystemColorMode: false,
    },
    colors: {
      brand: { 50: "#f0f4ff", 500: "#6366f1", ... },
    },
  });
  ```
- `src/main.tsx` - Wraps app with `<ChakraProvider theme={theme}>`
- `src/globals.css` - Minimal CSS

**Theme Flow:**

1. Define theme object with colors, component defaults
2. Wrap app with `<ChakraProvider theme={theme}>`
3. Chakra components use theme colors and defaults
4. Dynamic color mode switching built-in

**Key Features:**

- Full color palette customization (50–900 shades)
- Component defaults can be configured (e.g., `Button.defaultProps`)
- Requires React 18 (Chakra UI v2 incompatible with React 19)
- Includes accessibility features out-of-box

---

### D. `preview-mui/` — Material-UI (MUI) v5+

**Theme System:** JavaScript `createTheme()` + `ThemeProvider`

**Files:**

- `src/theme.ts` - Exports theme via `createTheme()`
  ```typescript
  export const theme = createTheme({
    palette: {
      primary: { main: "#1976d2" },
      secondary: { main: "#dc004e" },
      background: { default: "#fafafa", paper: "#ffffff" },
    },
    typography: { fontFamily: "..." },
  });
  ```
- `src/main.tsx` - Wraps app with `<ThemeProvider theme={theme}>` + `<CssBaseline />`
- `src/globals.css` - Basic styles

**Theme Flow:**

1. Create theme object using `createTheme()`
2. Wrap app with `<ThemeProvider>` + `<CssBaseline>` (resets + theme application)
3. MUI components read from theme context
4. All colors, typography, spacing derived from theme

**Key Features:**

- Comprehensive Material Design system
- `CssBaseline` ensures consistent styling across browsers
- Fine-grained palette structure (primary, secondary, error, warning, info, success)
- Best for Material Design-compliant UIs

---

### E. `preview-mantine/` — Mantine v7+

**Theme System:** JavaScript theme object + `MantineProvider`

**Files:**

- `src/theme.ts` - Exports theme override:
  ```typescript
  export const theme: MantineThemeOverride = {
    primaryColor: "blue",
    fontFamily: "...",
    headings: { fontFamily: "..." },
  };
  ```
- `src/main.tsx` - Wraps app with `<MantineProvider theme={theme}>` + `<Notifications />`
- Includes `@mantine/core/styles.css` + `@mantine/notifications/styles.css`

**Theme Flow:**

1. Create `MantineThemeOverride` object
2. Pass to `<MantineProvider>`
3. All Mantine components use theme values
4. Rich notification system with `<Notifications />`

**Key Features:**

- Modern React component library
- Built-in hooks for common patterns (useForm, useMediaQuery, etc.)
- Modular: import only used components
- Integrated notification system

---

### F. `preview-daisyui/` — DaisyUI v4 + Tailwind CSS

**Theme System:** Tailwind CSS + DaisyUI themes plugin

**Files:**

- `tailwind.config.ts` - Configures DaisyUI with 30+ pre-built themes:
  ```typescript
  daisyui: {
    themes: ["light", "dark", "cupcake", "bumblebee", "emerald", ...],
  },
  plugins: [daisyui],
  ```
- `postcss.config.js` - PostCSS + Tailwind + DaisyUI
- `src/globals.css` - Three @tailwind directives
- Components use DaisyUI classes: `btn`, `input`, `card`, etc.

**Theme Flow:**

1. DaisyUI plugin provides pre-built Tailwind themes
2. Toggle themes by changing HTML `data-theme` attribute
3. All components automatically adapt to active theme
4. Easy theme switching at runtime

**Key Features:**

- 30+ beautiful pre-built themes
- Simple class-based component API (e.g., `<button class="btn">`)
- Tailwind CSS underneath = customizable
- Great for rapid prototyping

---

## 2. Component Registry & Composition Pattern

All preview apps follow the **same component registry pattern**:

**File:** `src/previews/index.ts`

```typescript
export interface PreviewComponent {
  id: string;
  name: string;
  category: string;
  component: React.FC;
}

export const componentRegistry: PreviewComponent[] = [
  {
    id: "overview",
    name: "Overview",
    category: "general",
    component: OverviewPreview,
  },
  {
    id: "buttons",
    name: "Buttons",
    category: "actions",
    component: ButtonPreview,
  },
  { id: "inputs", name: "Inputs", category: "forms", component: InputPreview },
  { id: "cards", name: "Cards", category: "layout", component: CardPreview },
  {
    id: "dialogs",
    name: "Dialogs",
    category: "overlay",
    component: DialogPreview,
  },
  { id: "tables", name: "Tables", category: "data", component: TablePreview },
  {
    id: "navigation",
    name: "Navigation",
    category: "navigation",
    component: NavigationPreview,
  },
  {
    id: "feedback",
    name: "Feedback",
    category: "feedback",
    component: FeedbackPreview,
  },
];
```

### Component Categories

1. **Overview** — Gallery of all components
2. **Buttons** — Variants, sizes, states, icons, interactive
3. **Inputs** — Text fields, selects, textareas, search
4. **Cards** — Container components with borders, shadows
5. **Dialogs** — Modals, alerts, confirmation windows
6. **Tables** — Data grids with striping, pagination
7. **Navigation** — Tabs, menu, breadcrumbs
8. **Feedback** — Badges, alerts, status indicators

---

## 3. App Structure (Consistent Across All)

### Entry Point: `src/main.tsx`

```typescript
// Generic pattern (framework varies)
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Framework-specific provider (ConfigProvider, ChakraProvider, etc.) */}
    <App />
  </StrictMode>,
);
```

### App Component: `src/App.tsx`

**Key responsibilities:**

1. Parse URL params: `nonce`, `parentOrigin`
2. Listen for PostMessage events from parent window
3. Render component registry as tab buttons
4. Show active component preview
5. Send `PREVIEW_READY` message to parent with component list

**PostMessage Protocol:**

```typescript
// Incoming messages (from parent iframe)
event.data = {
  type: "NAVIGATE_COMPONENT",
  componentId: "buttons",
  nonce: "...",  // Security: validate matches URL param
}

// Outgoing message (to parent)
window.parent.postMessage({
  type: "PREVIEW_READY",
  nonce: SESSION_NONCE,
  components: [
    { id: "overview", name: "Overview", category: "general" },
    ...
  ],
}, ALLOWED_PARENT_ORIGIN);
```

**Security:**

- Origin validation: `event.origin !== ALLOWED_PARENT_ORIGIN` → ignore
- Nonce validation: `event.data?.nonce !== SESSION_NONCE` → ignore

---

## 4. CSS Variables & Theme Flow

### shadcn/ui Example (CSS Variables)

**`src/globals.css`:**

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
}
```

**`tailwind.config.ts`:**

```typescript
colors: {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
}
```

**Component Usage:**

```tsx
<button className="bg-primary text-primary-foreground">Click me</button>
```

**Result:** Colors defined at `:root` → used via Tailwind → applied to components

---

### Ant Design / Chakra / MUI / Mantine Example (JS Theme)

**`src/theme.ts`:**

```typescript
export const themeConfig = {
  token: {
    colorPrimary: "#1890ff", // Direct hex color
    borderRadius: 6,
  },
};
```

**`src/App.tsx`:**

```tsx
<ConfigProvider theme={themeConfig}>
  <App />
</ConfigProvider>
```

**Component Usage:**

```tsx
<Button type="primary">Click me</Button>
```

**Result:** Theme object → Provider context → Components read from context

---

## 5. Build Process

### Standard Build (Most Apps)

```bash
cd preview-apps/preview-shadcn
npm run build
# Output: dist/
```

**Vite Build Process:**

1. Parse `vite.config.ts` (alias, plugins)
2. Compile TypeScript → JavaScript
3. Bundle with Vite (ESM-based)
4. CSS processing (Tailwind, PostCSS)
5. Output to `dist/`

### Example: `vite.config.ts` (shadcn)

```typescript
export default defineConfig({
  plugins: [react()], // React Fast Refresh
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Path alias for imports
    },
  },
  build: {
    outDir: "dist",
  },
});
```

### Build Output Structure

```
dist/
├── index.html          # SPA entry point
├── assets/
│   ├── index-*.js      # Bundled JavaScript
│   ├── index-*.css     # Compiled CSS
```

---

## 6. How Themes Flow Into Preview Apps

### Pattern A: CSS Variables (shadcn/ui, DaisyUI)

```
colors.css (--primary: 222.2 47.4% 11.2%)
    ↓
tailwind.config.ts (hsl(var(--primary)))
    ↓
Component markup (<button className="bg-primary">)
    ↓
Tailwind + PostCSS compile
    ↓
Browser applies: background-color: hsl(222.2 47.4% 11.2%)
```

**To change theme:** Modify CSS variable values (light/dark, custom themes)

---

### Pattern B: JavaScript Theme Objects (Ant Design, Chakra, MUI, Mantine)

```
src/theme.ts (colorPrimary: "#1890ff")
    ↓
src/main.tsx (<ConfigProvider/>, <ThemeProvider/>, etc.)
    ↓
Theme provider context wraps component tree
    ↓
Components read from context at runtime
    ↓
Styles applied via context values
```

**To change theme:** Modify theme object, or switch provider at runtime

---

### Pattern C: Tailwind Plugin (DaisyUI)

```
daisyui config (themes: ["light", "dark", "cupcake", ...])
    ↓
Tailwind plugin injects theme CSS
    ↓
data-theme attribute on <html>
    ↓
CSS selector [data-theme="cupcake"] .btn { ... }
    ↓
Theme switches at runtime without re-compile
```

---

## 7. Key Files by Framework

| File           | shadcn                           | Antd           | Chakra         | MUI           | Mantine         | DaisyUI            |
| -------------- | -------------------------------- | -------------- | -------------- | ------------- | --------------- | ------------------ |
| Theme config   | globals.css + tailwind.config.ts | src/theme.ts   | src/theme.ts   | src/theme.ts  | src/theme.ts    | tailwind.config.ts |
| Provider       | Tailwind + CSS                   | ConfigProvider | ChakraProvider | ThemeProvider | MantineProvider | Tailwind plugin    |
| Styling        | CSS classes                      | JS tokens      | CSS-in-JS      | CSS-in-JS     | CSS-in-JS       | CSS classes        |
| Dark mode      | CSS class `.dark`                | Via theme      | Via config     | Via theme     | Built-in        | data-theme attr    |
| CSS processing | PostCSS + Tailwind               | None           | None           | MUI system    | MUI system      | PostCSS + Tailwind |

---

## 8. PostMessage Communication Protocol

### Frame-to-Parent Handshake

**Parent sends:**

```json
{
  "type": "NAVIGATE_COMPONENT",
  "componentId": "buttons",
  "nonce": "abc123xyz",
  "parentOrigin": "https://parent.com"
}
```

**Preview app responds:**

```json
{
  "type": "PREVIEW_READY",
  "nonce": "abc123xyz",
  "components": [
    { "id": "overview", "name": "Overview", "category": "general" },
    { "id": "buttons", "name": "Buttons", "category": "actions" },
    ...
  ]
}
```

### Security Checks

```typescript
// In App.tsx
if (ALLOWED_PARENT_ORIGIN && event.origin !== ALLOWED_PARENT_ORIGIN) return;
if (event.data?.nonce !== SESSION_NONCE) return;
```

---

## 9. Component Implementation Patterns

### Button Component (shadcn/ui example)

**File:** `src/previews/ButtonPreview.tsx`

Showcases:

- Button variants: primary, secondary, outline, ghost, link, destructive
- Button sizes: sm, default, lg, icon
- Icons + text combinations
- Interactive states: disabled, loading
- State management with React hooks

```typescript
export function ButtonPreview() {
  const [clickCount, setClickCount] = useState(0);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader><CardTitle>Variants</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          {/* ... */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Overview Component (Entry point)

**File:** `src/previews/OverviewPreview.tsx`

Shows miniature galleries of all component types, organized by category.

---

## 10. How to Add a New Theme to an Existing App

### For shadcn/ui:

1. Modify `src/globals.css` — change CSS variable values
2. Optional: Update `tailwind.config.ts` if adding new colors
3. Rebuild: `npm run build`

### For Ant Design:

1. Modify `src/theme.ts` — update `themeConfig` object
2. Rebuild: `npm run build`

### For DaisyUI:

1. Modify `tailwind.config.ts` — add theme to `daisyui.themes` array
2. Theme automatically available via `data-theme` attribute
3. Rebuild: `npm run build`

---

## 11. Deployment Structure

Each preview app builds to:

```
preview-apps/{framework}/dist/
```

Typical deployment:

- Hosted as standalone SPA
- Embedded in iframe with postMessage security
- URL params: `?nonce={nonce}&parentOrigin={origin}`

---

## 12. Integration with 50+ Themes (Your Use Case)

### Recommended Approach:

1. **Choose a base framework** (suggest shadcn/ui or DaisyUI for flexibility)
2. **Create theme variants:**
   - Option A (CSS Variables): Add theme CSS files, inject via `<link>` or `<style>`
   - Option B (JS Theme): Dynamically load theme object, pass to provider
3. **Extend component registry** to include theme switcher
4. **Add query param for theme:** `?theme=modern&nonce=...&parentOrigin=...`
5. **Load theme before rendering components**

### Example: shadcn/ui with Dynamic Themes

```typescript
// src/main.tsx
const themeParam = new URLSearchParams(window.location.search).get('theme') || 'default';
const themeLink = document.createElement('link');
themeLink.rel = 'stylesheet';
themeLink.href = `/themes/${themeParam}.css`;  // Load theme CSS
document.head.appendChild(themeLink);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

```css
/* /themes/modern.css */
:root {
  --primary: 200 100% 50%;
  --foreground: 0 0% 20%;
  /* ... */
}
```

---

## Summary Table

| Aspect             | shadcn/ui                | Ant Design     | Chakra     | MUI              | Mantine     | DaisyUI           |
| ------------------ | ------------------------ | -------------- | ---------- | ---------------- | ----------- | ----------------- |
| **Type**           | Component lib + Tailwind | Enterprise lib | React lib  | Material Design  | React lib   | Tailwind plugin   |
| **Theme system**   | CSS variables            | JS tokens      | JS objects | createTheme()    | JS objects  | Tailwind plugin   |
| **Dark mode**      | CSS class                | Via theme      | Built-in   | Via theme        | Built-in    | data-theme attr   |
| **Build time**     | ~2-5s                    | ~2-5s          | ~2-5s      | ~2-5s            | ~2-5s       | ~2-5s             |
| **Bundle size**    | Small                    | Large          | Medium     | Medium           | Medium      | Small             |
| **Customization**  | High (CSS)               | High (tokens)  | High (JS)  | High (palette)   | High (JS)   | High (Tailwind)   |
| **Learning curve** | Steep (Tailwind)         | Medium         | Easy       | Medium           | Easy        | Easy              |
| **Best for**       | Custom designs           | Enterprise     | UI kits    | Material designs | Modern apps | Rapid prototyping |
