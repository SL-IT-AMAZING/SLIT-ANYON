import { Badge, Group, Text } from "@mantine/core";

export function MadeWithAnyon() {
  return (
    <Group justify="center">
      <Text size="sm" c="dimmed">
        Made with
      </Text>
      <Badge variant="light" color="blue">
        Anyon
      </Badge>
    </Group>
  );
}
