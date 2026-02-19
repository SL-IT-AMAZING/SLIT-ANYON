import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

export function DialogPreview() {
  const [openBasic, setOpenBasic] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [openForm, setOpenForm] = useState(false);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Dialogs & Modals
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Dialog Examples
        </Typography>
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 2 }}>
          <Button variant="contained" onClick={() => setOpenBasic(true)}>
            Basic Dialog
          </Button>
          <Button variant="contained" onClick={() => setOpenAlert(true)}>
            Alert Dialog
          </Button>
          <Button variant="contained" onClick={() => setOpenForm(true)}>
            Form Dialog
          </Button>
        </Stack>
      </Box>

      {/* Basic Dialog */}
      <Dialog
        open={openBasic}
        onClose={() => setOpenBasic(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Basic Dialog</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mt: 2 }}>
            This is a basic dialog window. You can use it to display information
            or request user input.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBasic(false)}>Cancel</Button>
          <Button onClick={() => setOpenBasic(false)} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Dialog */}
      <Dialog
        open={openAlert}
        onClose={() => setOpenAlert(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mt: 2 }}>
            Are you sure you want to proceed with this action? This cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAlert(false)}>Cancel</Button>
          <Button
            onClick={() => setOpenAlert(false)}
            variant="contained"
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Form Dialog */}
      <Dialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enter Information</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3, mt: 1 }}>
            Please provide the following information:
          </DialogContentText>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <input
              type="text"
              placeholder="Name"
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontFamily: "inherit",
              }}
            />
            <input
              type="email"
              placeholder="Email"
              style={{
                padding: "8px 12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontFamily: "inherit",
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button onClick={() => setOpenForm(false)} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
        <Typography variant="body2" color="textSecondary">
          Click the buttons above to open different dialog types. Dialogs
          provide a modal overlay for user interactions.
        </Typography>
      </Box>
    </Box>
  );
}
