import HomeIcon from "@mui/icons-material/Home";
import InfoIcon from "@mui/icons-material/Info";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  AppBar,
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Toolbar,
  Typography,
} from "@mui/material";
import { useState } from "react";

export function NavigationPreview() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Navigation
        </Typography>
      </Box>

      {/* App Bar */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          App Bar
        </Typography>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              MyApp
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button color="inherit" size="small">
                Home
              </Button>
              <Button color="inherit" size="small">
                About
              </Button>
              <Button color="inherit" size="small">
                Contact
              </Button>
            </Stack>
          </Toolbar>
        </AppBar>
      </Box>

      {/* Tabs */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Tabs
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="basic tabs"
          >
            <Tab label="Home" icon={<HomeIcon />} iconPosition="start" />
            <Tab
              label="Settings"
              icon={<SettingsIcon />}
              iconPosition="start"
            />
            <Tab label="About" icon={<InfoIcon />} iconPosition="start" />
          </Tabs>
        </Box>
        <Box
          sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: "0 0 4px 4px" }}
        >
          {tabValue === 0 && (
            <Typography variant="body2">
              Welcome to the Home tab. This is the main content area.
            </Typography>
          )}
          {tabValue === 1 && (
            <Typography variant="body2">
              Configure your settings here.
            </Typography>
          )}
          {tabValue === 2 && (
            <Typography variant="body2">
              Learn more about this application.
            </Typography>
          )}
        </Box>
      </Box>

      {/* Button Navigation */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Button Navigation
        </Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 2 }}>
          <Button variant="contained">Dashboard</Button>
          <Button variant="outlined">Profile</Button>
          <Button variant="text">Help</Button>
          <Button variant="contained" size="small">
            Logout
          </Button>
        </Stack>
      </Box>

      {/* Breadcrumb Navigation */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Breadcrumb Navigation
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button color="primary" size="small">
            Home
          </Button>
          <Typography variant="body2">/</Typography>
          <Button color="primary" size="small">
            Products
          </Button>
          <Typography variant="body2">/</Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Electronics
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
