# Preview Apps — File Manifest & Paths

## 1. Directory Structure with Concrete Paths

```
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/
│
├── preview-shadcn/
│   ├── src/
│   │   ├── App.tsx                          # Main app, PostMessage handling, nav
│   │   ├── main.tsx                         # React entry point
│   │   ├── globals.css                      # CSS variables (light/dark)
│   │   ├── components/ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── table.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   └── scroll-area.tsx
│   │   ├── previews/
│   │   │   ├── index.ts                     # Component registry
│   │   │   ├── OverviewPreview.tsx          # Gallery of all components
│   │   │   ├── ButtonPreview.tsx            # Button showcase
│   │   │   ├── InputPreview.tsx             # Input/form showcase
│   │   │   ├── CardPreview.tsx              # Card showcase
│   │   │   ├── DialogPreview.tsx            # Modal showcase
│   │   │   ├── TablePreview.tsx             # Table showcase
│   │   │   ├── NavigationPreview.tsx        # Tabs/nav showcase
│   │   │   └── FeedbackPreview.tsx          # Badges/alerts
│   │   └── lib/utils.ts                     # cn() utility for class merging
│   ├── tailwind.config.ts                   # Tailwind: maps CSS vars to colors
│   ├── postcss.config.js                    # PostCSS: Tailwind + Autoprefixer
│   ├── vite.config.ts                       # Vite build config
│   ├── tsconfig.json                        # TypeScript config
│   ├── package.json                         # Dependencies
│   ├── index.html                           # HTML entry point
│   └── dist/                                # Build output
│
├── preview-antd/
│   ├── src/
│   │   ├── App.tsx                          # ConfigProvider + nav
│   │   ├── main.tsx                         # React entry + Ant Design CSS
│   │   ├── theme.ts                         # Ant Design ThemeConfig
│   │   ├── globals.css                      # Basic reset
│   │   ├── previews/
│   │   │   ├── index.ts                     # Component registry
│   │   │   ├── OverviewPreview.tsx
│   │   │   ├── ButtonPreview.tsx
│   │   │   ├── InputPreview.tsx
│   │   │   ├── CardPreview.tsx
│   │   │   ├── DialogPreview.tsx
│   │   │   ├── TablePreview.tsx
│   │   │   ├── NavigationPreview.tsx
│   │   │   └── FeedbackPreview.tsx
│   │   └── lib/utils.ts
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── index.html
│   └── dist/
│
├── preview-chakra/
│   ├── src/
│   │   ├── App.tsx                          # ChakraProvider + nav
│   │   ├── main.tsx                         # React entry + ChakraProvider
│   │   ├── theme.ts                         # Chakra theme via extendTheme()
│   │   ├── globals.css                      # Minimal
│   │   ├── previews/
│   │   │   ├── index.ts
│   │   │   ├── OverviewPreview.tsx
│   │   │   ├── ButtonPreview.tsx
│   │   │   ├── InputPreview.tsx
│   │   │   ├── CardPreview.tsx
│   │   │   ├── DialogPreview.tsx
│   │   │   ├── TablePreview.tsx
│   │   │   ├── NavigationPreview.tsx
│   │   │   └── FeedbackPreview.tsx
│   │   └── lib/utils.ts
│   ├── vite.config.ts
│   ├── vite.config.d.ts                     # Vite config types
│   ├── tsconfig.json
│   ├── package.json
│   ├── index.html
│   ├── README.md                            # Chakra-specific docs
│   └── dist/
│
├── preview-mui/
│   ├── src/
│   │   ├── App.tsx                          # ThemeProvider + nav
│   │   ├── main.tsx                         # React entry + ThemeProvider + CssBaseline
│   │   ├── theme.ts                         # MUI theme via createTheme()
│   │   ├── globals.css                      # Basic reset
│   │   ├── previews/
│   │   │   ├── index.ts
│   │   │   ├── OverviewPreview.tsx
│   │   │   ├── ButtonPreview.tsx
│   │   │   ├── InputPreview.tsx
│   │   │   ├── CardPreview.tsx
│   │   │   ├── DialogPreview.tsx
│   │   │   ├── TablePreview.tsx
│   │   │   ├── NavigationPreview.tsx
│   │   │   └── FeedbackPreview.tsx
│   │   └── lib/utils.ts
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── index.html
│   └── dist/
│
├── preview-mantine/
│   ├── src/
│   │   ├── App.tsx                          # MantineProvider + nav
│   │   ├── main.tsx                         # React entry + MantineProvider
│   │   ├── theme.ts                         # Mantine theme override
│   │   ├── globals.css                      # Minimal (Mantine provides CSS)
│   │   ├── previews/
│   │   │   ├── index.ts
│   │   │   ├── OverviewPreview.tsx
│   │   │   ├── ButtonPreview.tsx
│   │   │   ├── InputPreview.tsx
│   │   │   ├── CardPreview.tsx
│   │   │   ├── DialogPreview.tsx
│   │   │   ├── TablePreview.tsx
│   │   │   ├── NavigationPreview.tsx
│   │   │   └── FeedbackPreview.tsx
│   │   └── lib/utils.ts
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── index.html
│   └── dist/
│
├── preview-daisyui/
│   ├── src/
│   │   ├── App.tsx                          # Nav with data-theme switching
│   │   ├── main.tsx                         # React entry
│   │   ├── globals.css                      # @tailwind directives
│   │   ├── previews/
│   │   │   ├── index.ts
│   │   │   ├── OverviewPreview.tsx
│   │   │   ├── ButtonPreview.tsx
│   │   │   ├── InputPreview.tsx
│   │   │   ├── CardPreview.tsx
│   │   │   ├── DialogPreview.tsx
│   │   │   ├── TablePreview.tsx
│   │   │   ├── NavigationPreview.tsx
│   │   │   └── FeedbackPreview.tsx
│   │   └── lib/utils.ts
│   ├── tailwind.config.ts                   # DaisyUI plugin + themes
│   ├── postcss.config.js                    # PostCSS: Tailwind + DaisyUI
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   ├── index.html
│   └── dist/
│
└── node_modules/                            # (Ignore in analysis)
```

---

## 2. Critical Files Summary

### All Apps Have These Files

| File                    | Purpose                              | Example Path                                        |
| ----------------------- | ------------------------------------ | --------------------------------------------------- |
| `src/App.tsx`           | Main component, routing, PostMessage | `preview-apps/preview-shadcn/src/App.tsx`           |
| `src/main.tsx`          | React entry point, provider setup    | `preview-apps/preview-shadcn/src/main.tsx`          |
| `src/previews/index.ts` | Component registry                   | `preview-apps/preview-shadcn/src/previews/index.ts` |
| `vite.config.ts`        | Build configuration                  | `preview-apps/preview-shadcn/vite.config.ts`        |
| `package.json`          | Dependencies                         | `preview-apps/preview-shadcn/package.json`          |

### Framework-Specific Theme Files

| Framework  | Theme File                               | Path                                              |
| ---------- | ---------------------------------------- | ------------------------------------------------- |
| shadcn/ui  | `src/globals.css` + `tailwind.config.ts` | `preview-apps/preview-shadcn/`                    |
| Ant Design | `src/theme.ts`                           | `preview-apps/preview-antd/src/theme.ts`          |
| Chakra     | `src/theme.ts`                           | `preview-apps/preview-chakra/src/theme.ts`        |
| MUI        | `src/theme.ts`                           | `preview-apps/preview-mui/src/theme.ts`           |
| Mantine    | `src/theme.ts`                           | `preview-apps/preview-mantine/src/theme.ts`       |
| DaisyUI    | `tailwind.config.ts`                     | `preview-apps/preview-daisyui/tailwind.config.ts` |

### CSS/PostCSS Files

| Framework | Files                                  | Paths                                       |
| --------- | -------------------------------------- | ------------------------------------------- |
| shadcn/ui | `postcss.config.js`, `src/globals.css` | `preview-apps/preview-shadcn/`              |
| DaisyUI   | `postcss.config.js`, `src/globals.css` | `preview-apps/preview-daisyui/`             |
| Others    | `src/globals.css` only                 | `preview-apps/preview-antd/src/globals.css` |

---

## 3. Build Output Paths

After `npm run build`:

```
preview-apps/preview-shadcn/dist/
├── index.html                               # Served to browser
├── assets/
│   ├── index-abc123def456.js               # Bundled JS
│   └── index-ghi789jkl012.css              # Compiled CSS
└── vite.svg                                 # Assets

# Same structure for all other preview apps
```

---

## 4. Key File Roles

### `src/App.tsx` — ALL APPS

**Role:** Component navigation, security, PostMessage

**Features:**

- Parse URL params: `nonce`, `parentOrigin`
- Listen for `NAVIGATE_COMPONENT` message
- Render nav buttons from `componentRegistry`
- Show active component via `ActivePreview`
- Send `PREVIEW_READY` to parent

**Lines of code:** ~70

---

### `src/previews/index.ts` — ALL APPS

**Role:** Component registry

**Exports:**

```typescript
interface PreviewComponent {
  id: string;
  name: string;
  category: string;
  component: React.FC;
}

export const componentRegistry: PreviewComponent[] = [...]
```

**Components included:**

- Overview (gallery)
- Buttons
- Inputs
- Cards
- Dialogs
- Tables
- Navigation
- Feedback

**Lines of code:** ~70

---

### `src/main.tsx` — ALL APPS

**Role:** React entry point, theme provider setup

**Variations:**

```typescript
// shadcn/ui: No theme provider needed (uses CSS variables)
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Ant Design: ConfigProvider
<ConfigProvider theme={themeConfig}>
  <App />
</ConfigProvider>

// Chakra: ChakraProvider
<ChakraProvider theme={theme}>
  <App />
</ChakraProvider>

// MUI: ThemeProvider + CssBaseline
<ThemeProvider theme={theme}>
  <CssBaseline />
  <App />
</ThemeProvider>

// Mantine: MantineProvider
<MantineProvider theme={theme}>
  <Notifications />
  <App />
</MantineProvider>
```

---

### `src/theme.ts` — Ant Design, Chakra, MUI, Mantine

**Role:** Define color and style tokens

**Ant Design:**

```typescript
// 8 lines
import type { ThemeConfig } from "antd";
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#1890ff",
    borderRadius: 6,
  },
};
```

**Chakra:**

```typescript
// 30 lines
export const theme = extendTheme({
  colors: { brand: { ... } },
  config: { initialColorMode: "light" },
});
```

**MUI:**

```typescript
// 27 lines
export const theme = createTheme({
  palette: { primary: { main: "#1976d2" }, ... },
  typography: { fontFamily: "..." },
});
```

**Mantine:**

```typescript
// 11 lines
export const theme: MantineThemeOverride = {
  primaryColor: "blue",
  fontFamily: "...",
};
```

---

### `src/globals.css` — ALL APPS

**Role:** Global styles

**shadcn/ui (77 lines):**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --primary: 222.2 47.4% 11.2%;
    /* ... 10+ more variables */
  }
  .dark {
    /* dark mode overrides */
  }
}
```

**Others (5-20 lines):**

```css
/* Just reset or minimal styles, framework handles rest */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: system fonts;
}
```

---

### `tailwind.config.ts` — shadcn/ui & DaisyUI

**shadcn/ui (73 lines):**

```typescript
// Maps CSS variables to Tailwind colors
export default {
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", ... },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

**DaisyUI (46 lines):**

```typescript
// Uses DaisyUI plugin with 30+ themes
export default {
  plugins: [daisyui],
  daisyui: {
    themes: ["light", "dark", "cupcake", "bumblebee", ...],
  },
};
```

---

### `postcss.config.js` — shadcn/ui & DaisyUI

```javascript
// Both are identical
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

### `vite.config.ts` — ALL APPS

**All are nearly identical:**

```typescript
import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Path alias
    },
  },
  build: {
    outDir: "dist",
  },
});
```

---

## 5. Component Preview Examples

### `src/previews/ButtonPreview.tsx` — shadcn/ui (151 lines)

**Structure:**

```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import icons from "lucide-react";

export function ButtonPreview() {
  const [clickCount, setClickCount] = useState(0);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8">
      {/* Section 1: Variants */}
      <Card>
        <CardHeader><CardTitle>Variants</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          {/* ... more variants */}
        </CardContent>
      </Card>

      {/* Section 2: Sizes */}
      {/* ... */}

      {/* Section 3: With Icons */}
      {/* ... */}

      {/* Section 4: Interactive */}
      {/* ... */}
    </div>
  );
}
```

**Sections:**

1. Variants (primary, secondary, outline, ghost, link, destructive)
2. Sizes (sm, default, lg, icon)
3. With Icons (Mail, Download, Trash, etc.)
4. Interactive (click counter, like, loading state, disabled)

---

## 6. File Size Reference

| File                             | Size       | Framework              |
| -------------------------------- | ---------- | ---------------------- |
| `src/App.tsx`                    | ~2 KB      | All                    |
| `src/main.tsx`                   | ~0.5 KB    | All                    |
| `src/previews/index.ts`          | ~2 KB      | All                    |
| `src/previews/ButtonPreview.tsx` | ~4 KB      | All                    |
| `src/globals.css`                | 1-2 KB     | All                    |
| `src/theme.ts`                   | 0.5-1 KB   | Ant/Chakra/MUI/Mantine |
| `tailwind.config.ts`             | 2-2.5 KB   | shadcn/DaisyUI         |
| Built dist/index.html            | ~0.5 KB    | All                    |
| Built assets/\*.js               | 150-300 KB | All                    |
| Built assets/\*.css              | 30-50 KB   | All                    |

---

## 7. Package.json Scripts (All Apps)

```json
{
  "scripts": {
    "dev": "vite", // Development server
    "build": "vite build", // Production build
    "preview": "vite preview" // Preview built app
  },
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x"
    // Framework-specific packages...
  }
}
```

**Note:** Chakra also runs `tsc -b &&` before build for type checking.

---

## 8. Index.html (Entry Point)

**All apps have similar structure:**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Preview App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## 9. Actual File Paths (Quick Copy-Paste Reference)

```
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-shadcn/src/App.tsx
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-shadcn/src/main.tsx
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-shadcn/src/globals.css
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-shadcn/tailwind.config.ts
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-shadcn/postcss.config.js
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-shadcn/src/previews/index.ts
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-shadcn/src/previews/ButtonPreview.tsx

/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-antd/src/App.tsx
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-antd/src/theme.ts
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-antd/src/previews/index.ts

/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-chakra/src/App.tsx
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-chakra/src/theme.ts
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-chakra/src/main.tsx

/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-mui/src/App.tsx
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-mui/src/theme.ts
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-mui/src/main.tsx

/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-mantine/src/App.tsx
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-mantine/src/theme.ts
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-mantine/src/main.tsx

/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-daisyui/src/App.tsx
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-daisyui/tailwind.config.ts
/Users/cosmos/Documents/an/ANYON-b2c/preview-apps/preview-daisyui/postcss.config.js
```
