import type { Meta } from "@storybook/react";
import { ReadTool } from "./ReadTool";
import { WriteTool } from "./WriteTool";
import { EditTool } from "./EditTool";
import { SearchReplaceTool } from "./SearchReplaceTool";
import { RenameTool } from "./RenameTool";
import { DeleteTool } from "./DeleteTool";
import { ListFilesTool } from "./ListFilesTool";

const meta: Meta = {
  title: "chat-v2/tools/FileOperations",
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 600, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};
export default meta;

export const ReadRunning = {
  render: () => <ReadTool path="src/components/Header.tsx" status="running" />,
};

export const ReadCompleted = {
  render: () => (
    <ReadTool path="src/components/Header.tsx" status="completed">
      {`export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4">
      <Logo />
      <Nav />
    </header>
  );
}`}
    </ReadTool>
  ),
};

export const ReadExpanded = {
  render: () => (
    <ReadTool
      path="src/lib/utils.ts"
      status="completed"
      node={{ properties: { path: "src/lib/utils.ts" } }}
    >
      {`import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`}
    </ReadTool>
  ),
};

export const WriteRunning = {
  render: () => (
    <WriteTool
      path="src/components/NewComponent.tsx"
      description="Create new component"
      status="running"
    />
  ),
};

export const WriteCompleted = {
  render: () => (
    <WriteTool
      path="src/components/Button.tsx"
      description="Create Button component"
      status="completed"
    >
      {`export function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
      onClick={onClick}
    >
      {children}
    </button>
  );
}`}
    </WriteTool>
  ),
};

export const WriteExpanded = {
  render: () => (
    <WriteTool
      path="src/config/defaults.ts"
      description="Add default configuration"
      status="completed"
    >
      {`export const defaults = {
  theme: "system",
  language: "en",
  fontSize: 14,
  tabSize: 2,
};`}
    </WriteTool>
  ),
};

export const EditRunning = {
  render: () => (
    <EditTool
      path="src/app.tsx"
      description="Update imports"
      status="running"
    />
  ),
};

export const EditCompleted = {
  render: () => (
    <EditTool
      path="src/app.tsx"
      description="Add useEffect import"
      status="completed"
    >
      {`- import { useState } from "react";
+ import { useState, useEffect } from "react";`}
    </EditTool>
  ),
};

export const EditExpanded = {
  render: () => (
    <EditTool
      path="src/hooks/useAuth.ts"
      description="Fix token refresh logic"
      status="completed"
    >
      {`- const token = localStorage.getItem("token");
+ const token = await refreshToken();
+ localStorage.setItem("token", token);`}
    </EditTool>
  ),
};

export const SearchReplaceRunning = {
  render: () => (
    <SearchReplaceTool
      path="src/utils/format.ts"
      description="Refactor date formatting"
      status="running"
    />
  ),
};

export const SearchReplaceCompleted = {
  render: () => (
    <SearchReplaceTool
      path="src/utils/format.ts"
      description="Update date formatting to use Intl"
      status="completed"
    >
      {`<<<<<<< SEARCH
function formatDate(date: Date): string {
  return date.toLocaleDateString();
}
=======
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
>>>>>>> REPLACE`}
    </SearchReplaceTool>
  ),
};

export const SearchReplaceMultiBlock = {
  render: () => (
    <SearchReplaceTool
      path="src/components/App.tsx"
      description="Refactor component structure"
      status="completed"
    >
      {`<<<<<<< SEARCH
import { useState } from "react";
=======
import { useState, useCallback } from "react";
>>>>>>> REPLACE

<<<<<<< SEARCH
const handleClick = () => {
  setCount(count + 1);
};
=======
const handleClick = useCallback(() => {
  setCount((prev) => prev + 1);
}, []);
>>>>>>> REPLACE`}
    </SearchReplaceTool>
  ),
};

export const SearchReplaceFallback = {
  render: () => (
    <SearchReplaceTool
      path="src/index.ts"
      description="Raw content without markers"
      status="completed"
    >
      {"Some raw content without search/replace markers"}
    </SearchReplaceTool>
  ),
};

export const RenameRunning = {
  render: () => (
    <RenameTool
      from="src/components/OldName.tsx"
      to="src/components/NewName.tsx"
      status="running"
    />
  ),
};

export const RenameCompleted = {
  render: () => (
    <RenameTool
      from="src/utils/helpers.ts"
      to="src/utils/string-helpers.ts"
      status="completed"
    />
  ),
};

export const DeleteRunning = {
  render: () => (
    <DeleteTool path="src/components/Deprecated.tsx" status="running" />
  ),
};

export const DeleteCompleted = {
  render: () => (
    <DeleteTool path="src/old/legacy-utils.ts" status="completed" />
  ),
};

export const ListFilesRunning = {
  render: () => <ListFilesTool directory="src/components" status="running" />,
};

export const ListFilesCompleted = {
  render: () => (
    <ListFilesTool directory="src/components" status="completed">
      {`Header.tsx
Footer.tsx
Sidebar.tsx
Button.tsx
Modal.tsx
Tooltip.tsx`}
    </ListFilesTool>
  ),
};

export const ListFilesRecursive = {
  render: () => (
    <ListFilesTool directory="src/" recursive="true" status="completed">
      {`src/app.tsx
src/index.ts
src/components/Header.tsx
src/components/Footer.tsx
src/components/ui/Button.tsx
src/components/ui/Modal.tsx
src/hooks/useAuth.ts
src/hooks/useTheme.ts
src/lib/utils.ts`}
    </ListFilesTool>
  ),
};

export const AllToolsShowcase = {
  render: () => (
    <div className="flex flex-col gap-2">
      <ReadTool path="src/index.ts" status="running" />
      <ReadTool path="src/utils.ts" status="completed">
        {"export const version = '1.0.0';"}
      </ReadTool>
      <WriteTool
        path="src/new-file.ts"
        description="Create new file"
        status="completed"
      >
        {"export const config = {};"}
      </WriteTool>
      <EditTool
        path="src/app.tsx"
        description="Update imports"
        status="completed"
      >
        {"- old line\n+ new line"}
      </EditTool>
      <SearchReplaceTool
        path="src/format.ts"
        description="Refactor"
        status="completed"
      >
        {`<<<<<<< SEARCH
const x = 1;
=======
const x = 2;
>>>>>>> REPLACE`}
      </SearchReplaceTool>
      <RenameTool from="src/old.ts" to="src/new.ts" status="completed" />
      <DeleteTool path="src/deprecated.ts" status="completed" />
      <ListFilesTool directory="src/" status="completed">
        {"app.tsx\nindex.ts\nutils.ts"}
      </ListFilesTool>
    </div>
  ),
};
