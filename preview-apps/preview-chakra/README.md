# Chakra UI Preview App

A standalone Vite + React preview application showcasing Chakra UI v2 components.

## Features

- **Chakra UI v2** component library with Material Design-inspired styling
- **React 18** (not React 19) for compatibility with Chakra UI v2
- **PostMessage security** pattern from preview-shadcn for iframe communication
- **8 component categories**:
  - Overview
  - Buttons (variants, sizes, states)
  - Inputs (text, select, textarea, various types)
  - Cards (basic, colored, with footer)
  - Dialogs (basic, centered, scrollable modals)
  - Tables (basic, striped, bordered)
  - Navigation (tabs with multiple variants)
  - Feedback (alerts, badges, toasts, status indicators)

## Build

```bash
cd preview-apps/preview-chakra
npm install --legacy-peer-deps
npm run build
```

## Development

```bash
npm run dev
```

## Architecture

- **ChakraProvider** wraps the app in `main.tsx` with custom theme
- **PostMessage security** in `App.tsx` validates origin and nonce before navigation
- **Component registry** in `previews/index.ts` for dynamic tab navigation
- **Chakra theme** in `theme.ts` with custom brand color palette
- **CSP meta tag** in `index.html` restricts script/style loading

## Key Files

- `src/main.tsx` - Entry point with ChakraProvider
- `src/App.tsx` - PostMessage security + navigation (copied pattern from preview-shadcn)
- `src/theme.ts` - Chakra theme configuration
- `src/previews/` - Component preview components using Chakra UI
- `vite.config.ts` - Vite configuration
- `tsconfig.*.json` - TypeScript configuration
- `index.html` - CSP meta tag + root HTML

## Notes

- React 18 required (Chakra UI v2 does not support React 19)
- `--legacy-peer-deps` flag needed during npm install for framer-motion compatibility
- No Tailwind CSS used (Chakra UI provides styling)
- Build output: `dist/`
