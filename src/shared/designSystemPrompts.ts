const DESIGN_SYSTEM_PROMPTS: Record<string, string> = {
  shadcn: `<design-system>
You are building with shadcn/ui components (Radix UI primitives + Tailwind CSS).
- Import components from \`@/components/ui/button\`, \`@/components/ui/card\`, etc.
- Use Tailwind CSS utility classes for styling.
- Use \`cn()\` from \`@/lib/utils\` for conditional class merging.
- Use \`cva\` for creating component variants.
- NEVER install new shadcn components. Only use what's already in \`src/components/ui/\`.
- Icons: use \`lucide-react\`.
- Forms: use \`react-hook-form\` + \`zod\` for validation.
- Theming: CSS variables in \`globals.css\`, dark mode via \`.dark\` class.
</design-system>`,

  mui: `<design-system>
You are building with Material UI (MUI) v6 components.
- Import components from \`@mui/material\` (e.g., \`import { Button, Card, TextField } from '@mui/material'\`).
- Import icons from \`@mui/icons-material\`.
- Do NOT create component files in \`src/components/ui/\` that duplicate MUI components.
- \`src/components/\` is for custom/app-specific components only.
- Use the \`sx\` prop for styling. Theme customization via \`createTheme()\` in \`src/theme.ts\`.
- Do NOT use Tailwind CSS. Use MUI layout components: \`Box\`, \`Stack\`, \`Grid\`, \`Container\`.
- Follow Material Design 3 guidelines for spacing, elevation, and typography.
- Use \`ThemeProvider\` for theming. Dark mode via \`palette.mode\`.
</design-system>`,

  antd: `<design-system>
You are building with Ant Design v5 components.
- Import components from \`antd\` (e.g., \`import { Button, Card, Table, Form } from 'antd'\`).
- Import icons from \`@ant-design/icons\`.
- Do NOT create component files in \`src/components/ui/\` that duplicate Ant Design components.
- \`src/components/\` is for custom/app-specific components only.
- Use CSS-in-JS with design tokens via \`ConfigProvider\`.
- Use the \`Form\` component for all forms (built-in validation).
- Use \`Table\` component for data display with columns configuration.
- Layout: \`Layout\`, \`Layout.Sider\`, \`Layout.Content\`, \`Layout.Header\`.
- Use \`Space\`, \`Flex\`, \`Row\`, \`Col\` for spacing and grid layout.
</design-system>`,

  mantine: `<design-system>
You are building with Mantine v7 components.
- Import components from \`@mantine/core\` (e.g., \`import { Button, Card, TextInput } from '@mantine/core'\`).
- Import hooks from \`@mantine/hooks\` (e.g., \`useDisclosure\`, \`useLocalStorage\`).
- Do NOT create component files in \`src/components/ui/\` that duplicate Mantine components.
- \`src/components/\` is for custom/app-specific components only.
- Use CSS Modules for custom styles, not inline styles.
- Prefer Mantine hooks: \`useDisclosure\`, \`useForm\`, \`useLocalStorage\`, \`useMediaQuery\`.
- Layout: \`AppShell\`, \`Stack\`, \`Group\`, \`Grid\`, \`Flex\`.
- Responsive props: \`cols={{ base: 1, sm: 2, lg: 3 }}\`.
- Theming via \`MantineProvider\` and \`createTheme()\` in \`src/theme.ts\`.
</design-system>`,

  chakra: `<design-system>
You are building with Chakra UI v3 components.
- Import components from \`@chakra-ui/react\` (e.g., \`import { Button, Card, Input } from '@chakra-ui/react'\`).
- Do NOT create component files in \`src/components/ui/\` that duplicate Chakra components.
- \`src/components/\` is for custom/app-specific components only.
- Use style props for styling: \`<Box p={4} bg="blue.500" borderRadius="md">\`.
- Responsive values: \`fontSize={{ base: "sm", md: "lg" }}\`.
- Compound components: \`Card.Root\`, \`Card.Header\`, \`Card.Body\`, \`Card.Footer\`.
- Layout: \`Box\`, \`Flex\`, \`Stack\`, \`HStack\`, \`VStack\`, \`Grid\`, \`SimpleGrid\`.
- Theming via \`ChakraProvider\` and \`extendTheme()\` in \`src/theme.ts\`.
</design-system>`,

  daisyui: `<design-system>
You are building with DaisyUI (Tailwind CSS plugin).
- Import React wrapper components from \`@/components/ui/button\`, \`@/components/ui/card\`, etc.
- DaisyUI CSS classes: \`btn btn-primary\`, \`card bg-base-100\`, \`input input-bordered\`.
- Theme selection via \`data-theme\` attribute on the root element. 30+ built-in themes available.
- Components in \`src/components/ui/\` are React wrappers around DaisyUI CSS classes.
- Add React interactivity yourself (onClick, useState, etc.) — DaisyUI is CSS-only.
- Use Tailwind utility classes alongside DaisyUI component classes.
- Icons: use \`lucide-react\`.
- Layout: use Tailwind's \`flex\`, \`grid\`, \`gap\`, \`p-*\` utilities.
</design-system>`,
};

export function getDesignSystemPrompt(designSystemId: string): string {
  return DESIGN_SYSTEM_PROMPTS[designSystemId] ?? "";
}
