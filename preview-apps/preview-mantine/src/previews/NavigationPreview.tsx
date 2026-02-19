import { Group, Stack, Tabs, Text, Title } from "@mantine/core";
import { IconBell, IconHome, IconSettings } from "@tabler/icons-react";

export function NavigationPreview() {
  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Navigation</Title>
        <Text c="dimmed" size="sm">
          Tab-based navigation and other navigation patterns
        </Text>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Basic Tabs
        </Text>
        <Tabs defaultValue="tab1">
          <Tabs.List>
            <Tabs.Tab value="tab1" leftSection={<IconHome size={12} />}>
              Home
            </Tabs.Tab>
            <Tabs.Tab value="tab2" leftSection={<IconSettings size={12} />}>
              Settings
            </Tabs.Tab>
            <Tabs.Tab value="tab3" leftSection={<IconBell size={12} />}>
              Notifications
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="tab1" pt="xs">
            <Stack gap="sm">
              <Title order={4}>Home Tab</Title>
              <Text>
                Welcome to the home tab. This is where the main content goes.
              </Text>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="tab2" pt="xs">
            <Stack gap="sm">
              <Title order={4}>Settings Tab</Title>
              <Text>Configure your preferences and settings here.</Text>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="tab3" pt="xs">
            <Stack gap="sm">
              <Title order={4}>Notifications Tab</Title>
              <Text>You have 3 new notifications.</Text>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Vertical Tabs
        </Text>
        <Group grow>
          <div>
            <Tabs defaultValue="vertical1" orientation="vertical">
              <Tabs.List>
                <Tabs.Tab value="vertical1">Option 1</Tabs.Tab>
                <Tabs.Tab value="vertical2">Option 2</Tabs.Tab>
                <Tabs.Tab value="vertical3">Option 3</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="vertical1" pl="lg">
                <Text>Content for Option 1</Text>
              </Tabs.Panel>

              <Tabs.Panel value="vertical2" pl="lg">
                <Text>Content for Option 2</Text>
              </Tabs.Panel>

              <Tabs.Panel value="vertical3" pl="lg">
                <Text>Content for Option 3</Text>
              </Tabs.Panel>
            </Tabs>
          </div>
        </Group>
      </div>
    </Stack>
  );
}
