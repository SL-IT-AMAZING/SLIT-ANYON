# Input/Composer Styling - Quick Reference

## TL;DR: Standards to Follow

### Container Styling
```tsx
// ✅ Use ChatInput as primary reference
className="border border-input rounded-2xl bg-background shadow-sm"
```

### Button Styling (Send/Stop)
```tsx
// Send Button (active state)
className="flex items-center justify-center size-8 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90"

// Stop Button (streaming state)  
className="flex items-center justify-center size-8 shrink-0 rounded-full border border-border bg-background hover:bg-muted"
```

### Input Row Spacing
```tsx
// ✅ Standard spacing for input + button row
className="flex items-end gap-2 px-3 pb-2 pt-1"
```

---

## Component-Specific Patterns

| Component | File | Key Pattern |
|-----------|------|-------------|
| **HomeChatInput** | `src/components/chat/HomeChatInput.tsx` | Older style: `rounded-xl`, no shadow |
| **ChatInput** | `src/components/chat/ChatInput.tsx` | **USE AS REFERENCE**: `rounded-2xl shadow-sm` |
| **Composer (v2)** | `src/components/chat-v2/Composer.tsx` | Modern minimal: `rounded-2xl`, built-in buttons |
| **LexicalChatInput** | `src/components/chat/LexicalChatInput.tsx` | Lexical editor: `min-h-[44px] max-h-[200px]` |
| **Thread (v2)** | `src/components/chat-v2/Thread.tsx` | Layout: `rounded-t-3xl footer`, max-width vars |

---

## Color Palette Quick Map

```
Semantic Colors:
  Background:    bg-background
  Foreground:    text-foreground
  Border:        border-border (primary), border-input (alternate)
  Muted:         bg-muted, text-muted-foreground
  Accent:        bg-accent, text-accent-foreground
  Primary:       bg-primary, text-primary-foreground
  Popup:         bg-popover, text-popover-foreground
  
State Colors:
  Hover:         hover:bg-primary/90, hover:bg-muted
  Disabled:      disabled:opacity-50, disabled:pointer-events-none
  Focus:         ring-ring, ring-[3px]
```

---

## Spacing Tiers (Tailwind)

### Padding
| Class | Value | Use Case |
|-------|-------|----------|
| `px-2` | 0.5rem | Tight spacing |
| `px-3` | 0.75rem | Standard horizontal |
| `px-4` | 1rem | Relaxed horizontal |
| `py-1` | 0.25rem | Tight vertical |
| `py-2` | 0.5rem | Standard vertical |
| `pb-3 pt-2` | Mixed | Mixed vertical |

### Gaps
| Class | Value |
|-------|-------|
| `gap-1` | 0.25rem |
| `gap-1.5` | 0.375rem |
| `gap-2` | 0.5rem |
| `gap-4` | 1rem |

---

## Border Radius Scale

| Class | Size | Use |
|-------|------|-----|
| `rounded-md` | 6px | Small buttons |
| `rounded-lg` | 8px | Dropdowns |
| `rounded-xl` | 12px | Legacy inputs (HomeChatInput) |
| `rounded-2xl` | 16px | **Modern inputs** (ChatInput, Composer) ✅ |
| `rounded-3xl` | 24px | Large footers (Thread) |
| `rounded-full` | 50% | Icon buttons |

---

## State Patterns

### Drag Over State
```tsx
isDraggingOver ? "ring-2 ring-ring border-ring" : ""
```

### Disabled Button
```tsx
disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground disabled:pointer-events-none
```

### Hover Effects
```tsx
// Button hover
hover:bg-primary/90

// Text button hover
hover:text-foreground hover:bg-accent

// Muted hover
hover:bg-muted
```

---

## Shadow Standards

```
shadow-sm  → 0 1px 2px rgba(0,0,0,0.05)  [INPUT BOXES, COMPOSER]
shadow-lg  → 0 10px 15px -3px rgba(...)  [DROPDOWNS]
```

---

## Critical File Locations

| Purpose | File |
|---------|------|
| **Theme/Colors** | `src/styles/globals.css` |
| **Button Variants** | `src/components/ui/button.tsx` |
| **Input Component** | `src/components/ui/input.tsx` |
| **Primary Chat Input** | `src/components/chat/ChatInput.tsx` ← **USE AS PATTERN** |
| **Home Screen Input** | `src/components/chat/HomeChatInput.tsx` |
| **Rich Text Input** | `src/components/chat/LexicalChatInput.tsx` |
| **Modern Composer** | `src/components/chat-v2/Composer.tsx` |
| **Chat Layout** | `src/components/chat-v2/Thread.tsx` |

---

## Implementation Checklist

When restyling an input component:

- [ ] Container: Use `rounded-2xl border border-input bg-background shadow-sm`
- [ ] Input row: Use `flex items-end gap-2 px-3 pb-2 pt-1`
- [ ] Send button: `size-8 rounded-full bg-foreground text-background`
- [ ] Stop button: `size-8 rounded-full border border-border bg-background`
- [ ] Button hover: Add `transition-colors hover:bg-foreground/90` (or appropriate color)
- [ ] Disabled state: `disabled:opacity-50 disabled:pointer-events-none`
- [ ] Drag state: `isDraggingOver ? "ring-2 ring-ring border-ring" : ""`
- [ ] Colors: Use semantic tokens, not literal colors
- [ ] Test: Light + dark mode, hover/focus/disabled states

---

## Design System Reference

**Design Language**: Semantic color system using OKLch color space  
**Framework**: Tailwind CSS v4 (inline theme engine)  
**Button System**: CVA (class-variance-authority) with variants  
**Responsive**: Mobile-first with breakpoint modifiers (md:, lg:)  

See `src/styles/globals.css` for complete color definitions.

