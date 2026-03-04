# Preview Apps — Quick Reference Guide

## 1. File Paths & Structure

### All Preview Apps

```
preview-apps/
├── preview-shadcn/      src/App.tsx, src/globals.css, tailwind.config.ts, postcss.config.js
├── preview-antd/        src/App.tsx, src/theme.ts, src/globals.css
├── preview-chakra/      src/App.tsx, src/theme.ts, src/main.tsx, src/globals.css
├── preview-mui/         src/App.tsx, src/theme.ts, src/main.tsx, src/globals.css
├── preview-mantine/     src/App.tsx, src/theme.ts, src/main.tsx, src/globals.css
└── preview-daisyui/     src/App.tsx, tailwind.config.ts, src/globals.css, postcss.config.js
```

### Common Files (All Apps)

```
src/
├── App.tsx                    # Navigation + PostMessage security + component switching
├── main.tsx                   # Entry point (framework provider varies)
├── globals.css                # Global styles (minimal, framework handles most)
├── previews/
│   ├── index.ts              # Component registry
│   ├── OverviewPreview.tsx    # Gallery view
│   ├── ButtonPreview.tsx      # Button variants, sizes, states
│   ├── InputPreview.tsx       # Text inputs, selects, textareas
│   ├── CardPreview.tsx        # Card containers
│   ├── DialogPreview.tsx      # Modals and dialogs
│   ├── TablePreview.tsx       # Data tables
│   ├── NavigationPreview.tsx   # Tabs, menus
│   └── FeedbackPreview.tsx    # Badges, alerts
└── lib/utils.ts              # Helper utilities
```

### Theme/Config Files (Framework-Specific)

```
Theme Config Location by Framework:
- shadcn/ui:  src/globals.css + tailwind.config.ts
- Ant Design: src/theme.ts
- Chakra:     src/theme.ts
- MUI:        src/theme.ts
- Mantine:    src/theme.ts
- DaisyUI:    tailwind.config.ts
```

---

## 2. Theme Configuration Quick Start

### shadcn/ui (CSS Variables)

**File:** `src/globals.css`

```css
:root {
  --primary: 222.2 47.4% 11.2%; /* HSL format */
  --primary-foreground: 210 40% 98%;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
}
.dark {
  --primary: 210 40% 98%; /* Dark mode override */
  --background: 222.2 84% 4.9%;
}
```

### Ant Design (JS Config)

**File:** `src/theme.ts`

```typescript
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#1890ff",
    borderRadius: 6,
    fontSize: 14,
  },
};
```

### Chakra (JS Theme)

**File:** `src/theme.ts`

```typescript
export const theme = extendTheme({
  colors: {
    brand: { 50: "#f0f4ff", 500: "#6366f1", 900: "#312e81" },
  },
  config: { initialColorMode: "light" },
});
```

### MUI (JS Theme)

**File:** `src/theme.ts`

```typescript
export const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
  },
});
```

### Mantine (JS Theme)

**File:** `src/theme.ts`

```typescript
export const theme: MantineThemeOverride = {
  primaryColor: "blue",
  fontFamily: "...",
};
```

### DaisyUI (Tailwind Plugin)

**File:** `tailwind.config.ts`

```typescript
daisyui: {
  themes: ["light", "dark", "cupcake", "bumblebee", ...],  // 30+ themes
},
```

---

## 3. Component Registry

**File:** `src/previews/index.ts`

```typescript
export interface PreviewComponent {
  id: string; // Unique identifier
  name: string; // Display name
  category: string; // For filtering/grouping
  component: React.FC; // The preview component
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

---

## 4. PostMessage API

### Parent → Preview App

```javascript
// Send message to iframe
iframe.contentWindow.postMessage(
  {
    type: "NAVIGATE_COMPONENT",
    componentId: "buttons",
    nonce: "unique-nonce-123",
  },
  "https://parent-origin.com",
);
```

### Preview App → Parent

```javascript
// Send from preview app
window.parent.postMessage(
  {
    type: "PREVIEW_READY",
    nonce: "unique-nonce-123",
    components: [
      { id: "overview", name: "Overview", category: "general" },
      { id: "buttons", name: "Buttons", category: "actions" },
      // ... all components
    ],
  },
  ALLOWED_PARENT_ORIGIN,
);
```

### Security (In App.tsx)

```typescript
const urlParams = new URLSearchParams(window.location.search);
const SESSION_NONCE = urlParams.get("nonce") ?? "";
const ALLOWED_PARENT_ORIGIN = urlParams.get("parentOrigin") ?? "";

window.addEventListener("message", (event) => {
  // Validate origin
  if (ALLOWED_PARENT_ORIGIN && event.origin !== ALLOWED_PARENT_ORIGIN) return;
  // Validate nonce
  if (event.data?.nonce !== SESSION_NONCE) return;
  // Process message
  if (event.data?.type === "NAVIGATE_COMPONENT") {
    setActiveComponent(event.data.componentId);
  }
});
```

---

## 5. Build & Development

### Development

```bash
cd preview-apps/preview-shadcn
npm install
npm run dev           # Start Vite dev server (http://localhost:5173)
```

### Production Build

```bash
cd preview-apps/preview-shadcn
npm run build         # Creates dist/
npm run preview       # Preview built app locally
```

### Build Output

```
dist/
├── index.html               # SPA entry point
├── assets/
│   ├── index-abc123.js     # Bundle
│   └── index-def456.css    # Styles (compiled)
```

---

## 6. Component Showcase Pattern

### ButtonPreview.tsx Example

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function ButtonPreview() {
  const [state, setState] = useState(false);

  return (
    <div className="space-y-8">
      {/* Section 1: Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          {/* ... more variants */}
        </CardContent>
      </Card>

      {/* Section 2: Sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Sizes</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 items-center">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </CardContent>
      </Card>

      {/* Section 3: Interactive */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setState(!state)}>
            {state ? "Active" : "Inactive"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 7. Color/Theme Variable Reference

### shadcn/ui CSS Variables

```css
--background          /* Page background */
--foreground          /* Text color */
--primary             /* Main brand color */
--primary-foreground  /* Text on primary */
--secondary           /* Secondary color */
--secondary-foreground
--accent              /* Accent/highlight */
--accent-foreground
--destructive         /* Error/dangerous action */
--destructive-foreground
--border              /* Borders */
--input               /* Input fields */
--ring                /* Focus/ring styles */
--radius              /* Border radius */
```

### Ant Design Tokens

```typescript
token: {
  colorPrimary,                    // Brand color
  colorSuccess, colorWarning, colorError, colorInfo,
  borderRadius,                    // Corner radius
  fontSize, fontSizeHeading1–6,     // Typography
  colorBgBase, colorTextBase,       // Base colors
  spacing, paddingLG, marginLG,     // Spacing
  // ... 200+ more tokens
}
```

### Chakra Color Palette

```typescript
colors: {
  brand: {
    50, 100, 200, 300, 400, 500,    // Light to dark
    600, 700, 800, 900
  },
  gray: { ... },
  blue: { ... },
  // ... semantic colors
}
```

---

## 8. Adding a New Preview Component

### Step 1: Create Preview File

```typescript
// src/previews/AvatarPreview.tsx
import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export function AvatarPreview() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader><CardTitle>Avatar Sizes</CardTitle></CardHeader>
        <CardContent>
          {/* Show Avatar component in different sizes */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Step 2: Register in Registry

```typescript
// src/previews/index.ts
import { AvatarPreview } from "./AvatarPreview";

export const componentRegistry: PreviewComponent[] = [
  // ... existing components
  {
    id: "avatars",
    name: "Avatars",
    category: "feedback",
    component: AvatarPreview,
  },
];
```

### Step 3: Rebuild

```bash
npm run build
```

---

## 9. Theme Switching at Runtime

### shadcn/ui (CSS Variables)

```typescript
// Switch to dark mode
document.documentElement.classList.add("dark");

// Switch to light mode
document.documentElement.classList.remove("dark");

// Or dynamically change variables
document.documentElement.style.setProperty("--primary", "200 100% 50%");
```

### DaisyUI (Tailwind Plugin)

```typescript
// Switch theme
document.documentElement.setAttribute("data-theme", "cupcake");

// Available themes in config.daisyui.themes
```

### Ant Design / Chakra / MUI / Mantine

```typescript
// Create new provider instance with different theme
<ConfigProvider theme={updatedTheme}>
  <App />
</ConfigProvider>
```

---

## 10. Troubleshooting

| Issue                   | Solution                                                   |
| ----------------------- | ---------------------------------------------------------- |
| Components not showing  | Check `componentRegistry` in `src/previews/index.ts`       |
| Theme not applying      | Verify theme config loaded before component mount          |
| PostMessage not working | Check nonce and parentOrigin match between parent & iframe |
| Build fails             | Run `npm install` first, check Node version (18+)          |
| Styles missing          | Ensure globals.css imported in main.tsx                    |
| Dark mode not working   | For CSS vars, add `dark` class to `<html>`                 |

---

## 11. Key Dependencies

| Framework  | Key Packages                       | Version |
| ---------- | ---------------------------------- | ------- |
| shadcn/ui  | @radix-ui/\*, tailwindcss, postcss | Latest  |
| Ant Design | antd                               | ^5.x    |
| Chakra     | @chakra-ui/react, @emotion/\*      | ^2.x    |
| MUI        | @mui/material, @emotion/\*         | ^5.x    |
| Mantine    | @mantine/core, @mantine/hooks      | ^7.x    |
| DaisyUI    | daisyui, tailwindcss               | Latest  |

---

## 12. Integration Checklist (50+ Themes)

- [ ] Choose base framework (shadcn/ui recommended)
- [ ] Create theme CSS files or JS config objects
- [ ] Add theme loading logic to src/main.tsx
- [ ] Add theme switcher to App.tsx or nav
- [ ] Test each theme renders all components
- [ ] Add theme to query params (?theme=modern)
- [ ] Build and verify dist/ output
- [ ] Test PostMessage communication
- [ ] Verify security (nonce, origin validation)
