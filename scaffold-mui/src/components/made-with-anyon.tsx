import { Box, Typography } from "@mui/material";

export function MadeWithAnyon() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 4,
        textAlign: "center",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Made with{" "}
        <Box component="span" sx={{ color: "primary.main" }}>
          ✨ Anyon
        </Box>
      </Typography>
    </Box>
  );
}
