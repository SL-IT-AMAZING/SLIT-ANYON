# Library vs Market Tab: Design Pattern Comparison

## File Inventory

### LIBRARY TAB

```
src/routes/library.ts           → Route definition for /library
src/pages/library.tsx           → Main Library page (Prompts view)
src/routes/themes.ts            → Route definition for /themes
src/pages/themes.tsx            → Themes view page

src/components/LibraryList.tsx  → Left sidebar nav within Library
src/components/CreatePromptDialog.tsx
src/components/DeleteConfirmationDialog.tsx

src/hooks/usePrompts.ts         → CRUD for prompts
src/hooks/useTemplates.ts       → Fetch templates

src/router.ts                   → Routes registered here
src/components/app-sidebar.tsx  → Main nav bar with "Library" & "Market" links
```

### MARKET TAB (HUB)

```
src/routes/hub.ts               → Route definition for /hub
src/pages/hub.tsx               → Hub/Marketplace page

src/components/TemplateCard.tsx → Individual template card

src/hooks/useTemplates.ts       → Fetch templates

src/router.ts                   → Routes registered here
src/components/app-sidebar.tsx  → Main nav bar points Market to /hub
```

---

## Layout Comparison

### LIBRARY PAGE (`src/pages/library.tsx`)

```
┌─────────────────────────────────┐
│ Left Sidebar  │ Main Content    │
│ (w-56)        │ (flex-1)        │
├───────────────┤─────────────────┤
│ LibraryList   │ Header (Prompts)│
│ - Themes      │ + Create Dialog │
│ - Prompts     │                 │
│               │ Prompt Grid     │
│               │ [Card][Card]... │
│               │ [Card][Card]... │
└───────────────┴─────────────────┘
```

**CSS**: `flex min-h-screen`

- Left: `w-56 shrink-0 border-r border-border bg-card`
- Right: `flex-1 px-8 py-6 overflow-y-auto`

### MARKET PAGE (`src/pages/hub.tsx`)

```
┌──────────────────────────────────┐
│ Full Width Content               │
├──────────────────────────────────┤
│ Header (Back button, Title)      │
│ [Category Cards: Apps/Web/SaaS]  │
│ [Search Bar]                     │
│ Template Grid (3 columns)        │
│ [Card][Card][Card]               │
│ [Card][Card][Card]               │
└──────────────────────────────────┘
```

**CSS**: `min-h-screen px-8 py-4`

- Full width, no sidebar
- Max content width: `max-w-6xl mx-auto`

---

## Component Structure

### LIBRARY: LibraryList Sidebar

```typescript
// src/components/LibraryList.tsx
<div className="flex flex-col h-full">
  <div className="flex-shrink-0 p-4">
    <h2>{t("library.title")}</h2>
  </div>
  <ScrollArea>
    <div className="space-y-1 p-4 pt-0">
      {librarySections.map(section => (
        <Link
          to={section.to}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-md",
            isActive ? "bg-sidebar-accent..." : "hover:bg-sidebar-accent"
          )}
        >
          <section.icon /> {section.label}
        </Link>
      ))}
    </div>
  </ScrollArea>
</div>
```

### MARKET: No Sidebar (Yet)

Currently uses full-width layout. To make consistent with Library, would add a sidebar component similar to LibraryList.

---

## Card Grid Pattern

### LIBRARY: PromptCard Grid

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
  {prompts.map((p) => (
    <PromptCard key={p.id} prompt={p} onUpdate={...} onDelete={...} />
  ))}
</div>
```

**Card Styling:**

```tsx
<div className="border rounded-lg p-4 bg-(--background-lightest) min-w-80">
  <div className="space-y-2">
    <h3 className="text-lg font-semibold">{prompt.title}</h3>
    <p className="text-sm text-muted-foreground">{prompt.description}</p>
    <div className="flex gap-2">{/* Edit & Delete buttons */}</div>
    <pre className="text-sm whitespace-pre-wrap...">{prompt.content}</pre>
  </div>
</div>
```

### MARKET: TemplateCard Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredTemplates.map((template) => (
    <TemplateCard key={template.id} template={template} />
  ))}
</div>
```

**Difference:** Larger gap (`gap-6` vs `gap-4`)

---

## Data Fetching Patterns

### LIBRARY: usePrompts Hook

```typescript
export function usePrompts() {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: queryKeys.prompts.all,
    queryFn: async () => ipc.prompt.list(),
    meta: { showErrorToast: true },
  });

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

### MARKET: useTemplates Hook

```typescript
export function useTemplates() {
  const query = useQuery({
    queryKey: queryKeys.templates.all,
    queryFn: async () => ipc.template.getTemplates(),
    placeholderData: localTemplatesData,
    meta: { showErrorToast: true },
  });

  return {
    templates: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
```

**Pattern Difference:**

- Library: Full CRUD (Create, Read, Update, Delete)
- Market: Read-only with placeholder data

---

## Styling Consistency

### Typography

| Element     | Library                         | Market               |
| ----------- | ------------------------------- | -------------------- |
| Page Title  | `text-3xl font-bold`            | `text-3xl font-bold` |
| Card Title  | `text-lg font-semibold`         | (TemplateCard)       |
| Description | `text-sm text-muted-foreground` | Same                 |

### Colors

| Purpose        | Class                                              |
| -------------- | -------------------------------------------------- |
| Background     | `bg-card`                                          |
| Border         | `border-border`                                    |
| Text           | `text-foreground`                                  |
| Muted Text     | `text-muted-foreground`                            |
| Sidebar Active | `bg-sidebar-accent text-sidebar-accent-foreground` |

### Spacing

| Context                | Value                                        |
| ---------------------- | -------------------------------------------- |
| Container padding      | `px-8 py-6` (Library) / `px-8 py-4` (Market) |
| Card gap (small)       | `gap-4`                                      |
| Card gap (large)       | `gap-6`                                      |
| Space between sections | `mb-6`                                       |

---

## KEY INSIGHTS FOR MARKET TAB REDESIGN

### ✅ What to Copy from Library

1. **Two-pane layout structure** with fixed left sidebar
2. **Sidebar component pattern** (LibraryList.tsx)
3. **Card grid layout** with responsive columns
4. **Spacing and padding conventions**
5. **Color and typography tokens**
6. **useQuery/useMutation pattern** for data fetching

### ⚠️ Differences to Preserve

1. Market doesn't need CRUD (no create/edit/delete)
2. Hub has category filtering (not in Library)
3. Hub has search (Library doesn't)
4. Market templates are read-only

### 🎯 Recommended Approach

1. Copy `src/pages/library.tsx` layout structure
2. Create `src/components/MarketSidebar.tsx` (or similar)
3. Add category filter logic from `src/pages/hub.tsx`
4. Merge search and filter from Hub into new layout
5. Use same card grid pattern (adjust gap if needed)
6. Keep useTemplates hook as-is
7. Follow same spacing/color tokens

---

## Files You'll Need to Reference

**Must Read First:**

- [ ] `src/pages/library.tsx` - Layout template
- [ ] `src/components/LibraryList.tsx` - Sidebar component pattern
- [ ] `src/pages/hub.tsx` - Current market view

**Data & Routing:**

- [ ] `src/hooks/useTemplates.ts` - Data fetching
- [ ] `src/router.ts` - Route registration
- [ ] `src/routes/hub.ts` - Current hub route

**Components:**

- [ ] `src/components/TemplateCard.tsx` - Card styling
- [ ] `src/components/app-sidebar.tsx` - Navigation config
