# AI Rules for Mantine App

## Component Usage

- Import components from `@mantine/core` (e.g., `import { Button, Card, TextInput } from "@mantine/core"`)
- Import hooks from `@mantine/hooks` (e.g., `import { useDisclosure, useLocalStorage } from "@mantine/hooks"`)
- Import icons from `@tabler/icons-react` (e.g., `import { IconPlus, IconTrash } from "@tabler/icons-react"`)
- Do NOT create wrapper components that duplicate Mantine components
- src/components/ is for custom, app-specific components only

## Component Library: Mantine v7

- Documentation: https://mantine.dev/
- CSS Modules for custom styles
- Theme customization via src/theme.ts (createTheme)

## Styling

- Use Mantine's style props (p, m, c, bg, fz, fw, etc.)
- Use CSS Modules (\*.module.css) for complex custom styles
- Do NOT use Tailwind CSS or inline styles
- Layout: Group (horizontal), Stack (vertical), Grid, Flex, SimpleGrid

## Forms

- Use @mantine/form (useForm) for form state management
- TextInput, NumberInput, Select, Checkbox, Switch, Radio, Textarea, PasswordInput, FileInput

## Available Components

Button, ActionIcon, TextInput, NumberInput, PasswordInput, Textarea, Select, MultiSelect, Checkbox, Switch, Radio, Slider, Card, Modal, Table, Tabs, Badge, Alert, Notification, Tooltip, Avatar, Chip, List, Accordion, Divider, Progress, Skeleton, Drawer, AppShell, Navbar, Menu, Breadcrumbs, Pagination, Stepper, Title, Text, Group, Stack, Grid, Flex, SimpleGrid, Container, Paper, Code, Kbd, Anchor, Image, Spoiler, ThemeIcon, Indicator, ColorSwatch, Highlight, Mark
