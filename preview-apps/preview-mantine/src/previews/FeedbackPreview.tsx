import { Alert, Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconCheck,
  IconInfoCircle,
} from "@tabler/icons-react";

export function FeedbackPreview() {
  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Feedback Components</Title>
        <Text c="dimmed" size="sm">
          Alerts, badges, and notifications for user feedback
        </Text>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Alerts
        </Text>
        <Stack gap="sm">
          <Alert icon={<IconCheck size={16} />} title="Success" color="green">
            Your action was completed successfully.
          </Alert>

          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            Something went wrong. Please try again.
          </Alert>

          <Alert
            icon={<IconAlertTriangle size={16} />}
            title="Warning"
            color="yellow"
          >
            Please be careful with this action.
          </Alert>

          <Alert
            icon={<IconInfoCircle size={16} />}
            title="Information"
            color="blue"
          >
            Here is some useful information for you.
          </Alert>
        </Stack>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Badges
        </Text>
        <Group>
          <Badge variant="filled">Default</Badge>
          <Badge variant="light">Light</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="dot">Dot</Badge>
          <Badge color="red">Error</Badge>
          <Badge color="green">Success</Badge>
          <Badge color="yellow">Warning</Badge>
        </Group>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Notifications
        </Text>
        <Group>
          <Button
            size="sm"
            onClick={() =>
              notifications.show({
                title: "Success",
                message: "Notification sent successfully!",
                color: "green",
              })
            }
          >
            Show Success
          </Button>
          <Button
            size="sm"
            onClick={() =>
              notifications.show({
                title: "Error",
                message: "Something went wrong!",
                color: "red",
              })
            }
          >
            Show Error
          </Button>
          <Button
            size="sm"
            onClick={() =>
              notifications.show({
                title: "Info",
                message: "Here is some information.",
                color: "blue",
              })
            }
          >
            Show Info
          </Button>
        </Group>
      </div>
    </Stack>
  );
}
