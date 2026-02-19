import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";

export function CardPreview() {
  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md" mb={2}>
          Cards
        </Heading>
        <Text color="gray.600">Container components with various layouts</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Card>
          <CardHeader>
            <Heading size="md">Basic Card</Heading>
          </CardHeader>
          <Divider />
          <CardBody>
            <Text>
              This is a basic card component with header and body content.
            </Text>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Card with Footer</Heading>
          </CardHeader>
          <Divider />
          <CardBody>
            <Text mb={4}>Cards can include action buttons at the bottom.</Text>
            <Stack direction="row" spacing={2}>
              <Button size="sm" colorScheme="brand">
                Action
              </Button>
              <Button size="sm" variant="outline">
                Cancel
              </Button>
            </Stack>
          </CardBody>
        </Card>

        <Card bg="blue.50">
          <CardHeader>
            <Heading size="md">Custom Colored Card</Heading>
          </CardHeader>
          <Divider />
          <CardBody>
            <Text>Cards can have custom background colors and styles.</Text>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Card with Multiple Elements</Heading>
          </CardHeader>
          <Divider />
          <CardBody>
            <Stack spacing={3}>
              <Box>
                <Text fontWeight="bold" fontSize="sm">
                  Title
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Description text
                </Text>
              </Box>
              <Divider />
              <Box>
                <Text fontWeight="bold" fontSize="sm">
                  Status
                </Text>
                <Text fontSize="sm" color="green.600">
                  Active
                </Text>
              </Box>
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </Stack>
  );
}
