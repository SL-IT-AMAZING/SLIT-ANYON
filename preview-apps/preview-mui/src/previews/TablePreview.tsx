import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

export function TablePreview() {
  const data = [
    {
      id: 1,
      name: "Alice Johnson",
      email: "alice@example.com",
      status: "Active",
      role: "Admin",
    },
    {
      id: 2,
      name: "Bob Smith",
      email: "bob@example.com",
      status: "Active",
      role: "User",
    },
    {
      id: 3,
      name: "Carol White",
      email: "carol@example.com",
      status: "Inactive",
      role: "User",
    },
    {
      id: 4,
      name: "David Brown",
      email: "david@example.com",
      status: "Active",
      role: "Moderator",
    },
    {
      id: 5,
      name: "Eve Davis",
      email: "eve@example.com",
      status: "Active",
      role: "User",
    },
  ];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <Box>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
          Tables
        </Typography>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          User Data Table
        </Typography>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{
                    "&:hover": {
                      backgroundColor: "#f9f9f9",
                    },
                  }}
                >
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "inline-block",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor:
                          row.status === "Active" ? "#e8f5e9" : "#ffebee",
                        color: row.status === "Active" ? "#2e7d32" : "#c62828",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                      }}
                    >
                      {row.status}
                    </Box>
                  </TableCell>
                  <TableCell>{row.role}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Features
        </Typography>
        <Box sx={{ backgroundColor: "#f5f5f5", p: 2, borderRadius: 1 }}>
          <Typography variant="body2">
            • Sortable columns
            <br />• Hover effects
            <br />• Status badges
            <br />• Responsive design
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
