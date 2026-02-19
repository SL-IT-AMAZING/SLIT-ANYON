import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";

const categories = [
  {
    title: "Buttons",
    description: "Click actions and form submissions",
    preview: (
      <Stack direction="row" spacing={2}>
        <Button size="sm" colorScheme="brand">
          Primary
        </Button>
        <Button size="sm" variant="outline">
          Secondary
        </Button>
        <Button size="sm" variant="ghost">
          Ghost
        </Button>
      </Stack>
    ),
  },
  {
    title: "Inputs",
    description: "Text fields, selects, and form controls",
    preview: <Input placeholder="Type something..." size="sm" />,
  },
  {
    title: "Cards",
    description: "Container components for grouped content",
    preview: (
      <Box p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
        <Text fontWeight="medium" fontSize="sm">
          Card Preview
        </Text>
        <Text fontSize="xs" color="gray.600">
          Composable containers
        </Text>
      </Box>
    ),
  },
  {
    title: "Dialogs",
    description: "Modal windows and overlay content",
    preview: (
      <Stack direction="row" spacing={2} align="center">
        <Button size="sm" variant="outline">
          Open Modal
        </Button>
        <Text fontSize="xs" color="gray.600">
          Click to preview
        </Text>
      </Stack>
    ),
  },
  {
    title: "Tables",
    description: "Structured data display with rows and columns",
    preview: (
      <Box borderWidth="1px" borderRadius="md" fontSize="xs">
        <Box
          p={2}
          bg="gray.100"
          fontWeight="bold"
          display="grid"
          gridTemplateColumns="1fr 1fr 1fr"
          gap={2}
        >
          <span>Name</span>
          <span>Status</span>
          <span>Role</span>
        </Box>
        <Box p={2} display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
          <span>Alice</span>
          <Badge colorScheme="green" fontSize="xs">
            Active
          </Badge>
          <span>Admin</span>
        </Box>
      </Box>
    ),
  },
  {
    title: "Navigation",
    description: "Tabs, menus, and page navigation",
    preview: (
      <Box
        display="inline-flex"
        h="8"
        alignItems="center"
        borderRadius="md"
        bg="gray.100"
        p={1}
        fontSize="xs"
      >
        <Box
          px={2}
          py={1}
          borderRadius="sm"
          bg="white"
          fontWeight="medium"
          boxShadow="sm"
        >
          Tab 1
        </Box>
        <Box px={2} py={1} color="gray.600">
          Tab 2
        </Box>
        <Box px={2} py={1} color="gray.600">
          Tab 3
        </Box>
      </Box>
    ),
  },
  {
    title: "Feedback",
    description: "Alerts, badges, and status indicators",
    preview: (
      <Stack direction="row" spacing={2}>
        <Badge colorScheme="gray">Default</Badge>
        <Badge colorScheme="blue">Info</Badge>
        <Badge colorScheme="red">Error</Badge>
        <Badge variant="outline">Outline</Badge>
      </Stack>
    ),
  },
  {
    title: "Layout",
    description: "Separators, scroll areas, and spacing",
    preview: (
      <Stack spacing={2}>
        <Text fontSize="xs">Section A</Text>
        <Divider />
        <Text fontSize="xs">Section B</Text>
      </Stack>
    ),
  },
];

export function OverviewPreview() {
  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="lg" mb={1}>
          Chakra UI Components
        </Heading>
        <Text color="gray.600">
          A collection of beautifully crafted, accessible components built on
          Chakra UI.
        </Text>
      </Box>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
        {categories.map((cat) => (
          <Card key={cat.title}>
            <CardHeader pb={3}>
              <Heading size="sm">{cat.title}</Heading>
              <Text fontSize="xs" color="gray.600">
                {cat.description}
              </Text>
            </CardHeader>
            <Divider />
            <CardBody>{cat.preview}</CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
