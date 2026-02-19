import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Chip,
  Grid,
  Typography,
} from "@mui/material";

export function CardPreview() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Cards
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Basic Card */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                BASIC CARD
              </Typography>
              <Typography variant="h5" component="div">
                Card Title
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                This is a basic card with some content to display information to
                the user.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small">Learn More</Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Card with Image */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardMedia
              component="div"
              sx={{
                height: 140,
                backgroundColor: "#e0e0e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body2" color="textSecondary">
                Image Placeholder
              </Typography>
            </CardMedia>
            <CardContent>
              <Typography gutterBottom variant="h5" component="div">
                Media Card
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Card with image placeholder at the top.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small">Share</Button>
              <Button size="small">Learn More</Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Interactive Card */}
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                FEATURE
              </Typography>
              <Typography variant="h5" component="div">
                Interactive Card
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ mt: 2, mb: 2 }}
              >
                This card demonstrates interactive elements with actions.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Chip label="React" size="small" />
                <Chip label="Material UI" size="small" />
                <Chip label="Cards" size="small" />
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" startIcon={<FavoriteIcon />}>
                Like
              </Button>
              <Button size="small" startIcon={<ShareIcon />}>
                Share
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Outlined Card */}
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                OUTLINED
              </Typography>
              <Typography variant="h5" component="div">
                Outlined Card
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                This card uses an outlined variant with a subtle border.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small">Action</Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
