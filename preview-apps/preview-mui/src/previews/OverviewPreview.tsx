import { Box, Button, Grid, Typography } from "@mui/material";

export function OverviewPreview() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
          Material UI Preview
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
          Showcase of Material UI components built with React and Vite. Navigate
          using the buttons above to explore different component categories.
        </Typography>
      </Box>

      <Box>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Component Categories
        </Typography>
        <Grid container spacing={2}>
          {[
            { title: "Buttons", desc: "Click actions and button variants" },
            { title: "Inputs", desc: "Form fields and text inputs" },
            { title: "Cards", desc: "Content containers" },
            { title: "Dialogs", desc: "Modal and dialog overlays" },
            { title: "Tables", desc: "Data display tables" },
            { title: "Navigation", desc: "Navigation bars and tabs" },
            { title: "Feedback", desc: "Alerts, badges, and feedback" },
          ].map((category) => (
            <Grid item xs={12} sm={6} key={category.title}>
              <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {category.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {category.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ pt: 3, borderTop: "1px solid #e0e0e0" }}>
        <Typography variant="subtitle2" sx={{ color: "text.secondary", mb: 2 }}>
          Quick Links
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button variant="contained" size="small">
            Primary Action
          </Button>
          <Button variant="outlined" size="small">
            Secondary Action
          </Button>
          <Button variant="text" size="small">
            Tertiary
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
