import { Stack, Table, Text, Title } from "@mantine/core";

const sampleData = [
  { id: 1, name: "Alice Johnson", role: "Engineer", status: "Active" },
  { id: 2, name: "Bob Smith", role: "Designer", status: "Active" },
  { id: 3, name: "Carol White", role: "Manager", status: "Inactive" },
  { id: 4, name: "David Brown", role: "Developer", status: "Active" },
];

export function TablePreview() {
  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Tables</Title>
        <Text c="dimmed" size="sm">
          Table layouts for displaying structured data
        </Text>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Basic Table
        </Text>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Role</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sampleData.map((row) => (
              <Table.Tr key={row.id}>
                <Table.Td>{row.id}</Table.Td>
                <Table.Td>{row.name}</Table.Td>
                <Table.Td>{row.role}</Table.Td>
                <Table.Td>{row.status}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Bordered Table
        </Text>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Column 1</Table.Th>
              <Table.Th>Column 2</Table.Th>
              <Table.Th>Column 3</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>Data A</Table.Td>
              <Table.Td>Data B</Table.Td>
              <Table.Td>Data C</Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>Data D</Table.Td>
              <Table.Td>Data E</Table.Td>
              <Table.Td>Data F</Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </div>
    </Stack>
  );
}
