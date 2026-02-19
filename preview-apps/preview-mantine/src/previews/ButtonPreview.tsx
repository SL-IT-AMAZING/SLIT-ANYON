import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconCheck, IconLoader, IconX } from "@tabler/icons-react";

export function ButtonPreview() {
  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Buttons</Title>
        <Text c="dimmed" size="sm">
          Various button variants and sizes
        </Text>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Variants
        </Text>
        <Group gap="xs">
          <Button variant="filled">Filled</Button>
          <Button variant="light">Light</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="default">Default</Button>
        </Group>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Sizes
        </Text>
        <Group gap="xs">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">Extra Large</Button>
        </Group>
      </div>

      <div>
        <Text fw={500} mb="xs">
          With Icons
        </Text>
        <Group gap="xs">
          <Button leftSection={<IconCheck size={16} />}>Success</Button>
          <Button leftSection={<IconX size={16} />} variant="light">
            Cancel
          </Button>
          <Button rightSection={<IconLoader size={16} />} variant="outline">
            Loading
          </Button>
        </Group>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Disabled & Loading
        </Text>
        <Group gap="xs">
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </Group>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Colors
        </Text>
        <Group gap="xs">
          <Button color="blue">Blue</Button>
          <Button color="red">Red</Button>
          <Button color="green">Green</Button>
          <Button color="yellow">Yellow</Button>
          <Button color="violet">Violet</Button>
        </Group>
      </div>
    </Stack>
  );
}
