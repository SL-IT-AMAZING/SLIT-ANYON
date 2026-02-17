# Chat UI Components & Infrastructure Reference

## Available shadcn/UI Components

All components are in `src/components/ui/` and ready to use:

### Core Layout & Structure

- **card.tsx** - Card containers with bg-card styling
- **dialog.tsx** - Modal dialogs with data-open/data-closed state animations
- **alert-dialog.tsx** - Confirmation dialogs
- **sheet.tsx** - Slide-out panels
- **sidebar.tsx** - Pre-styled sidebar with special accent handling

### Form & Input

- **input.tsx** - Text input fields
- **textarea.tsx** - Multi-line text input
- **label.tsx** - Form labels
- **checkbox.tsx** - Checkbox controls
- **radio-group.tsx** - Radio button groups
- **switch.tsx** - Toggle switches
- **select.tsx** - Dropdown selects with animation support
- **toggle.tsx** / **toggle-group.tsx** - Toggle buttons (grouped)

### Content & Display

- **badge.tsx** - Badge labels
- **alert.tsx** - Alert boxes
- **skeleton.tsx** - Loading placeholders with shimmer animation
- **separator.tsx** - Visual separators
- **scroll-area.tsx** - Custom scrollable areas

### Menus & Dropdowns

- **dropdown-menu.tsx** - Context menus with fade-in/out animations
- **popover.tsx** - Floating popovers
- **tooltip.tsx** - Tooltips with data-open/data-closed animation (fade-in-0, zoom-in-95)
- **accordion.tsx** - Collapsible sections
- **command.tsx** - Command palette / search interface

### Custom Components

- **button.tsx** - Base button with CVA variants (default, destructive, outline, secondary, ghost, link)
- **LoadingBar.tsx** - Marquee animation progress bar (`animate-marquee`)
- **ColorPicker.tsx** - Custom color picker
- **NumberInput.tsx** - Numeric input
- **SimpleAvatar.tsx** - Simple avatar display

---

## CSS Variable & Color Token System

### Theme Variables (OKLch Color Space)

Located in `src/styles/globals.css` with automatic light/dark mode switching via `.dark` class:

#### Light Mode (Default)

```css
--background: oklch(1 0 0) /* Pure white */
  --background-lighter: oklch(0.995 0 0) --background-darker: oklch(0.955 0 0)
  --background-darkest: oklch(0.925 0 0) --foreground: oklch(0.145 0 0)
  /* Dark text */ --card: oklch(1 0 0) /* White cards */
  --primary: oklch(0.205 0 0) /* Dark buttons */ --secondary: oklch(0.97 0 0)
  /* Light backgrounds */ --accent: oklch(0.97 0 0) --muted: oklch(0.97 0 0)
  --destructive: oklch(0.577 0.245 27.325) /* Red/Orange hue */
  --border: oklch(0.922 0 0) --input: oklch(0.922 0 0)
  --sidebar: oklch(0.96 0 0) --sidebar-accent: oklch(0.92 0 0);
```

#### Dark Mode (.dark class)

```css
--background: oklch(0.145 0 0) /* Dark background */
  --foreground: oklch(0.985 0 0) /* Light text */ --card: oklch(0.145 0 0)
  /* Dark cards */ --primary: oklch(0.985 0 0) /* Light buttons */
  --sidebar: oklch(0.1 0 0) /* Very dark sidebar */;
```

#### Semantic Colors

- `--primary` / `--primary-foreground` - Primary actions & buttons
- `--secondary` / `--secondary-foreground` - Secondary elements
- `--accent` / `--accent-foreground` - Emphasized elements
- `--muted` / `--muted-foreground` - Disabled/secondary text
- `--destructive` / `--destructive-foreground` - Danger actions (red/orange)
- `--card` / `--card-foreground` - Card backgrounds & text
- `--border` / `--input` - Borders & input backgrounds
- `--ring` - Focus ring colors

#### Chart/Data Visualization Colors

```css
--chart-1: oklch(0.646 0.222 41.116) /* Orange/Yellow */
  --chart-2: oklch(0.6 0.118 184.704) /* Blue */
  --chart-3: oklch(0.398 0.07 227.392) /* Dark Blue */
  --chart-4: oklch(0.828 0.189 84.429) /* Green/Yellow */
  --chart-5: oklch(0.769 0.188 70.08) /* Orange */;
```

#### Radius & Spacing

```css
--radius: 0.625rem /* Base border-radius (~10px) */
  --radius-sm: calc(--radius - 4px) /* ~6px */ --radius-md: calc(--radius - 2px)
  /* ~8px */ --radius-lg: var(--radius) /* ~10px */
  --radius-xl: calc(--radius + 4px) /* ~14px */;
```

#### Sidebar Specific

```css
--sidebar: oklch(0.96 0 0) --sidebar-foreground: oklch(0.145 0 0)
  --sidebar-primary: oklch(0.145 0 0) --sidebar-primary-foreground: oklch(1 0 0)
  --sidebar-accent: oklch(0.92 0 0) /* Hover/active state */
  --sidebar-accent-foreground: oklch(0.145 0 0) --sidebar-border: oklch(0.9 0 0)
  --sidebar-ring: oklch(0.708 0 0);
```

#### Fonts

```css
--default-font-family:
  "Geist", sans-serif --default-mono-font-family: "Geist Mono", monospace;
```

### Using Theme Variables in Components

```tsx
// Use Tailwind color utilities
<div className="bg-primary text-primary-foreground">
  Primary button
</div>

<div className="dark:bg-card dark:text-card-foreground">
  Dark mode specific
</div>

// Or direct CSS variable access
<div style={{ backgroundColor: 'var(--primary)' }}>
  Direct variable
</div>
```

---

## Animation Infrastructure

### Tailwind Animations (Built-in)

Available through `tw-animate-css` plugin:

- `animate-in` / `animate-out` - Fade, zoom, slide animations
- `fade-in-0` / `fade-out-0` - Opacity animations
- `zoom-in-95` / `zoom-out-95` - Scale animations
- `slide-in-from-*` - Directional slide animations (top-2, left-2, right-2, bottom-2)

### Custom Animations Defined in globals.css

#### Marquee Animation

```css
@keyframes marquee {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}
.animate-marquee {
  animation: marquee 2s linear infinite;
}
```

**Used in:** LoadingBar.tsx, progress indicators

#### Shimmer Animation (for skeletons)

```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

**Used in:** skeleton.tsx for loading state

#### Settings Highlight (light mode)

```css
@keyframes settings-highlight {
  0% {
    background-color: oklch(0.85 0 0);
  }
  100% {
    background-color: transparent;
  }
}
.settings-highlight {
  animation: settings-highlight 1.5s ease-out;
}
```

#### Settings Highlight (dark mode)

```css
@keyframes settings-highlight-dark {
  0% {
    background-color: oklch(0.35 0 0);
  }
  100% {
    background-color: transparent;
  }
}
```

**Used in:** Settings UI when items are newly highlighted

### Framer Motion

- **Installed:** `framer-motion: ^12.6.3`
- Use for complex animations, choreography, gesture animations
- Not required for basic UI (Tailwind animations cover most cases)
- Example: Can be used for smooth chat message entrance, complex transitions

### Animation in UI Components

#### Dialog Animations

```tsx
// Data attributes control state-based animations
<DialogOverlay className="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0" />
<DialogPopup className="data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95" />
```

#### Tooltip Animations

```tsx
// Tooltip fades in, zooms in from 95% scale
<TooltipContent className="data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95" />
```

#### Dropdown Animations

```tsx
// Data attributes for animation states
data-state="open/closed"
data-side="top/bottom/left/right"
```

---

## Prose/Typography Support

### @tailwindcss/typography Plugin

- **Installed & Active:** `@tailwindcss/typography: ^0.5.16`
- **CSS Plugin import:** `@plugin "@tailwindcss/typography";` in globals.css
- **Usage:** Add `prose` class to container for markdown-like content

#### Prose Configuration (Chat-Ready)

```tsx
// Applied in ChatMessage.tsx for markdown rendering
<div
  className="prose dark:prose-invert 
                prose-headings:mb-2 
                prose-p:my-1 
                prose-pre:my-0 
                max-w-none 
                break-words"
>
  {/* Markdown content renders here */}
</div>
```

**Available prose modifiers:**

- `prose` - Base prose styling
- `dark:prose-invert` - Inverted colors for dark mode
- `prose-headings:mb-2` - Heading margins
- `prose-p:my-1` - Paragraph margins
- `prose-pre:my-0` - Code block spacing
- `max-w-none` - No width constraint (full container)
- `break-words` - Break long words in chat

#### Code Highlighting in Chat

```tsx
// CodeHighlight.tsx uses shiki with 'not-prose' to avoid double styling
<div className="shiki not-prose relative [&_pre]:overflow-auto">
  {/* Syntax-highlighted code */}
</div>
```

---

## Theme Context & Dark Mode

### ThemeContext.tsx Features

- **Theme Options:** "system" (default) | "light" | "dark"
- **Persistence:** Saves to localStorage
- **System Detection:** Watches `prefers-color-scheme` media query
- **DOM Application:** Adds `.dark` or `.light` class to `<html>` element

### Usage

```tsx
import { useTheme } from "@/contexts/ThemeContext";

function MyComponent() {
  const { theme, isDarkMode, setTheme } = useTheme();

  return (
    <>
      <p>Current theme: {theme}</p>
      <p>Dark mode active: {isDarkMode}</p>
      <button onClick={() => setTheme("dark")}>Dark</button>
      <button onClick={() => setTheme("light")}>Light</button>
      <button onClick={() => setTheme("system")}>System</button>
    </>
  );
}
```

**How it works:**

- ThemeProvider wraps entire app (in root layout)
- CSS variables automatically switch via `.dark` class selector
- All shadcn components use CSS variables → automatic dark mode support
- No component refactoring needed for theme support

---

## Recommended Chat UI Composition Examples

### Message Container

```tsx
import { Card, CardContent } from "@/components/ui/card";

export function ChatMessage({ role, content }) {
  return (
    <Card
      className={cn(
        role === "user" ? "ml-auto bg-primary" : "bg-card",
        "max-w-2xl",
      )}
    >
      <CardContent
        className={cn(
          role === "user" ? "text-primary-foreground" : "text-card-foreground",
          "prose dark:prose-invert",
        )}
      >
        {content}
      </CardContent>
    </Card>
  );
}
```

### Chat Input with Actions

```tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export function ChatInput() {
  return (
    <div className="flex gap-2 items-end">
      <Input placeholder="Type message..." className="flex-1" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon">Send</Button>
        </TooltipTrigger>
        <TooltipContent>Send message (Ctrl+Enter)</TooltipContent>
      </Tooltip>
    </div>
  );
}
```

### Streaming Response with Skeleton

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function StreamingMessage({ isStreaming }) {
  return isStreaming ? (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-lg p-4 space-y-2"
    >
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </motion.div>
  ) : null;
}
```

---

## Key Design Tokens Summary

| Token             | Light                     | Dark                      | Use Case                       |
| ----------------- | ------------------------- | ------------------------- | ------------------------------ |
| `bg-primary`      | oklch(0.205) - Dark       | oklch(0.985) - Light      | Primary buttons, active states |
| `bg-card`         | oklch(1) - White          | oklch(0.145) - Dark       | Message containers, cards      |
| `bg-background`   | oklch(1) - White          | oklch(0.145) - Dark       | Page background                |
| `text-foreground` | oklch(0.145) - Dark       | oklch(0.985) - Light      | Body text                      |
| `border`          | oklch(0.922) - Light gray | oklch(0.269) - Dark gray  | Dividers, borders              |
| `bg-destructive`  | oklch(0.577 0.245 27.325) | oklch(0.396 0.141 25.723) | Error/delete actions           |
| `prose`           | Markdown styling          | Inverted markdown         | Message content                |

---

## Configuration Files Location

- **CSS Variables:** `src/styles/globals.css` (lines 90-219)
- **Theme Context:** `src/contexts/ThemeContext.tsx`
- **UI Components:** `src/components/ui/*.tsx`
- **Chat Components:** `src/components/chat/*.tsx`
- **Tailwind (via Vite):** `vite.renderer.config.mts` (uses @tailwindcss/vite plugin)

---

## Ready-to-Use Patterns

### Error Messages

```tsx
<Alert className="bg-destructive/10 border-destructive/30">
  <AlertDescription className="text-destructive">
    Error message here
  </AlertDescription>
</Alert>
```

### Loading States

```tsx
<Skeleton className="h-12 w-full rounded-md animate-shimmer" />
```

### Disabled States

```tsx
<Button disabled className="opacity-50 cursor-not-allowed">
  Action
</Button>
```

### Responsive Layout

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* items */}
</div>
```

---

This infrastructure is **production-ready** and has been used throughout the app for consistent, accessible, and themeable UI.
