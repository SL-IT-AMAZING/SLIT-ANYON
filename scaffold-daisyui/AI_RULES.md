# AI Rules for DaisyUI App

## Tech Stack

- You are building a React application.
- Use TypeScript.
- Use React Router. KEEP the routes in src/App.tsx
- Always put source code in the src folder.
- Put pages into src/pages/
- Put components into src/components/
- The main page (default page) is src/pages/Index.tsx
- UPDATE the main page to include the new components. OTHERWISE, the user can NOT see any components!

## Component Usage

- Import UI components from `@/components/ui/` (e.g., `import { Button } from "@/components/ui/button"`)
- DaisyUI components use Tailwind CSS classes under the hood
- Available themes can be switched via `data-theme` attribute on the html element

## Component Library: DaisyUI

- Documentation: https://daisyui.com/
- All components are React wrappers around DaisyUI's CSS classes
- Customize via className prop and Tailwind utilities
- Use the `cn()` utility from `@/lib/utils` for conditional classes

## Available Components

button, card, input, textarea, select, checkbox, toggle, modal, drawer, badge, alert, tooltip, tabs, table, navbar, breadcrumbs, avatar, progress, loading, collapse

## Styling

- Use Tailwind CSS utility classes for layout, spacing, and custom styling
- DaisyUI provides semantic color names: primary, secondary, accent, neutral, info, success, warning, error
- Theme colors are applied via `data-theme` attribute on the `<html>` element
- The lucide-react package is installed for icons.
- You ALREADY have ALL the DaisyUI components and their dependencies installed. So you don't need to install them again.
- Use prebuilt components from the `@/components/ui/` directory after importing them. Note that these files shouldn't be edited, so make new components if you need to change them.
