import {
  Badge,
  Box,
  Button,
  Heading,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";

const sampleData = [
  {
    id: 1,
    name: "Alice Johnson",
    status: "Active",
    role: "Admin",
    date: "2024-01-15",
  },
  {
    id: 2,
    name: "Bob Smith",
    status: "Active",
    role: "User",
    date: "2024-01-14",
  },
  {
    id: 3,
    name: "Carol White",
    status: "Inactive",
    role: "User",
    date: "2024-01-13",
  },
  {
    id: 4,
    name: "David Brown",
    status: "Active",
    role: "Editor",
    date: "2024-01-12",
  },
  {
    id: 5,
    name: "Emma Davis",
    status: "Pending",
    role: "User",
    date: "2024-01-11",
  },
];

function getStatusColor(status: string) {
  switch (status) {
    case "Active":
      return "green";
    case "Inactive":
      return "gray";
    case "Pending":
      return "yellow";
    default:
      return "blue";
  }
}

export function TablePreview() {
  return (
    <Stack spacing={6}>
      <Box>
        <Heading size="md" mb={2}>
          Tables
        </Heading>
        <Text color="gray.600">Data display with rows and columns</Text>
      </Box>

      <Stack spacing={4}>
        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={3}>
            Basic Table
          </Text>
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr bg="gray.100">
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Role</Th>
                  <Th>Join Date</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sampleData.map((row) => (
                  <Tr key={row.id} _hover={{ bg: "gray.50" }}>
                    <Td>{row.name}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(row.status)}>
                        {row.status}
                      </Badge>
                    </Td>
                    <Td>{row.role}</Td>
                    <Td fontSize="sm" color="gray.600">
                      {row.date}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>

        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={3}>
            Striped Table
          </Text>
          <Box overflowX="auto">
            <Table variant="striped" size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Role</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sampleData.slice(0, 3).map((row) => (
                  <Tr key={row.id}>
                    <Td>{row.name}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(row.status)}>
                        {row.status}
                      </Badge>
                    </Td>
                    <Td>{row.role}</Td>
                    <Td>
                      <Button size="xs" variant="ghost">
                        Edit
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>

        <Box>
          <Text fontWeight="medium" fontSize="sm" mb={3}>
            Bordered Table
          </Text>
          <Box overflowX="auto">
            <Table variant="bordered" size="sm">
              <Thead bg="brand.50">
                <Tr>
                  <Th>ID</Th>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Role</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sampleData.slice(0, 3).map((row) => (
                  <Tr key={row.id}>
                    <Td fontSize="sm">{row.id}</Td>
                    <Td>{row.name}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(row.status)}>
                        {row.status}
                      </Badge>
                    </Td>
                    <Td>{row.role}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Box>
      </Stack>
    </Stack>
  );
}
