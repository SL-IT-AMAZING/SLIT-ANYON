import { MadeWithAnyon } from "@/components/made-with-anyon";
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconPlus } from "@tabler/icons-react";
import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [items, setItems] = useState<string[]>([]);

  const addItem = () => {
    if (inputValue.trim()) {
      setItems([...items, inputValue]);
      setInputValue("");
    }
  };

  return (
    <Container py="xl" size="md">
      <Stack gap="lg">
        <div>
          <Title order={1} mb="xs">
            Welcome to Mantine + Vite
          </Title>
          <Text c="dimmed">
            This scaffold provides a modern React development setup with Mantine
            v7 component library.
          </Text>
        </div>

        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Getting Started"
          color="blue"
        >
          Edit <code>src/App.tsx</code> and save to see live updates
        </Alert>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <div>
                  <Title order={3}>Counter Demo</Title>
                  <Text c="dimmed" size="sm">
                    Click to increment
                  </Text>
                </div>

                <Paper p="md" radius="md" bg="var(--mantine-color-gray-0)">
                  <Title order={1} ta="center">
                    {count}
                  </Title>
                </Paper>

                <Group justify="center">
                  <Button onClick={() => setCount(count + 1)} color="blue">
                    Increment
                  </Button>
                  <Button
                    onClick={() => setCount(0)}
                    variant="subtle"
                    color="gray"
                  >
                    Reset
                  </Button>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <div>
                  <Title order={3}>Add Items</Title>
                  <Text c="dimmed" size="sm">
                    Try adding some items
                  </Text>
                </div>

                <Group>
                  <TextInput
                    placeholder="Enter item"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.currentTarget.value)}
                    onKeyDown={(e) => e.key === "Enter" && addItem()}
                    style={{ flex: 1 }}
                  />
                  <Button
                    onClick={addItem}
                    leftSection={<IconPlus size={16} />}
                  >
                    Add
                  </Button>
                </Group>

                <Stack gap="xs">
                  {items.length === 0 ? (
                    <Text c="dimmed" size="sm">
                      No items yet
                    </Text>
                  ) : (
                    items.map((item, idx) => (
                      <Group key={idx} justify="space-between">
                        <Text>{item}</Text>
                        <Badge
                          leftSection={<IconCheck size={12} />}
                          variant="light"
                        >
                          Item {idx + 1}
                        </Badge>
                      </Group>
                    ))
                  )}
                </Stack>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          bg="var(--mantine-color-blue-0)"
        >
          <Stack gap="md">
            <div>
              <Title order={3}>Mantine Features</Title>
            </div>
            <Group>
              <Badge color="blue">Components</Badge>
              <Badge color="cyan">Hooks</Badge>
              <Badge color="teal">Responsive</Badge>
              <Badge color="grape">TypeScript</Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Explore all available Mantine components at{" "}
              <a
                href="https://mantine.dev/"
                target="_blank"
                rel="noopener noreferrer"
              >
                mantine.dev
              </a>
            </Text>
          </Stack>
        </Card>

        <MadeWithAnyon />
      </Stack>
    </Container>
  );
}
