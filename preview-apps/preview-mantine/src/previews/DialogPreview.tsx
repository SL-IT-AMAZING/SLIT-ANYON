import { Button, Group, Modal, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";

export function DialogPreview() {
  const [opened, setOpened] = useState(false);
  const [openedSecond, setOpenedSecond] = useState(false);

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Dialogs & Modals</Title>
        <Text c="dimmed" size="sm">
          Modal dialogs for alerts and confirmations
        </Text>
      </div>

      <Group>
        <Button onClick={() => setOpened(true)}>Open Modal</Button>
        <Button onClick={() => setOpenedSecond(true)} variant="light">
          Open Large Modal
        </Button>
      </Group>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Modal Title"
        centered
      >
        <Stack gap="md">
          <Text>
            This is a modal dialog. It overlays the page content and requires
            user interaction to dismiss.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpened(false)}>Confirm</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={openedSecond}
        onClose={() => setOpenedSecond(false)}
        title="Large Modal"
        size="lg"
        centered
      >
        <Stack gap="md">
          <Title order={4}>Dialog Content</Title>
          <Text>
            This is a larger modal with more space for content. You can add
            forms, images, or any other content here.
          </Text>
          <Text>
            Modal dialogs are useful for capturing user attention and obtaining
            confirmations before performing critical actions.
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setOpenedSecond(false)}>
              Close
            </Button>
            <Button onClick={() => setOpenedSecond(false)}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
