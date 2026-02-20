# Library Tab Design & Structure Reference

## Overview

The **Library Tab** is the "prompts" side of the Library section. It includes both:

- **Themes** (at `/themes` route)
- **Prompts** (at `/library` route, the main Library page)

This document maps all Library-related files to help implement consistent Market tab design.

---

## FILE STRUCTURE & HIERARCHY

### 1. ROUTES & PAGES

| File                    | Type           | Purpose                      | Route      |
| ----------------------- | -------------- | ---------------------------- | ---------- |
| `src/routes/library.ts` | Route Config   | Defines the `/library` route | `/library` |
| `src/pages/library.tsx` | Page Component | Main Library page (prompts)  | `/library` |
| `src/routes/themes.ts`  | Route Config   | Defines the `/themes` route  | `/themes`  |
| `src/pages/themes.tsx`  | Page Component | Themes page                  | `/themes`  |

**Key Detail:** Both routes are registered in `src/router.ts` under the root route.

---

### 2. SIDEBAR NAVIGATION

| File                             | Purpose                     |
| -------------------------------- | --------------------------- |
| `src/components/app-sidebar.tsx` | Main sidebar with nav items |

**Navigation Items:**

```typescript
{
  id: "library",
  title: t("nav.library"),
  to: "/themes",  // Points to themes, not /library!
  icon: BookOpen,
},
{
  id: "market",
  title: t("nav.market"),
  to: "/hub",     // Points to Hub (marketplace)
  icon: Store,
},
```

**Key Pattern:**

- The "Library" nav item points to `/themes` (entry point)
- The "Market" nav item points to `/hub` (marketplace/templates)
- LibraryList sidebar component provides sub-navigation within Library

---

### 3. COMPONENTS

| File                                          | Purpose                                | Parent                  |
| --------------------------------------------- | -------------------------------------- | ----------------------- |
| `src/components/LibraryList.tsx`              | Left sidebar navigation within Library | `src/pages/library.tsx` |
| `src/components/TemplateCard.tsx`             | Card displaying template info          | `src/pages/hub.tsx`     |
| `src/components/CreatePromptDialog.tsx`       | Dialog for creating/editing prompts    | `src/pages/library.tsx` |
| `src/components/DeleteConfirmationDialog.tsx` | Confirmation dialog                    | `src/pages/library.tsx` |

---

### 4. DATA FETCHING HOOKS

| File                        | Purpose                        | IPC Channel      | Data Model   |
| --------------------------- | ------------------------------ | ---------------- | ------------ |
| `src/hooks/usePrompts.ts`   | CRUD operations for prompts    | `ipc.prompt.*`   | `PromptItem` |
| `src/hooks/useTemplates.ts` | Fetch templates for Hub/Market | `ipc.template.*` | `Template`   |

---

## LIBRARY PAGE LAYOUT

### `src/pages/library.tsx` Structure

```
<div className="flex min-h-screen">
  ├── <aside className="w-56 shrink-0"> (LEFT SIDEBAR)
  │   └── <LibraryList />
  │
  └── <div className="flex-1 px-8 py-6"> (MAIN CONTENT)
      └── <div className="max-w-5xl">
          ├── <header> with "Library Prompts" title + CreatePromptDialog
          ├── Conditional rendering:
          │   ├── Loading state
          │   ├── Empty state
          │   └── Grid of PromptCard components (3 columns on xl)
```

### Key Features:

- **Two-pane layout**: Left sidebar nav + Main content area
- **Deep link support**: Can pre-fill create dialog via deep link context
- **CRUD operations**: Create, Update (edit in-dialog), Delete with confirmation
- **Responsive grid**: `grid-cols-1 lg:grid-cols-2 xl:grid-cols-3`

---

## LIBRARYLIST COMPONENT DETAILS

### `src/components/LibraryList.tsx`

Left sidebar navigation that appears in the Library page.

**Structure:**

```typescript
type LibrarySection = {
  id: string;
  label: string;
  to: string;
  icon: React.ComponentType;
};

// Two sections:
librarySections = [
  { id: "themes", label: "Themes", to: "/themes", icon: Palette },
  { id: "prompts", label: "Prompts", to: "/library", icon: FileText },
];
```

**Styling Patterns:**

- Active link: `bg-sidebar-accent text-sidebar-accent-foreground font-semibold`
- Hover: `hover:bg-sidebar-accent`
- Layout: `w-56 shrink-0 border-r border-border bg-card`
- Uses `<ScrollArea>` for content overflow

---

## HUB PAGE STRUCTURE (MARKET TAB)

### `src/pages/hub.tsx` Layout

```
<div className="min-h-screen px-8 py-4">
  ├── <header>
  │   ├── Back button
  │   ├── Title: "Hub" (marketplace)
  │   └── Description
  │
  ├── Category filter cards (3 columns)
  │   ├── Apps (Smartphone icon)
  │   ├── Web (Globe icon)
  │   └── SaaS (Briefcase icon)
  │
  ├── Search bar (with Search icon)
  │
  └── Template grid (1/2/3 columns responsive)
      └── TemplateCard components
```

**Key Differences from Library:**

- NO left sidebar navigation (unlike Library with LibraryList)
- Has category filtering (Apps, Web, SaaS)
- Has search functionality
- Full-width layout, not split-pane

---

## DESIGN CONSISTENCY PATTERNS

### 1. Two-Pane Layout (Like Library)

```
<div className="flex min-h-screen">
  <aside className="w-56 shrink-0 border-r border-border bg-card">
    {/* Sidebar navigation */}
  </aside>
  <div className="flex-1 px-8 py-6 overflow-y-auto">
    {/* Main content */}
  </div>
</div>
```

### 2. Content Container

```
<div className="max-w-5xl">
  <header className="mb-6">
    <h1 className="text-3xl font-bold">{title}</h1>
  </header>
  {/* Content grid/list */}
</div>
```

### 3. Card Grid

```
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### 4. Dialog for Actions (Create/Edit)

Used in LibraryList page via `CreatePromptDialog` component.

---

## COLOR & STYLING TOKENS

### Sidebar Styling

- **Background**: `bg-card`
- **Border**: `border-r border-border`
- **Active state**: `bg-sidebar-accent text-sidebar-accent-foreground`
- **Hover**: `hover:bg-sidebar-accent`
- **Text**: `text-foreground`, `text-muted-foreground`, `text-sm`

### Typography

- **Page titles**: `text-3xl font-bold`
- **Section headers**: `text-lg font-semibold`
- **Body**: `text-sm`, `text-md`

### Spacing

- **Container padding**: `px-8 py-6` or `px-8 py-4`
- **Content gaps**: `gap-4` (cards), `gap-6` (larger layouts)
- **Margins**: `mb-4`, `mb-6`, `mb-8`

---

## IPC & DATA FETCHING PATTERN

### usePrompts Hook Pattern (src/hooks/usePrompts.ts)

```typescript
export function usePrompts() {
  const queryClient = useQueryClient();

  // Query (READ)
  const listQuery = useQuery({
    queryKey: queryKeys.prompts.all,
    queryFn: async () => ipc.prompt.list(),
    meta: { showErrorToast: true },
  });

  // Mutations (CREATE, UPDATE, DELETE)
  const createMutation = useMutation({
    mutationFn: async (params) => ipc.prompt.create(params),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.prompts.all,
      }),
    meta: { showErrorToast: true },
  });

  return {
    prompts: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    createPrompt: createMutation.mutateAsync,
    updatePrompt: updateMutation.mutateAsync,
    deletePrompt: deleteMutation.mutateAsync,
  };
}
```

**Key Pattern:**

1. Use `queryKeys` factory from `src/lib/queryKeys.ts`
2. Call `ipc.*` methods from contracts
3. Invalidate parent query on mutation success
4. Use `meta: { showErrorToast: true }` for global error handling
5. Return data, loading state, and mutation functions

---

## TRANSLATION KEYS

Used throughout Library:

- `library.title` - "Library"
- `library.sections.themes` - "Themes"
- `library.sections.prompts` - "Prompts"
- `library.prompts.title` - "Prompts"
- `library.prompts.empty` - Empty state message
- `library.prompts.itemType` - "Prompt" (for deletion)
- `library.prompts.prefilled` - Deep link notification
- `nav.library` - Sidebar link
- `hub.title`, `hub.description` - Hub page

---

## SUMMARY: KEY FILES FOR MARKET TAB CONSISTENCY

To make Market tab consistent with Library design:

1. **Copy Layout Pattern from** `src/pages/library.tsx`
   - Two-pane layout with left sidebar
   - Use same spacing/padding

2. **Create Market Sidebar Component** (similar to `LibraryList.tsx`)
   - Navigation for Market sub-categories

3. **Use Same Card Grid Pattern**
   - `grid-cols-1 lg:grid-cols-2 xl:grid-cols-3`
   - Same gaps and responsive behavior

4. **Dialog & Action Pattern**
   - Use `CreateOrEditPromptDialog` as reference
   - Similar confirmation dialogs

5. **IPC & Hooks Pattern**
   - Follow `usePrompts.ts` structure
   - Use `queryKeys` factory
   - Invalidate on success

6. **Styling Classes**
   - Use same color tokens
   - Same typography scale
   - Same spacing values
