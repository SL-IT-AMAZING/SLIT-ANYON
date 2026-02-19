import {
  Badge,
  Button,
  Card,
  Grid,
  Group,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconHeart, IconShare2 } from "@tabler/icons-react";

export function CardPreview() {
  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Cards</Title>
        <Text c="dimmed" size="sm">
          Card layouts and variations
        </Text>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Basic Card
        </Text>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Card.Section inheritPadding py="md">
            <Title order={3}>Card Title</Title>
            <Text size="sm" c="dimmed">
              This is a basic card with some content inside.
            </Text>
          </Card.Section>

          <Group justify="space-between" mt="md" mb="xs">
            <Text fw={500}>$9.99</Text>
            <Group gap={0}>
              <Badge>Sale</Badge>
            </Group>
          </Group>

          <Button fullWidth mt="md" radius="md">
            Add to Cart
          </Button>
        </Card>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Card Grid
        </Text>
        <Grid>
          {[1, 2, 3].map((i) => (
            <Grid.Col key={i} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Card.Section inheritPadding py="sm">
                  <Title order={4}>Card {i}</Title>
                </Card.Section>
                <Card.Section inheritPadding>
                  <Text size="sm" c="dimmed">
                    Card content goes here
                  </Text>
                </Card.Section>
                <Group justify="space-between" mt="sm">
                  <Button size="sm" variant="light">
                    Action
                  </Button>
                  <Group gap={4}>
                    <IconHeart size={16} />
                    <IconShare2 size={16} />
                  </Group>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </div>
    </Stack>
  );
}
