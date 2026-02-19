import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";

export function InputPreview() {
  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md" mb={2}>
          Form Inputs
        </Heading>
        <Text color="gray.600">Text inputs, selects, and text areas</Text>
      </Box>

      <Stack spacing={4} maxW="md">
        <FormControl>
          <FormLabel>Basic Input</FormLabel>
          <Input placeholder="Enter text..." />
        </FormControl>

        <FormControl>
          <FormLabel>Input with Error</FormLabel>
          <Input placeholder="This has an error" isInvalid />
        </FormControl>

        <FormControl>
          <FormLabel>Disabled Input</FormLabel>
          <Input placeholder="Disabled input" isDisabled />
        </FormControl>

        <FormControl>
          <FormLabel>Input Sizes</FormLabel>
          <Stack spacing={2}>
            <Input placeholder="Small" size="sm" />
            <Input placeholder="Medium (default)" size="md" />
            <Input placeholder="Large" size="lg" />
          </Stack>
        </FormControl>

        <FormControl>
          <FormLabel>Select</FormLabel>
          <Select placeholder="Select an option">
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
            <option value="option3">Option 3</option>
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel>Textarea</FormLabel>
          <Textarea placeholder="Enter your message..." rows={4} />
        </FormControl>

        <FormControl>
          <FormLabel>Email Input</FormLabel>
          <Input type="email" placeholder="your@email.com" />
        </FormControl>

        <FormControl>
          <FormLabel>Number Input</FormLabel>
          <Input type="number" placeholder="Enter a number" />
        </FormControl>

        <FormControl>
          <FormLabel>Password Input</FormLabel>
          <Input type="password" placeholder="Enter password" />
        </FormControl>
      </Stack>
    </Stack>
  );
}
