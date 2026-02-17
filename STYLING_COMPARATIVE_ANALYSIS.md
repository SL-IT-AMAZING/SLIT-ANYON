# Input Components - Comparative Styling Analysis

## Visual & Structural Comparison Matrix

### 1. CONTAINER STYLING COMPARISON

#### HomeChatInput (Legacy)
```tsx
<div className="p-4">
  <div className={`relative flex flex-col border border-border rounded-xl bg-background`} />
</div>
```
**Characteristics:**
- **Outer padding**: `p-4` (1rem full padding)
- **Border radius**: `rounded-xl` (12px) - **OLDER STYLE**
- **Border color**: `border-border` 
- **Shadow**: None
- **Visual weight**: Lighter, minimal elevation
- **Use case**: Home screen, less formal context

---

#### ChatInput (Current Standard ⭐)
```tsx
<div className="px-3 pb-4 md:pb-6">
  <div className={`relative flex flex-col border border-input rounded-2xl bg-background shadow-sm ${...}`} />
</div>
```
**Characteristics:**
- **Outer padding**: `px-3 pb-4 md:pb-6` (responsive)
- **Border radius**: `rounded-2xl` (16px) - **MODERN STANDARD** ✅
- **Border color**: `border-input` (slightly warmer than `border-border`)
- **Shadow**: `shadow-sm` (subtle elevation)
- **Visual weight**: Modern, elevated
- **Use case**: Main chat interface, sophisticated context
- **Responsive**: Larger bottom padding on desktop

---

#### Composer v2 (Modern Minimal)
```tsx
<div className={cn(
  "rounded-2xl border border-input bg-background shadow-sm",
  disabled && "opacity-50 pointer-events-none"
)}>
```
**Characteristics:**
- **No outer wrapper**: Direct styling on container
- **Border radius**: `rounded-2xl` (16px) - matches ChatInput ✅
- **Border color**: `border-input` - consistent
- **Shadow**: `shadow-sm` - consistent
- **Visual weight**: Minimal, modern
- **Design philosophy**: Self-contained, no extra markup
- **Disabled state**: Built-in opacity handling

---

### 2. INTERNAL SPACING COMPARISON

#### HomeChatInput Input Row
```tsx
<div className="flex items-end gap-2 px-4 pb-3 pt-2">
```
- **Horizontal**: `px-4` = 1rem
- **Bottom**: `pb-3` = 0.75rem
- **Top**: `pt-2` = 0.5rem
- **Gap**: `gap-2` = 0.5rem
- **Profile**: Generous horizontal, asymmetric vertical

#### ChatInput Input Row
```tsx
<div className="flex items-end gap-2 px-3 pb-2 pt-1">
```
- **Horizontal**: `px-3` = 0.75rem (tighter)
- **Bottom**: `pb-2` = 0.5rem (tighter)
- **Top**: `pt-1` = 0.25rem (tighter)
- **Gap**: `gap-2` = 0.5rem (same)
- **Profile**: Compact, refined, consistent

**Verdict**: ChatInput is the modern refined approach. ✅

#### Composer Textarea Row
```tsx
<textarea className="px-4 pt-3 pb-2 ... min-h-14 max-h-[200px]" />
```
- **Horizontal**: `px-4` = 1rem
- **Top**: `pt-3` = 0.75rem
- **Bottom**: `pb-2` = 0.5rem
- **Height**: `min-h-14` = 56px
- **Profile**: Balanced, spacious

---

### 3. CONTROL ROW COMPARISON

#### HomeChatInput
```tsx
<div className="px-3 pb-3 flex items-center justify-between">
```
- **Horizontal**: `px-3` = 0.75rem
- **Bottom**: `pb-3` = 0.75rem
- **Symmetrical bottom padding** with input row

#### ChatInput
```tsx
<div className="px-3 pb-2 flex items-center justify-between">
```
- **Horizontal**: `px-3` = 0.75rem
- **Bottom**: `pb-2` = 0.5rem
- **Tighter** than HomeChatInput
- **Consistent** with input row spacing

#### Composer Button Row
```tsx
<div className="flex items-center justify-end px-3 pb-3">
```
- **Horizontal**: `px-3` = 0.75rem
- **Bottom**: `pb-3` = 0.75rem
- **Consistent** vertical spacing

---

### 4. BUTTON STYLING COMPARISON

#### Send Button (HomeChatInput)
```tsx
className="flex items-center justify-center size-8 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:bg-muted disabled:text-muted-foreground"
```
| Aspect | Value |
|--------|-------|
| **Size** | `size-8` (32px) |
| **Active BG** | `bg-primary` |
| **Active Text** | `text-primary-foreground` |
| **Hover** | `hover:bg-primary/90` |
| **Disabled** | `opacity-50 + color change` |
| **Semantic** | Color-based semantic meaning |

---

#### Send Button (ChatInput)
```tsx
className="flex items-center justify-center size-8 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:pointer-events-none"
```
| Aspect | Value |
|--------|-------|
| **Size** | `size-8` (32px) - same |
| **Active BG** | `bg-foreground` (darker, higher contrast) |
| **Active Text** | `text-background` (lighter) |
| **Hover** | `hover:bg-foreground/90` |
| **Disabled** | `opacity-30 + pointer-events-none` |
| **Semantic** | Value-based (dark/light) |
| **Contrast** | Higher contrast than HomeChatInput |

---

#### Send Button (Composer v2)
```tsx
className={cn(
  "flex size-8 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90",
  !canSend && "opacity-30 pointer-events-none",
)}
```
| Aspect | Value |
|--------|-------|
| **Size** | `size-8` |
| **Active BG** | `bg-foreground` - same as ChatInput ✅ |
| **Active Text** | `text-background` |
| **Hover** | `hover:bg-foreground/90` |
| **Disabled** | `opacity-30 pointer-events-none` |
| **Transition** | Explicit `transition-colors` |
| **Pattern** | Matches ChatInput exactly |

---

#### Stop Button (HomeChatInput - Disabled State)
```tsx
className="flex items-center justify-center size-8 shrink-0 rounded-full bg-muted text-muted-foreground cursor-not-allowed"
```
| Aspect | Value |
|--------|-------|
| **Style** | Static disabled appearance |
| **Background** | `bg-muted` (neutral) |
| **Text** | `text-muted-foreground` |
| **Cursor** | `cursor-not-allowed` |
| **Appearance** | Visually disabled |

---

#### Stop Button (ChatInput - Streaming State)
```tsx
className="flex items-center justify-center size-8 shrink-0 rounded-full border border-border bg-background transition-colors hover:bg-muted"
```
| Aspect | Value |
|--------|-------|
| **Style** | Interactive outline button |
| **Border** | `border border-border` |
| **Background** | `bg-background` (transparent-ish) |
| **Hover** | `hover:bg-muted` |
| **Cursor** | Implicit (not disabled) |
| **Appearance** | Active, clickable |

---

#### Stop Button (Composer v2)
```tsx
className="flex size-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted"
```
| Aspect | Value |
|--------|-------|
| **Style** | Outline button (matches ChatInput) ✅ |
| **Border** | `border border-border` |
| **Background** | `bg-background` |
| **Hover** | `hover:bg-muted` |
| **Transition** | Explicit transition |
| **Pattern** | Identical to ChatInput |

---

### 5. LEXICAL EDITOR SPECIFIC

#### ContentEditable Container
```tsx
<ContentEditable
  className="flex-1 px-4 pt-4 pb-2 focus:outline-none overflow-y-auto min-h-[44px] max-h-[200px] resize-none text-sm"
/>
```
**Unique characteristics:**
- **Min height**: `min-h-[44px]` (touch-friendly)
- **Max height**: `max-h-[200px]` (prevents runaway growth)
- **Vertical spacing**: `pt-4 pb-2` (asymmetric, top-heavy)
- **Horizontal**: `px-4` (1rem, matches HomeChatInput)
- **No resize**: `resize-none` (controlled growth only)
- **Scroll**: `overflow-y-auto` (internal scrolling)

#### Mention Menu
```tsx
className="m-0 mb-1 min-w-[300px] w-auto max-h-64 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg z-50"
```
**Special styling:**
- **Width**: `min-w-[300px]` (explicit minimum)
- **Height**: `max-h-64` (capped at 256px)
- **Radius**: `rounded-lg` (8px - smaller than containers)
- **Shadow**: `shadow-lg` (more prominent than input shadow)
- **Z-index**: `z-50` (ensures visibility)
- **Spacing**: `m-0 mb-1` (tight margins)

---

### 6. THREAD/FOOTER STYLING

#### ThreadFooter (Sticky Container)
```tsx
className={cn(
  "sticky bottom-0 mx-auto mt-auto flex w-full max-w-[var(--thread-max-width)] flex-col gap-4 overflow-visible rounded-t-3xl bg-background pb-4 md:pb-6",
)}
```
**Distinctive features:**
- **Position**: `sticky bottom-0` (stays at bottom during scroll)
- **Radius**: `rounded-t-3xl` (24px, only top corners - large)
- **Max width**: `max-w-[var(--thread-max-width)]` (44rem = 704px)
- **Gap**: `gap-4` (1rem between internal elements)
- **Responsive**: `pb-4 md:pb-6` (different mobile/desktop)
- **Scrolling**: `overflow-visible` (allows child overflow)

**Visual purpose**: Creates "floating" footer effect above scrollable message area

---

## 7. COLOR USAGE PATTERNS

### Three Button Patterns Identified

#### Pattern A: Semantic Primary (HomeChatInput Send)
```
bg-primary text-primary-foreground
```
✓ Aligns with site primary color  
✗ Less contrast in some themes  
✗ Depends on theme color scheme

#### Pattern B: Value-Based (ChatInput & Composer Send) ⭐
```
bg-foreground text-background
```
✓ **Highest contrast always**  
✓ **Works in light AND dark mode**  
✓ **Most accessible**  
✓ **Matches Composer v2**

#### Pattern C: State-Based (Stop Button)
```
border border-border bg-background hover:bg-muted
```
✓ Secondary, outline style  
✓ Subtle state change  
✓ Consistent across variants

---

## 8. EVOLUTION TIMELINE

```
HomeChatInput (Initial)
├─ rounded-xl (12px)
├─ px-4 spacing (loose)
├─ bg-primary buttons (semantic)
└─ No shadow

    ↓ (Evolution)

ChatInput (Current Standard) ⭐
├─ rounded-2xl (16px)
├─ px-3 spacing (refined)
├─ bg-foreground buttons (value-based, higher contrast)
└─ shadow-sm (modern elevation)

    ↓ (Parallel evolution)

Composer v2 (Modern Minimal)
├─ rounded-2xl (16px) - same as ChatInput ✅
├─ px-4 textarea spacing
├─ bg-foreground buttons (matches ChatInput) ✅
├─ shadow-sm (consistent)
└─ Self-contained design
```

---

## 9. RECOMMENDED STANDARDS

### For NEW Components: Use ChatInput Pattern ✅

**Container**
```tsx
className="border border-input rounded-2xl bg-background shadow-sm"
```

**Input Row**
```tsx
className="flex items-end gap-2 px-3 pb-2 pt-1"
```

**Send Button**
```tsx
className="flex items-center justify-center size-8 shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30 disabled:pointer-events-none"
```

**Stop Button**
```tsx
className="flex items-center justify-center size-8 shrink-0 rounded-full border border-border bg-background hover:bg-muted"
```

### Why This Pattern?

1. ✅ **Modern**: `rounded-2xl` is current standard
2. ✅ **Accessible**: `bg-foreground` has maximum contrast
3. ✅ **Tested**: Already shipping in ChatInput, Composer
4. ✅ **Responsive**: Appropriate padding and gaps
5. ✅ **Consistent**: Matches v2 design system
6. ✅ **Flexible**: Works with all future styling without refactor

---

## 10. Migration Path for HomeChatInput

If HomeChatInput needs updating to modern standards:

```tsx
// BEFORE (Current)
className={`relative flex flex-col border border-border rounded-xl bg-background`}

// AFTER (Modernized)
className={`relative flex flex-col border border-input rounded-2xl bg-background shadow-sm`}
```

**Changes:**
- `border-border` → `border-input` (more sophisticated)
- `rounded-xl` → `rounded-2xl` (modern standard)
- Add `shadow-sm` (elevation)

**Spacing migrations:**
- Input row: `px-4 pb-3 pt-2` → `px-3 pb-2 pt-1` (tighter, refined)
- Control row: `px-3 pb-3` → `px-3 pb-2` (consistent tightness)

