# AI Rules for Chakra UI App

## Component Usage

- Import from `@chakra-ui/react` (e.g., `import { Button, Card, Input, Box } from "@chakra-ui/react"`)
- Import icons from `@chakra-ui/icons` (e.g., `import { AddIcon, DeleteIcon } from "@chakra-ui/icons"`)
- Do NOT create wrapper components that duplicate Chakra UI components
- src/components/ is for custom, app-specific components only

## Component Library: Chakra UI v2

- Documentation: https://chakra-ui.com/docs
- Style props (bg, p, m, color, fontSize, etc.) for inline styling
- Theme customization via src/theme.ts (extendTheme)

## Styling

- Use Chakra style props — Do NOT use Tailwind CSS
- Layout: Box, Flex, VStack, HStack, Grid, GridItem, SimpleGrid, Container, Center, Wrap
- Responsive: use array syntax `fontSize={["sm", "md", "lg"]}` or object `fontSize={{ base: "sm", md: "lg" }}`
- useColorModeValue for dark/light theme values

## Forms

- Use react-hook-form with zod for validation
- Chakra Input, NumberInput, Select, Checkbox, Switch, Radio, Textarea, PinInput

## Available Components

Button, IconButton, Input, NumberInput, Select, Checkbox, Switch, Radio, Slider, Card, CardHeader, CardBody, CardFooter, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, Table, Thead, Tbody, Tr, Th, Td, Tabs, TabList, Tab, TabPanels, TabPanel, Badge, Alert, AlertIcon, useToast, Tooltip, Avatar, Tag, List, ListItem, Accordion, AccordionItem, Divider, Progress, CircularProgress, Skeleton, Drawer, Heading, Text, Box, Flex, VStack, HStack, Grid, SimpleGrid, Container, Center, Wrap, Menu, MenuButton, MenuList, MenuItem, Breadcrumb, Popover, Stat, Code, Kbd, Image, Spinner

## React Version

- This scaffold uses **React 18** (NOT React 19)
- Chakra UI v2 is NOT compatible with React 19
- Keep dependencies locked to React 18.x

## Available Dependencies

- react: ^18.3.1
- react-dom: ^18.3.1
- @chakra-ui/react: ^2.12.0
- @chakra-ui/icons: ^2.2.0
- @emotion/react: ^11.14.0
- @emotion/styled: ^11.14.0
- framer-motion: ^11.18.0
- react-router-dom: ^7.2.0
- react-hook-form: ^7.54.0
- zod: ^3.24.0
- @hookform/resolvers: ^5.0.0
- clsx: ^2.1.1
- tailwind-merge: ^3.0.0
