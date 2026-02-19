import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import MailIcon from "@mui/icons-material/Mail";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Alert,
  AlertTitle,
  Badge,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

export function FeedbackPreview() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Feedback Components
        </Typography>
      </Box>

      {/* Alerts */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Alerts
        </Typography>
        <Stack spacing={2}>
          <Alert severity="info" icon={<InfoIcon />}>
            <AlertTitle>Info</AlertTitle>
            This is an informational alert message.
          </Alert>
          <Alert severity="success" icon={<CheckCircleIcon />}>
            <AlertTitle>Success</AlertTitle>
            Operation completed successfully.
          </Alert>
          <Alert severity="warning" icon={<WarningIcon />}>
            <AlertTitle>Warning</AlertTitle>
            Please review before proceeding.
          </Alert>
          <Alert severity="error" icon={<ErrorIcon />}>
            <AlertTitle>Error</AlertTitle>
            An error occurred during the operation.
          </Alert>
        </Stack>
      </Box>

      {/* Chips */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Chips
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Chip label="React" />
          <Chip label="Material UI" color="primary" />
          <Chip label="Vite" color="secondary" />
          <Chip label="TypeScript" variant="outlined" />
          <Chip label="Deletable" onDelete={() => {}} />
          <Chip icon={<MailIcon />} label="With Icon" />
        </Stack>
      </Box>

      {/* Badges */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Badges
        </Typography>
        <Stack direction="row" spacing={3}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Badge badgeContent={4} color="primary">
              <MailIcon />
            </Badge>
            <Typography variant="body2">4 Messages</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Badge badgeContent={99} color="error">
              <MailIcon />
            </Badge>
            <Typography variant="body2">99+ Notifications</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Badge variant="dot" color="success">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: "#e0e0e0",
                  borderRadius: "50%",
                }}
              />
            </Badge>
            <Typography variant="body2">Online</Typography>
          </Box>
        </Stack>
      </Box>

      {/* Status Indicators */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Status Indicators
        </Typography>
        <Paper sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
          <Stack spacing={2}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#4caf50",
                }}
              />
              <Typography variant="body2">Active / Online</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#ff9800",
                }}
              />
              <Typography variant="body2">Away / Idle</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor: "#f44336",
                }}
              />
              <Typography variant="body2">Offline / Busy</Typography>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
