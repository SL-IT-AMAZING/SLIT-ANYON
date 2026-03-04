# Preview Apps — Complete Documentation

This directory contains **6 independent preview applications** showcasing UI components with different CSS frameworks and component libraries.

## 📚 Documentation Files

### Quick Start

- **[PREVIEW_APPS_QUICK_REF.md](./PREVIEW_APPS_QUICK_REF.md)** — Start here! Theme configs, build scripts, integration checklist

### Deep Dives

- **[PREVIEW_APPS_ARCHITECTURE.md](./PREVIEW_APPS_ARCHITECTURE.md)** — Full architecture, theme patterns, component registry, security, workflow

### Reference

- **[PREVIEW_APPS_MANIFEST.md](./PREVIEW_APPS_MANIFEST.md)** — Complete file structure, paths, file roles, code examples

---

## 🎯 Preview Apps at a Glance

| App                 | Framework            | Theme System        | CSS               | Build Time |
| ------------------- | -------------------- | ------------------- | ----------------- | ---------- |
| **preview-shadcn**  | shadcn/ui + Tailwind | CSS variables (HSL) | Compiled Tailwind | ~2s        |
| **preview-antd**    | Ant Design v5        | JS ThemeConfig      | None (framework)  | ~2s        |
| **preview-chakra**  | Chakra UI v2         | JS theme object     | CSS-in-JS         | ~2s        |
| **preview-mui**     | Material-UI v5+      | createTheme()       | CSS-in-JS         | ~2s        |
| **preview-mantine** | Mantine v7+          | JS theme object     | CSS-in-JS         | ~2s        |
| **preview-daisyui** | DaisyUI + Tailwind   | Tailwind plugin     | Compiled Tailwind | ~2s        |

---

## 🚀 Quick Start

### Development

```bash
cd preview-apps/preview-shadcn
npm install
npm run dev           # http://localhost:5173
```

### Production

```bash
npm run build
npm run preview       # Test built version
```

---

## 🎨 Component Showcase

All apps show 8 component categories:

1. **Overview** — Gallery of all components
2. **Buttons** — Variants, sizes, states, interactive
3. **Inputs** — Text fields, selects, textareas
4. **Cards** — Container components
5. **Dialogs** — Modals, alerts
6. **Tables** — Data grids
7. **Navigation** — Tabs, menus
8. **Feedback** — Badges, alerts, status

---

## 🔐 PostMessage Communication

### Parent → Preview

```javascript
iframe.contentWindow.postMessage(
  {
    type: "NAVIGATE_COMPONENT",
    componentId: "buttons",
    nonce: "unique-nonce",
  },
  "https://parent-origin.com",
);
```

### Preview → Parent

```javascript
window.parent.postMessage(
  {
    type: "PREVIEW_READY",
    nonce: "unique-nonce",
    components: [
      { id: "overview", name: "Overview", category: "general" },
      { id: "buttons", name: "Buttons", category: "actions" },
      // ... all components
    ],
  },
  ALLOWED_PARENT_ORIGIN,
);
```

---

## 📁 Key Files

### All Apps

- `src/App.tsx` — Navigation + PostMessage security
- `src/main.tsx` — React entry + framework provider
- `src/previews/index.ts` — Component registry
- `vite.config.ts` — Build configuration
- `package.json` — Dependencies

### Framework-Specific Theme

- **shadcn/ui:** `src/globals.css` + `tailwind.config.ts`
- **Ant Design:** `src/theme.ts`
- **Chakra:** `src/theme.ts`
- **MUI:** `src/theme.ts`
- **Mantine:** `src/theme.ts`
- **DaisyUI:** `tailwind.config.ts`

---

## 🎭 Theme Configuration Examples

### shadcn/ui (CSS Variables)

```css
/* src/globals.css */
:root {
  --primary: 222.2 47.4% 11.2%;
  --background: 0 0% 100%;
  /* ... more variables */
}
.dark {
  --primary: 210 40% 98%;
  --background: 222.2 84% 4.9%;
}
```

### Ant Design (JS Tokens)

```typescript
/* src/theme.ts */
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: "#1890ff",
    borderRadius: 6,
  },
};
```

### Chakra (JS Theme)

```typescript
/* src/theme.ts */
export const theme = extendTheme({
  colors: {
    brand: { 50: "#f0f4ff", 500: "#6366f1", 900: "#312e81" },
  },
});
```

### DaisyUI (Tailwind Plugin)

```typescript
/* tailwind.config.ts */
daisyui: {
  themes: ["light", "dark", "cupcake", "bumblebee", ...],  // 30+ themes
},
```

---

## 🔧 Integration with 50+ Themes

### Recommended Approach

1. Choose base framework (suggest shadcn/ui for flexibility)
2. Create theme CSS or JS config files
3. Add theme loading to `src/main.tsx`
4. Add theme switcher to navigation
5. Add query param: `?theme=modern&nonce=...&parentOrigin=...`

### Example: Dynamic Theme Loading

```typescript
// src/main.tsx
const themeParam = new URLSearchParams(window.location.search).get('theme') || 'default';
const themeLink = document.createElement('link');
themeLink.rel = 'stylesheet';
themeLink.href = `/themes/${themeParam}.css`;
document.head.appendChild(themeLink);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

---

## 📊 File Structure

```
preview-apps/
├── preview-shadcn/          # CSS variables + Tailwind
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── globals.css
│   │   ├── components/ui/   # shadcn/ui components
│   │   └── previews/        # Component showcases
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   └── dist/                # Build output
├── preview-antd/            # Ant Design theme config
├── preview-chakra/          # Chakra UI theme config
├── preview-mui/             # Material-UI theme config
├── preview-mantine/         # Mantine theme config
└── preview-daisyui/         # DaisyUI Tailwind plugin
```

---

## 🧪 Adding Components

### Step 1: Create Preview File

```typescript
// src/previews/AvatarPreview.tsx
export function AvatarPreview() {
  return (
    <div className="space-y-8">
      {/* Show Avatar in various sizes/states */}
    </div>
  );
}
```

### Step 2: Register Component

```typescript
// src/previews/index.ts
import { AvatarPreview } from "./AvatarPreview";

export const componentRegistry: PreviewComponent[] = [
  // ... existing
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

## 🌓 Dark Mode

### shadcn/ui

```typescript
// Toggle dark class on root
document.documentElement.classList.add("dark");
document.documentElement.classList.remove("dark");
```

### DaisyUI

```typescript
// Set data-theme attribute
document.documentElement.setAttribute("data-theme", "cupcake");
```

### Others (Ant Design, Chakra, MUI, Mantine)

Handled by framework provider, no manual toggle needed.

---

## 🔗 Component Registry

**File:** `src/previews/index.ts`

```typescript
export interface PreviewComponent {
  id: string; // Unique identifier
  name: string; // Display name
  category: string; // For grouping
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
  // ... 6 more components
];
```

---

## 📖 Learning Path

1. **Start with Quick Ref** → [PREVIEW_APPS_QUICK_REF.md](./PREVIEW_APPS_QUICK_REF.md)
2. **Understand Architecture** → [PREVIEW_APPS_ARCHITECTURE.md](./PREVIEW_APPS_ARCHITECTURE.md)
3. **Reference File Paths** → [PREVIEW_APPS_MANIFEST.md](./PREVIEW_APPS_MANIFEST.md)
4. **Try Development** → `npm run dev` in any preview app
5. **Build & Deploy** → `npm run build`, serve `dist/`

---

## ✅ Checklist for 50+ Themes

- [ ] Choose base framework (shadcn/ui recommended)
- [ ] Create theme CSS/JS files for each theme
- [ ] Implement theme loading in `src/main.tsx`
- [ ] Add theme switcher to App navigation
- [ ] Support query params: `?theme=modern`
- [ ] Test each theme renders all 8 component categories
- [ ] Verify PostMessage communication works
- [ ] Validate security (nonce, origin checks)
- [ ] Build all apps: `npm run build` in each directory
- [ ] Deploy `dist/` folders to static hosting

---

## 🐛 Troubleshooting

| Issue                  | Solution                                                            |
| ---------------------- | ------------------------------------------------------------------- |
| Components not showing | Check `componentRegistry` in `src/previews/index.ts`                |
| Theme not applying     | Verify theme config loaded before component mount in `src/main.tsx` |
| PostMessage fails      | Validate nonce and parentOrigin match between parent & iframe       |
| Build error            | Run `npm install`, check Node 18+                                   |
| Styles missing         | Ensure globals.css imported in main.tsx                             |
| Dark mode broken       | For CSS vars, ensure `dark` class applied to `<html>`               |

---

## 📚 Additional Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Ant Design Docs](https://ant.design)
- [Chakra UI Docs](https://chakra-ui.com)
- [Material-UI Docs](https://mui.com)
- [Mantine Docs](https://mantine.dev)
- [DaisyUI Docs](https://daisyui.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Vite Docs](https://vitejs.dev)

---

## 📄 License

Same as parent project.
