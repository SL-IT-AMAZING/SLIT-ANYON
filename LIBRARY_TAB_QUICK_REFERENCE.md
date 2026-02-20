# QUICK REFERENCE: Library Tab File Locations

## 🗂️ Core Library Files

### Routes & Pages

| File                    | Lines | Key Content                                                                   |
| ----------------------- | ----- | ----------------------------------------------------------------------------- |
| `src/routes/library.ts` | 9     | Defines `/library` route pointing to LibraryPage                              |
| `src/pages/library.tsx` | 153   | **Two-pane layout**: Left sidebar (LibraryList) + Main content (Prompts grid) |
| `src/routes/themes.ts`  | 9     | Defines `/themes` route                                                       |
| `src/pages/themes.tsx`  | 231   | Themes management page                                                        |

### Sidebar Navigation

| File                             | Lines | Key Content                                                          |
| -------------------------------- | ----- | -------------------------------------------------------------------- |
| `src/components/app-sidebar.tsx` | 159   | Main app navigation with "Library" → `/themes` and "Market" → `/hub` |
| `src/components/LibraryList.tsx` | 67    | **Left sidebar within library page** with Themes/Prompts sub-nav     |

### Components

| File                                          | Lines | Key Content                         |
| --------------------------------------------- | ----- | ----------------------------------- |
| `src/components/CreatePromptDialog.tsx`       | -     | Dialog for creating/editing prompts |
| `src/components/DeleteConfirmationDialog.tsx` | -     | Confirmation dialog wrapper         |
| `src/components/TemplateCard.tsx`             | -     | Template display card (used in Hub) |

### Data Hooks

| File                        | Lines | Key Content                                                     |
| --------------------------- | ----- | --------------------------------------------------------------- |
| `src/hooks/usePrompts.ts`   | 78    | **CRUD operations**: listQuery + create/update/delete mutations |
| `src/hooks/useTemplates.ts` | 24    | **Read-only**: useQuery for templates (used in Market/Hub)      |

---

## 🎨 Design Patterns Used

### Layout Pattern (Library)

```jsx
// TWO-PANE LAYOUT
<div className="flex min-h-screen">
  <aside className="w-56 shrink-0 border-r border-border bg-card">
    <LibraryList /> {/* Left sidebar nav */}
  </aside>
  <div className="flex-1 px-8 py-6 overflow-y-auto">
    <div className="max-w-5xl">{/* Main content */}</div>
  </div>
</div>
```

### Responsive Grid Pattern

```jsx
// CARD GRID (3 columns on xl, 2 on lg, 1 on smaller)
<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
  {items.map((item) => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

### Data Fetching Pattern

```typescript
// USE QUERY + INVALIDATE ON MUTATION
const { data, isLoading } = useQuery({
  queryKey: queryKeys.prompts.all,
  queryFn: async () => ipc.prompt.list(),
  meta: { showErrorToast: true },
});

useMutation({
  mutationFn: async (params) => ipc.prompt.create(params),
  onSuccess: () =>
    queryClient.invalidateQueries({
      queryKey: queryKeys.prompts.all,
    }),
});
```

---

## 📋 Component Hierarchy

```
AppSidebar (app-sidebar.tsx)
  └─ nav items
     └─ "Library" → /themes (entry point)
     └─ "Market" → /hub

LibraryPage (pages/library.tsx)
  ├─ LibraryList (left sidebar)
  │   ├─ Themes link → /themes
  │   └─ Prompts link → /library
  └─ Main content area
     ├─ Header with title
     ├─ CreatePromptDialog
     └─ Prompt grid
        └─ PromptCard × N
           ├─ CreateOrEditPromptDialog
           └─ DeleteConfirmationDialog

HubPage (pages/hub.tsx)  [MARKET - Current]
  ├─ Back button
  ├─ Category filters
  ├─ Search bar
  └─ Template grid
     └─ TemplateCard × N
```

---

## 🔗 IPC Channels Used

### Library (Prompts)

```typescript
ipc.prompt.list(); // GET all prompts
ipc.prompt.create(params); // CREATE new prompt
ipc.prompt.update(params); // UPDATE existing prompt
ipc.prompt.delete(id); // DELETE prompt
```

### Market (Templates)

```typescript
ipc.template.getTemplates(); // GET all templates
```

---

## 🎯 Key Styles & Classes

### Sidebar

- `w-56 shrink-0` - Fixed width
- `border-r border-border` - Right border
- `bg-card` - Card background
- `bg-sidebar-accent` - Active state
- `hover:bg-sidebar-accent` - Hover state

### Typography

- Page title: `text-3xl font-bold`
- Section header: `text-lg font-semibold`
- Body text: `text-sm`
- Muted text: `text-muted-foreground`

### Spacing

- Container: `px-8 py-6` or `px-8 py-4`
- Item gap: `gap-4` (cards) or `gap-6` (larger)
- Margins: `mb-4`, `mb-6`, `mb-8`

---

## 📌 Translation Keys

```
library.title
library.sections.themes
library.sections.prompts
library.prompts.title
library.prompts.empty
library.prompts.itemType
library.prompts.prefilled
nav.library
nav.market
hub.title
hub.description
```

---

## ✅ Checklist for Market Tab Consistency

**Layout:**

- [ ] Use same two-pane structure (left sidebar + content)
- [ ] Sidebar width: `w-56 shrink-0`
- [ ] Content padding: `px-8 py-6`

**Components:**

- [ ] Create MarketSidebar component (similar to LibraryList)
- [ ] Reuse TemplateCard component
- [ ] Follow same card grid layout

**Data:**

- [ ] Use useTemplates hook
- [ ] Follow queryKeys pattern
- [ ] Use `meta: { showErrorToast: true }`

**Styling:**

- [ ] Use same color tokens (bg-card, border-border, etc.)
- [ ] Match typography scale (text-3xl for title, etc.)
- [ ] Match spacing values (gap-4, mb-6, etc.)

**Navigation:**

- [ ] Update app-sidebar.tsx if needed
- [ ] Ensure proper route linking

---

## 🔍 Where to Look for Details

| What                   | File                             | Lines |
| ---------------------- | -------------------------------- | ----- |
| Layout structure       | `src/pages/library.tsx`          | 56-96 |
| Sidebar navigation     | `src/components/LibraryList.tsx` | 14-67 |
| Card grid pattern      | `src/pages/library.tsx`          | 82-92 |
| CRUD pattern           | `src/hooks/usePrompts.ts`        | 14-77 |
| Styling tokens         | Any component with `className=`  | -     |
| Typography             | `src/pages/library.tsx`, various | -     |
| Responsive breakpoints | Grid classes (`lg:`, `xl:`)      | -     |
