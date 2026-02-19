import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Heading,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";

export function FeedbackPreview() {
  const toast = useToast();

  const showToast = (status: "success" | "error" | "info" | "warning") => {
    toast({
      title: `${status.charAt(0).toUpperCase() + status.slice(1)} Message`,
      description: `This is a ${status} toast notification.`,
      status: status,
      duration: 3000,
      isClosable: true,
      position: "top-right",
    });
  };

  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md" mb={2}>
          Feedback Components
        </Heading>
        <Text color="gray.600">Alerts, badges, and notifications</Text>
      </Box>

      <Stack spacing={4}>
        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={3}>
            Alerts
          </Text>
          <Stack spacing={3}>
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Your action was completed successfully.
                </AlertDescription>
              </Box>
            </Alert>

            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>
                  Something went wrong. Please try again.
                </AlertDescription>
              </Box>
            </Alert>

            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action may have consequences.
                </AlertDescription>
              </Box>
            </Alert>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  Here is some helpful information.
                </AlertDescription>
              </Box>
            </Alert>
          </Stack>
        </Box>

        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={3}>
            Badges
          </Text>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} wrap="wrap">
              <Badge>Default</Badge>
              <Badge colorScheme="green">Success</Badge>
              <Badge colorScheme="red">Error</Badge>
              <Badge colorScheme="blue">Info</Badge>
              <Badge colorScheme="yellow">Warning</Badge>
            </Stack>

            <Stack direction="row" spacing={2} wrap="wrap">
              <Badge variant="solid" colorScheme="brand">
                Solid Brand
              </Badge>
              <Badge variant="outline" colorScheme="brand">
                Outline Brand
              </Badge>
              <Badge variant="subtle" colorScheme="brand">
                Subtle Brand
              </Badge>
            </Stack>

            <Stack direction="row" spacing={2} wrap="wrap">
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </Stack>
          </Stack>
        </Box>

        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={3}>
            Toast Notifications
          </Text>
          <Stack direction="row" spacing={2} wrap="wrap">
            <Button
              size="sm"
              colorScheme="green"
              onClick={() => showToast("success")}
            >
              Success Toast
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              onClick={() => showToast("error")}
            >
              Error Toast
            </Button>
            <Button
              size="sm"
              colorScheme="blue"
              onClick={() => showToast("info")}
            >
              Info Toast
            </Button>
            <Button
              size="sm"
              colorScheme="yellow"
              onClick={() => showToast("warning")}
            >
              Warning Toast
            </Button>
          </Stack>
        </Box>

        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={3}>
            Inline Status Indicators
          </Text>
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge colorScheme="green" borderRadius="full">
                ✓
              </Badge>
              <Text fontSize="sm">Active status</Text>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge colorScheme="red" borderRadius="full">
                ✕
              </Badge>
              <Text fontSize="sm">Inactive status</Text>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge colorScheme="blue" borderRadius="full">
                ⓘ
              </Badge>
              <Text fontSize="sm">Pending status</Text>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
}
