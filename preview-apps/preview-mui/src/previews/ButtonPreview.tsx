import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";
import { Box, Button, Stack, Typography } from "@mui/material";

export function ButtonPreview() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Buttons
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Variants
        </Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 2 }}>
          <Button variant="contained">Contained</Button>
          <Button variant="outlined">Outlined</Button>
          <Button variant="text">Text</Button>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Colors
        </Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 2 }}>
          <Button variant="contained" color="primary">
            Primary
          </Button>
          <Button variant="contained" color="secondary">
            Secondary
          </Button>
          <Button variant="contained" color="success">
            Success
          </Button>
          <Button variant="contained" color="error">
            Error
          </Button>
          <Button variant="contained" color="warning">
            Warning
          </Button>
          <Button variant="contained" color="info">
            Info
          </Button>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Sizes
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", flexWrap: "wrap", gap: 2 }}
        >
          <Button variant="contained" size="small">
            Small
          </Button>
          <Button variant="contained" size="medium">
            Medium
          </Button>
          <Button variant="contained" size="large">
            Large
          </Button>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          With Icons
        </Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 2 }}>
          <Button variant="contained" startIcon={<SendIcon />}>
            Send
          </Button>
          <Button variant="contained" color="error" endIcon={<DeleteIcon />}>
            Delete
          </Button>
          <Button variant="outlined" startIcon={<CheckCircleIcon />}>
            Verify
          </Button>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          States
        </Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 2 }}>
          <Button variant="contained">Normal</Button>
          <Button variant="contained" disabled>
            Disabled
          </Button>
          <Button variant="contained" sx={{ width: 120 }}>
            Loading...
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
