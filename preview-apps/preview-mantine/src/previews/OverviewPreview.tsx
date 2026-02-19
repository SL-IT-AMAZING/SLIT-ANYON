import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import {
  IconBrandReact,
  IconComponents,
  IconPalette,
} from "@tabler/icons-react";

export function OverviewPreview() {
  return (
    <Stack gap="lg">
      <div>
        <Title order={1} mb="xs">
          Mantine v7 Component Preview
        </Title>
        <Text c="dimmed">
          Explore a collection of Mantine components showcasing UI patterns and
          best practices.
        </Text>
      </div>

      <Group>
        <Badge leftSection={<IconBrandReact size={12} />} variant="filled">
          React 19
        </Badge>
        <Badge leftSection={<IconPalette size={12} />} variant="light">
          Mantine 7
        </Badge>
        <Badge leftSection={<IconComponents size={12} />} variant="dot">
          Component Gallery
        </Badge>
      </Group>

      <Group gap="sm">
        <Button variant="filled">Primary Action</Button>
        <Button variant="light">Secondary Action</Button>
        <Button variant="outline">Tertiary Action</Button>
      </Group>

      <Text>
        Select a component from the navigation above to explore different UI
        elements and their variations.
      </Text>
    </Stack>
  );
}
