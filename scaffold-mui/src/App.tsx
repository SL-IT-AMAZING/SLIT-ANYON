import { MadeWithAnyon } from "@/components/made-with-anyon";
import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid2 as Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function App() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Material UI
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This is a Vite + React + MUI scaffold. Start building your app using
          Material UI components directly.
        </Typography>

        <Stack spacing={3} sx={{ my: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Example Card
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This demonstrates MUI components in action. You can import
                directly from @mui/material and use them throughout your app.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" startIcon={<Edit />}>
                Edit
              </Button>
              <Button size="small" color="error" startIcon={<Delete />}>
                Delete
              </Button>
            </CardActions>
          </Card>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Form Input
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter some text"
              variant="outlined"
              size="small"
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Chips & Tags
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label="React" color="primary" variant="outlined" />
              <Chip label="Vite" variant="outlined" />
              <Chip label="Material UI" color="secondary" variant="outlined" />
            </Stack>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Add />}
                size="large"
              >
                Create
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button fullWidth variant="outlined" size="large">
                Cancel
              </Button>
            </Grid>
          </Grid>

          <Typography variant="caption" color="text.secondary" align="center">
            Edit src/App.tsx and save to see changes
          </Typography>
        </Stack>
      </Box>

      <MadeWithAnyon />
    </Container>
  );
}

export default App;
