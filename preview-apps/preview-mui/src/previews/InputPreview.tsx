import {
  Box,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

export function InputPreview() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    color: "primary",
    agree: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 600 }}
    >
      <Box>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Form Inputs
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Text Fields
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            placeholder="Enter username"
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            variant="outlined"
            fullWidth
          />
          <TextField
            label="Multiline"
            multiline
            rows={4}
            defaultValue="Type your message here..."
            variant="outlined"
            fullWidth
          />
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Text Field Variants
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Outlined (default)"
            variant="outlined"
            fullWidth
            size="small"
          />
          <TextField label="Filled" variant="filled" fullWidth size="small" />
          <TextField
            label="Standard"
            variant="standard"
            fullWidth
            size="small"
          />
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Checkboxes
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
            />
          }
          label="I agree to the terms and conditions"
        />
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Radio Buttons
        </Typography>
        <RadioGroup name="color" value={formData.color} onChange={handleChange}>
          <FormControlLabel
            value="primary"
            control={<Radio />}
            label="Primary"
          />
          <FormControlLabel
            value="secondary"
            control={<Radio />}
            label="Secondary"
          />
          <FormControlLabel
            value="success"
            control={<Radio />}
            label="Success"
          />
        </RadioGroup>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Disabled & Error States
        </Typography>
        <Stack spacing={2}>
          <TextField label="Disabled" disabled variant="outlined" fullWidth />
          <TextField
            label="Error"
            error
            helperText="This field has an error"
            variant="outlined"
            fullWidth
          />
        </Stack>
      </Box>
    </Box>
  );
}
