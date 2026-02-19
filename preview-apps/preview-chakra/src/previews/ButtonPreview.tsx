import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";

export function ButtonPreview() {
  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md" mb={2}>
          Button Variants
        </Heading>
        <Text color="gray.600">
          Solid, outline, ghost, and link button styles
        </Text>
      </Box>

      <Stack spacing={4}>
        <Stack spacing={2}>
          <Text fontWeight="medium" fontSize="sm">
            Solid (Default)
          </Text>
          <Stack direction="row" spacing={2} wrap="wrap">
            <Button colorScheme="brand">Primary</Button>
            <Button colorScheme="green">Success</Button>
            <Button colorScheme="red">Danger</Button>
            <Button colorScheme="gray">Disabled</Button>
          </Stack>
        </Stack>

        <Stack spacing={2}>
          <Text fontWeight="medium" fontSize="sm">
            Outline
          </Text>
          <Stack direction="row" spacing={2} wrap="wrap">
            <Button variant="outline" colorScheme="brand">
              Primary
            </Button>
            <Button variant="outline" colorScheme="green">
              Success
            </Button>
            <Button variant="outline" colorScheme="red">
              Danger
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={2}>
          <Text fontWeight="medium" fontSize="sm">
            Ghost
          </Text>
          <Stack direction="row" spacing={2} wrap="wrap">
            <Button variant="ghost" colorScheme="brand">
              Primary
            </Button>
            <Button variant="ghost" colorScheme="green">
              Success
            </Button>
            <Button variant="ghost" colorScheme="red">
              Danger
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={2}>
          <Text fontWeight="medium" fontSize="sm">
            Sizes
          </Text>
          <Stack direction="row" spacing={2} wrap="wrap" align="center">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Stack>
        </Stack>

        <Stack spacing={2}>
          <Text fontWeight="medium" fontSize="sm">
            States
          </Text>
          <Stack direction="row" spacing={2} wrap="wrap">
            <Button>Enabled</Button>
            <Button isDisabled>Disabled</Button>
            <Button isLoading>Loading</Button>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
}
