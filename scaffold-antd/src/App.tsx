import { MadeWithAnyon } from "@/components/made-with-anyon";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Layout,
  Menu,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";

const { Header, Content, Footer, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

interface DataItem {
  key: string;
  name: string;
  status: string;
  description: string;
}

export default function App() {
  const [items, setItems] = useState<DataItem[]>([
    {
      key: "1",
      name: "Task 1",
      status: "Completed",
      description: "Sample task with Ant Design",
    },
    {
      key: "2",
      name: "Task 2",
      status: "In Progress",
      description: "Learn React with Ant Design",
    },
    {
      key: "3",
      name: "Task 3",
      status: "Pending",
      description: "Build awesome UI",
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = (key: string) => {
    setItems(items.filter((item) => item.key !== key));
  };

  const handleAddItem = () => {
    const newKey = String(Math.max(...items.map((i) => Number(i.key))) + 1);
    setItems([
      ...items,
      {
        key: newKey,
        name: `New Task ${newKey}`,
        status: "Pending",
        description: "New task added",
      },
    ]);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        if (status === "Completed") color = "success";
        if (status === "In Progress") color = "processing";
        if (status === "Pending") color = "warning";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: DataItem) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.key)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={200} style={{ background: "#fff" }}>
        <Menu
          mode="inline"
          defaultSelectedKeys={["1"]}
          style={{ height: "100%", borderRight: 0 }}
          items={[
            { key: "1", label: "Dashboard" },
            { key: "2", label: "Tasks" },
            { key: "3", label: "Settings" },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#001529",
            color: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Title level={3} style={{ color: "#fff", margin: 0 }}>
            Ant Design + React + Vite
          </Title>
        </Header>
        <Content style={{ padding: "24px", background: "#f5f5f5" }}>
          <Card style={{ marginBottom: "24px" }}>
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <div>
                <Title level={2}>Welcome to Your Ant Design App</Title>
                <Paragraph>
                  This scaffold demonstrates a fully functional Vite + React +
                  Ant Design v5 application. Below you'll find examples of
                  common Ant Design components in action.
                </Paragraph>
              </div>

              <div>
                <Title level={4}>Search & Add Items</Title>
                <Space style={{ width: "100%" }}>
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: "250px" }}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleAddItem}
                  >
                    Add Task
                  </Button>
                </Space>
              </div>

              <div>
                <Title level={4}>Tasks Table</Title>
                <Table
                  columns={columns}
                  dataSource={items.filter((item) =>
                    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
                  )}
                  pagination={{ pageSize: 10 }}
                />
              </div>

              <div>
                <Title level={4}>Quick Stats</Title>
                <Space>
                  <Tag color="blue">Total: {items.length}</Tag>
                  <Tag color="green">
                    Completed:{" "}
                    {items.filter((i) => i.status === "Completed").length}
                  </Tag>
                  <Tag color="orange">
                    In Progress:{" "}
                    {items.filter((i) => i.status === "In Progress").length}
                  </Tag>
                  <Tag color="red">
                    Pending:{" "}
                    {items.filter((i) => i.status === "Pending").length}
                  </Tag>
                </Space>
              </div>

              <Paragraph>
                <Text strong>Key Features:</Text>
                <ul>
                  <li>Ant Design v5 components (Button, Card, Table, Input)</li>
                  <li>Layout with Sider, Header, and Content</li>
                  <li>Form handling with Input and Tag components</li>
                  <li>Icons from @ant-design/icons</li>
                  <li>TypeScript support</li>
                  <li>Vite for fast dev server and builds</li>
                  <li>React Router ready (not included by default)</li>
                </ul>
              </Paragraph>
            </Space>
          </Card>
        </Content>
        <Footer
          style={{ textAlign: "center", background: "#001529", color: "#fff" }}
        >
          <MadeWithAnyon />
        </Footer>
      </Layout>
    </Layout>
  );
}
