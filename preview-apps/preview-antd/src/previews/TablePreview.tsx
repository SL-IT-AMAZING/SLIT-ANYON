import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Divider, Space, Table, Typography } from "antd";
import { useState } from "react";

const { Title } = Typography;

interface DataType {
  key: string;
  name: string;
  email: string;
  status: string;
  joinDate: string;
}

const sampleData: DataType[] = [
  {
    key: "1",
    name: "John Doe",
    email: "john@example.com",
    status: "Active",
    joinDate: "2024-01-15",
  },
  {
    key: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    status: "Active",
    joinDate: "2024-02-20",
  },
  {
    key: "3",
    name: "Bob Wilson",
    email: "bob@example.com",
    status: "Inactive",
    joinDate: "2023-12-10",
  },
  {
    key: "4",
    name: "Alice Johnson",
    email: "alice@example.com",
    status: "Active",
    joinDate: "2024-03-05",
  },
  {
    key: "5",
    name: "Charlie Brown",
    email: "charlie@example.com",
    status: "Pending",
    joinDate: "2024-03-15",
  },
];

export function TablePreview() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: DataType, b: DataType) => a.name.localeCompare(b.name),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: { [key: string]: string } = {
          Active: "#52c41a",
          Inactive: "#f5222d",
          Pending: "#faad14",
        };
        return <span style={{ color: colors[status] }}>{status}</span>;
      },
    },
    {
      title: "Join Date",
      dataIndex: "joinDate",
      key: "joinDate",
      sorter: (a: DataType, b: DataType) =>
        new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime(),
    },
    {
      title: "Action",
      key: "action",
      render: () => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div>
      <Title level={2}>Data Tables</Title>

      <Divider>Basic Table with Selection</Divider>
      <Table
        columns={columns}
        dataSource={sampleData}
        rowSelection={rowSelection}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 600 }}
      />

      <Divider>Table without Selection</Divider>
      <Table
        columns={columns}
        dataSource={sampleData}
        pagination={false}
        scroll={{ x: 600 }}
      />
    </div>
  );
}
