import type { Meta, StoryObj } from "@storybook/react";
import { MarkdownContent } from "./MarkdownContent";

const meta: Meta<typeof MarkdownContent> = {
  title: "chat-v2/MarkdownContent",
  component: MarkdownContent,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 720, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PlainText: Story = {
  args: {
    content:
      "This is a simple paragraph of text. It demonstrates the basic rendering of plain markdown content without any special formatting or structure.",
  },
};

export const WithHeadings: Story = {
  args: {
    content: `# Main Heading

Some introductory text below the main heading.

## Secondary Heading

More details in this section with regular paragraph text.

### Tertiary Heading

Fine-grained content lives here.`,
  },
};

export const WithCodeBlock: Story = {
  args: {
    content: `Here is a JavaScript function:

\`\`\`javascript
function greet(name) {
  const message = \`Hello, \${name}!\`;
  console.log(message);
  return message;
}

greet("World");
\`\`\``,
  },
};

export const MultipleCodeBlocks: Story = {
  args: {
    content: `### TypeScript

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  return fetch(\`/api/users/\${id}\`).then(res => res.json());
}
\`\`\`

### Python

\`\`\`python
def fibonacci(n: int) -> list[int]:
    if n <= 0:
        return []
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i - 1] + fib[i - 2])
    return fib[:n]

print(fibonacci(10))
\`\`\`

### Bash

\`\`\`bash
#!/bin/bash
echo "Installing dependencies..."
npm install
npm run build
echo "Done!"
\`\`\``,
  },
};

export const WithInlineCode: Story = {
  args: {
    content: `Use \`useState\` for local component state and \`useEffect\` for side effects. The \`useCallback\` hook memoizes functions, while \`useMemo\` memoizes computed values.

Call \`navigator.clipboard.writeText(text)\` to copy text to the clipboard.`,
  },
};

export const WithList: Story = {
  args: {
    content: `### Unordered List

- First item with some text
- Second item with **bold emphasis**
- Third item
  - Nested item A
  - Nested item B
- Fourth item

### Ordered List

1. Initialize the project with \`npm init\`
2. Install dependencies
3. Configure the build system
4. Write the application code
5. Deploy to production`,
  },
};

export const WithTable: Story = {
  args: {
    content: `### Project Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| \`react\` | ^18.2.0 | UI framework |
| \`typescript\` | ^5.3.0 | Type safety |
| \`tailwindcss\` | ^4.0.0 | Utility CSS |
| \`vite\` | ^5.0.0 | Build tool |`,
  },
};

export const WithBlockquote: Story = {
  args: {
    content: `Here is an important note:

> The best way to predict the future is to invent it. Programs must be written for people to read, and only incidentally for machines to execute.

Keep this principle in mind when writing code.`,
  },
};

export const ComplexResponse: Story = {
  args: {
    content: `## Authentication Setup

I've implemented JWT-based authentication with the following changes:

### Features

- **Token refresh** using rotating refresh tokens
- **Session management** with \`localStorage\` persistence
- **Route guards** for protected pages
- Automatic **token expiry** handling

### Implementation

Here's the auth hook:

\`\`\`typescript
import { useState, useEffect } from 'react';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      validateToken(token).then(user => {
        setState({ user, token, isLoading: false });
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  return state;
}
\`\`\`

### API Changes

| Endpoint | Method | Description |
|----------|--------|-------------|
| \`/auth/login\` | POST | Authenticate user |
| \`/auth/refresh\` | POST | Refresh token |
| \`/auth/logout\` | POST | Invalidate session |

> **Note:** Make sure to set the \`JWT_SECRET\` environment variable before deploying.

Run the migration with:

\`\`\`bash
npm run db:migrate
\`\`\``,
  },
};

export const WithLinks: Story = {
  args: {
    content: `Check the [React documentation](https://react.dev) for component patterns.

See also:
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS docs](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

For issues, open a ticket at [GitHub Issues](https://github.com/example/repo/issues).`,
  },
};
