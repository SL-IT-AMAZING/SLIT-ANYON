# Input/Composer Styling Patterns - Comprehensive Mapping

## Overview

This document maps all existing input/composer styling patterns across the codebase to provide a reference for consistent UI restyle.

---

## 1. MAIN INPUT CONTAINERS

### HomeChatInput.tsx (Lines 81-172)

**Container Wrapper** (Line 81)

```
<div className="p-4" data-testid="home-chat-input-container">
```

- **Pattern**: Outer padding container
- **Values**: `p-4` (padding: 1rem on all sides)

**Input Box** (Lines 83-85)

```
className={`relative flex flex-col border border-border rounded-xl bg-background ${
  isDraggingOver ? "ring-2 ring-ring border-ring" : ""
}`}
```

- **Pattern**: Primary container with flex layout
- **Base Classes**:
  - Layout: `relative flex flex-col`
  - Border: `border border-border`
  - Radius: `rounded-xl` (0.75rem)
  - Background: `bg-background`
  - Drag state: `ring-2 ring-ring border-ring` (conditional)

**Input Row** (Line 99)

```
<div className="flex items-end gap-2 px-4 pb-3 pt-2">
```

- **Pattern**: Flex row with text input and send button
- **Classes**:
  - Layout: `flex items-end gap-2`
  - Spacing: `px-4 pb-3 pt-2` (h-padding: 1rem, bottom: 0.75rem, top: 0.5rem)

**Controls Row** (Line 146)

```
<div className="px-3 pb-3 flex items-center justify-between">
```

- **Pattern**: Secondary row for action controls
- **Classes**:
  - Layout: `flex items-center justify-between`
  - Spacing: `px-3 pb-3` (h-padding: 0.75rem, bottom: 0.75rem)

---

### ChatInput.tsx (Lines 407-547)

**Container Wrapper** (Line 407)

```
<div className="px-3 pb-4 md:pb-6" data-testid="chat-input-container">
```

- **Pattern**: Outer padding, responsive vertical padding
- **Values**: `px-3` (h-padding: 0.75rem), `pb-4 md:pb-6` (responsive bottom)

**Input Box** (Lines 416-418)

```
className={`relative flex flex-col border border-input rounded-2xl bg-background shadow-sm ${
  isDraggingOver ? "ring-2 ring-ring border-ring" : ""
} ${showBanner ? "rounded-t-none border-t-0" : ""}`}
```

- **Pattern**: Primary container with conditional states
- **Base Classes**:
  - Layout: `relative flex flex-col`
  - Border: `border border-input` (uses `input` color, slightly different from HomeChatInput)
  - Radius: `rounded-2xl` (1rem) [DIFFERENT from HomeChatInput's rounded-xl]
  - Background: `bg-background`
  - Shadow: `shadow-sm` (0 1px 2px rgba(0,0,0,0.05))
  - Drag state: `ring-2 ring-ring border-ring`
  - Banner state: `rounded-t-none border-t-0` (conditional)

**Input Row** (Line 485)

```
<div className="flex items-end gap-2 px-3 pb-2 pt-1">
```

- **Pattern**: Flex row (similar to HomeChatInput but different padding)
- **Classes**:
  - Layout: `flex items-end gap-2`
  - Spacing: `px-3 pb-2 pt-1` (h-padding: 0.75rem, bottom: 0.5rem, top: 0.25rem)

**Controls Row** (Line 533)

```
<div className="px-3 pb-2 flex items-center justify-between">
```

- **Pattern**: Secondary row for action controls
- **Classes**:
  - Layout: `flex items-center justify-between`
  - Spacing: `px-3 pb-2` (h-padding: 0.75rem, bottom: 0.5rem)

---

## 2. LEXICAL EDITOR (LexicalChatInput.tsx)

### Editor Container (Line 449)

```
<div className="relative flex-1">
```

- **Pattern**: Flex fill container
- **Classes**: `relative flex-1`

### ContentEditable (Lines 452-453)

```
className="flex-1 px-4 pt-4 pb-2 focus:outline-none overflow-y-auto min-h-[44px] max-h-[200px] resize-none text-sm"
```

- **Pattern**: Editable text area with auto-expand
- **Classes**:
  - Layout: `flex-1 min-h-[44px] max-h-[200px] resize-none`
  - Spacing: `px-4 pt-4 pb-2` (h-padding: 1rem, top: 1rem, bottom: 0.5rem)
  - Typography: `text-sm`
  - Scroll: `overflow-y-auto`
  - Focus: `focus:outline-none`

### Placeholder (Lines 455-458)

```
placeholder={
  <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none select-none text-sm">
    {placeholder}
  </div>
}
```

- **Pattern**: Absolute positioned placeholder
- **Classes**:
  - Position: `absolute top-4 left-4`
  - Typography: `text-sm text-muted-foreground`
  - Interaction: `pointer-events-none select-none`

### Mention Menu (Lines 97-108)

```
className="m-0 mb-1 min-w-[300px] w-auto max-h-64 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg z-50"
```

- **Pattern**: Floating dropdown menu
- **Classes**:
  - Layout: `m-0 mb-1 min-w-[300px] w-auto max-h-64 overflow-y-auto`
  - Border: `border border-border`
  - Radius: `rounded-lg` (0.5rem)
  - Background: `bg-popover`
  - Shadow: `shadow-lg` (0 10px 15px -3px rgba(0,0,0,0.1))
  - Stacking: `z-50`

### Mention Menu Items (Lines 66-75)

```
className={`m-0 flex items-center px-3 py-2 cursor-pointer whitespace-nowrap ${
  selected
    ? "bg-accent text-accent-foreground"
    : "bg-popover text-popover-foreground hover:bg-accent/50"
}`}
```

- **Pattern**: List item with selection state
- **Base**: `m-0 flex items-center px-3 py-2 cursor-pointer whitespace-nowrap`
- **Selected**: `bg-accent text-accent-foreground`
- **Unselected**: `bg-popover text-popover-foreground hover:bg-accent/50`

---

## 3. CHAT-V2 COMPOSER (Composer.tsx)

### Container (Lines 56-61)

```
className={cn(
  "rounded-2xl border border-input bg-background shadow-sm",
  disabled && "opacity-50 pointer-events-none",
  className,
)}
```

- **Pattern**: Minimalist composer container
- **Base Classes**:
  - Radius: `rounded-2xl` (1rem)
  - Border: `border border-input`
  - Background: `bg-background`
  - Shadow: `shadow-sm`
  - Disabled: `opacity-50 pointer-events-none`

### Textarea (Lines 63-72)

```
className="min-h-14 w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm placeholder:text-muted-foreground focus:outline-none"
```

- **Pattern**: Auto-growing textarea
- **Classes**:
  - Layout: `min-h-14 w-full resize-none`
  - Spacing: `px-4 pt-3 pb-2`
  - Typography: `text-sm`
  - Focus: `focus:outline-none`
  - Placeholder: `placeholder:text-muted-foreground`
  - Background: `bg-transparent`

### Button Row (Line 75)

```
<div className="flex items-center justify-end px-3 pb-3">
```

- **Pattern**: Bottom action bar
- **Classes**:
  - Layout: `flex items-center justify-end`
  - Spacing: `px-3 pb-3`

### Send Button (Lines 85-93)

```
className={cn(
  "flex size-8 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90",
  !canSend && "opacity-30 pointer-events-none",
)}
```

- **Pattern**: Circular icon button
- **Base Classes**:
  - Layout: `flex size-8 items-center justify-center`
  - Radius: `rounded-full`
  - Colors: `bg-foreground text-background`
  - Interaction: `transition-colors hover:bg-foreground/90`
  - Disabled: `opacity-30 pointer-events-none`

### Stop Button (Lines 77-83)

```
className="flex size-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted"
```

- **Pattern**: Circular outline button
- **Classes**:
  - Layout: `flex size-8 items-center justify-center`
  - Border: `border border-border`
  - Radius: `rounded-full`
  - Colors: `bg-background`
  - Interaction: `transition-colors hover:bg-muted`

---

## 4. CHAT-V2 THREAD (Thread.tsx)

### Thread Wrapper (Lines 10-19)

```
className={cn("flex h-full flex-col bg-background", className)}
style={{ "--thread-max-width": "44rem" } as React.CSSProperties}
```

- **Pattern**: Full-height flex container
- **Classes**: `flex h-full flex-col bg-background`
- **CSS Var**: `--thread-max-width: 44rem` (704px)

### ThreadViewport (Lines 26-37)

```
className={cn(
  "flex flex-1 flex-col overflow-x-hidden overflow-y-auto scroll-smooth px-4 pt-4",
  className,
)}
```

- **Pattern**: Scrollable message area
- **Classes**:
  - Layout: `flex flex-1 flex-col`
  - Scroll: `overflow-x-hidden overflow-y-auto scroll-smooth`
  - Spacing: `px-4 pt-4`

### ThreadMessages (Lines 44-55)

```
className={cn(
  "mx-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-1",
  className,
)}
```

- **Pattern**: Constrained message list
- **Classes**:
  - Layout: `mx-auto flex w-full flex-col gap-1`
  - Width: `max-w-[var(--thread-max-width)]` (44rem)

### ThreadFooter (Lines 62-73)

```
className={cn(
  "sticky bottom-0 mx-auto mt-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6",
  className,
)}
```

- **Pattern**: Sticky footer with rounded top
- **Classes**:
  - Position: `sticky bottom-0 mt-auto`
  - Layout: `mx-auto flex w-full flex-col gap-4`
  - Width: `max-w-[var(--thread-max-width)]`
  - Radius: `rounded-t-3xl` (1.5rem top corners only)
  - Background: `bg-background`
  - Spacing: `pb-4 md:pb-6` (responsive)
  - Scroll: `overflow-visible`

### ThreadWelcome (Lines 81-103)

```
className={cn(
  "flex flex-1 flex-col items-center justify-center gap-2 px-4",
  className,
)}
```

- **Pattern**: Centered welcome message
- **Classes**:
  - Layout: `flex flex-1 flex-col items-center justify-center gap-2`
  - Spacing: `px-4`

---

## 5. BUTTON PATTERNS

### Send Button (HomeChatInput - Line 136)

```
className="flex items-center justify-center size-8 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground"
```

- **Size**: `size-8` (32px)
- **Radius**: `rounded-full`
- **Active**: `bg-primary text-primary-foreground hover:bg-primary/90`
- **Disabled**: `opacity-50 bg-muted text-muted-foreground`

### Stop Button (HomeChatInput - Line 118)

```
className="flex items-center justify-center size-8 shrink-0 rounded-full bg-muted text-muted-foreground cursor-not-allowed"
```

- **Size**: `size-8`
- **Radius**: `rounded-full`
- **Colors**: `bg-muted text-muted-foreground cursor-not-allowed`

### Stop Button (ChatInput - Line 504)

```
className="flex items-center justify-center size-8 shrink-0 rounded-full border border-border bg-background transition-colors hover:bg-muted"
```

- **Size**: `size-8`
- **Radius**: `rounded-full`
- **Border**: `border border-border`
- **Colors**: `bg-background hover:bg-muted`

### Send Button (ChatInput - Line 523)

```
className="flex items-center justify-center size-8 shrink-0 rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90 disabled:opacity-30 disabled:pointer-events-none"
```

- **Size**: `size-8`
- **Radius**: `rounded-full`
- **Active**: `bg-foreground text-background hover:bg-foreground/90`
- **Disabled**: `opacity-30 pointer-events-none`

### Secondary Button (HomeChatInput - Line 157)

```
className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
```

- **Pattern**: Small text button
- **Spacing**: `px-2 py-1 gap-1.5`
- **Typography**: `text-xs`
- **Colors**: `text-muted-foreground hover:text-foreground hover:bg-accent`
- **Radius**: `rounded-md`

---

## 6. COLOR/STATE PATTERNS

### Border Colors

- **Input borders**: `border-border` (primary), `border-input` (alternate, slightly different)
- **Drag state**: `border-ring`

### Background Colors

- **Main**: `bg-background`
- **Muted**: `bg-muted`
- **Accent**: `bg-accent`
- **Popup**: `bg-popover`
- **Transparent**: `bg-transparent`

### Text Colors

- **Primary**: `text-foreground`
- **Muted**: `text-muted-foreground`
- **Accent**: `text-accent-foreground`
- **Popup**: `text-popover-foreground`

### Shadow Usage

- `shadow-sm` - Input boxes, composer
- `shadow-lg` - Dropdown menus

---

## 7. SPACING CONVENTIONS

### Horizontal Padding (px)

- `px-2` = 0.5rem (8px)
- `px-3` = 0.75rem (12px)
- `px-4` = 1rem (16px)
- `px-8` = 2rem (32px)

### Vertical Padding (py/pb/pt)

- `py-1` = 0.25rem (4px)
- `py-2` = 0.5rem (8px)
- `pb-2` = 0.5rem, `pt-1` = 0.25rem
- `pb-3` = 0.75rem
- `pt-4` = 1rem, `pb-2` = 0.5rem

### Gap/Spacing Between Elements

- `gap-1` = 0.25rem
- `gap-1.5` = 0.375rem
- `gap-2` = 0.5rem
- `gap-4` = 1rem

---

## 8. BORDER RADIUS TIERS

| Value          | Size           | Usage                             |
| -------------- | -------------- | --------------------------------- |
| `rounded-md`   | 0.375rem (6px) | Small buttons, secondary elements |
| `rounded-lg`   | 0.5rem (8px)   | Dropdowns, menus                  |
| `rounded-xl`   | 0.75rem (12px) | HomeChatInput container           |
| `rounded-2xl`  | 1rem (16px)    | ChatInput container, Composer     |
| `rounded-3xl`  | 1.5rem (24px)  | Thread footer top corners         |
| `rounded-full` | 50%            | Circular buttons                  |

---

## 9. KEY DIFFERENCES BETWEEN IMPLEMENTATIONS

### HomeChatInput vs ChatInput

| Aspect                      | HomeChatInput    | ChatInput           |
| --------------------------- | ---------------- | ------------------- |
| **Container Radius**        | `rounded-xl`     | `rounded-2xl`       |
| **Container Border**        | `border-border`  | `border-input`      |
| **Container Shadow**        | None             | `shadow-sm`         |
| **Input Row Spacing**       | `px-4 pb-3 pt-2` | `px-3 pb-2 pt-1`    |
| **Control Row Spacing**     | `px-3 pb-3`      | `px-3 pb-2`         |
| **Outer Container Padding** | `p-4`            | `px-3 pb-4 md:pb-6` |

### Composer vs Input Components

| Aspect               | Composer             | Input                                  |
| -------------------- | -------------------- | -------------------------------------- |
| **Design Language**  | Minimal/Modern       | Standard                               |
| **Container Radius** | `rounded-2xl`        | `rounded-xl/2xl`                       |
| **Textarea Height**  | `min-h-14`           | `min-h-[44px]` (implicit from content) |
| **Button Style**     | Circular, integrated | Tooltip-wrapped                        |
| **Shadow**           | `shadow-sm`          | `shadow-sm`                            |

---

## 10. DESIGN SYSTEM VARIABLES (from globals.css)

### Radius

- `--radius: 0.625rem` (10px base)
- Used in tailwind via `rounded-[length:var(--radius)]`

### Colors (oklch format - light mode)

- `--background: oklch(1 0 0)` (pure white)
- `--foreground: oklch(0.145 0 0)` (very dark gray)
- `--border: oklch(0.922 0 0)` (light gray)
- `--input: oklch(0.922 0 0)` (same as border)
- `--muted: oklch(0.97 0 0)` (almost white)
- `--accent: oklch(0.97 0 0)` (almost white)
- `--ring: oklch(0.708 0 0)` (medium gray)

### Colors (dark mode)

- `--background: oklch(0.145 0 0)` (very dark)
- `--foreground: oklch(0.985 0 0)` (white)
- `--border: oklch(0.269 0 0)` (dark gray)
- `--input: oklch(0.269 0 0)` (dark gray)
- `--muted: oklch(0.269 0 0)` (dark gray)
- `--accent: oklch(0.269 0 0)` (dark gray)

---

## 11. INTERACTION PATTERNS

### Focus States

- `focus:outline-none` - Remove default outline
- `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]` - Custom ring

### Hover States

- Buttons: `hover:bg-primary/90`, `hover:bg-foreground/90`, `hover:bg-muted`
- Text: `hover:text-foreground`, `hover:bg-accent/50`

### Disabled States

- Opacity: `disabled:opacity-50`, `opacity-30`
- Pointer: `disabled:pointer-events-none`, `pointer-events-none`
- Color: `disabled:bg-muted disabled:text-muted-foreground`

### Drag States

- `ring-2 ring-ring border-ring` - Active drag indicator

---

## 12. CONSISTENT PATTERN RECOMMENDATIONS

### For NEW Input Restyle:

1. **Use `rounded-2xl`** (1rem) for container radius (ChatInput standard)
2. **Use `shadow-sm`** for elevation (consistent with ChatInput/Composer)
3. **Use `border-input`** for main borders (consistent with ChatInput)
4. **Spacing**: Follow ChatInput pattern `px-3 pb-2 pt-1` for input rows
5. **Buttons**: Keep `size-8 rounded-full` for send/stop buttons
6. **Colors**: Use semantic colors (`bg-primary`, `bg-foreground`) not literal colors
7. **State handling**: Use `ring-2 ring-ring border-ring` for drag/focus states

---

## FILE REFERENCE GUIDE

| Component        | File Path                                  | Key Classes                                     |
| ---------------- | ------------------------------------------ | ----------------------------------------------- |
| HomeChatInput    | `src/components/chat/HomeChatInput.tsx`    | `p-4`, `rounded-xl`, `px-4 pb-3 pt-2`           |
| ChatInput        | `src/components/chat/ChatInput.tsx`        | `px-3 pb-4 md:pb-6`, `rounded-2xl`, `shadow-sm` |
| LexicalChatInput | `src/components/chat/LexicalChatInput.tsx` | `px-4 pt-4 pb-2`, `min-h-[44px]`                |
| Composer (v2)    | `src/components/chat-v2/Composer.tsx`      | `rounded-2xl`, `px-4 pt-3 pb-2`                 |
| Thread (v2)      | `src/components/chat-v2/Thread.tsx`        | `rounded-t-3xl`, CSS vars                       |
| Button (UI)      | `src/components/ui/button.tsx`             | `rounded-md`, size variants                     |
| Input (UI)       | `src/components/ui/input.tsx`              | `border-input`, `shadow-xs`                     |
| Card (UI)        | `src/components/ui/card.tsx`               | `rounded-xl`, `shadow-sm`                       |
| Theme            | `src/styles/globals.css`                   | Color/radius variables                          |
