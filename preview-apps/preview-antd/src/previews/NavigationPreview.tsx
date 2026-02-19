import {
  FileOutlined,
  HomeOutlined,
  SettingOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Breadcrumb, Divider, Menu, Tabs, Typography } from "antd";
import { useState } from "react";

const { Title } = Typography;

export function NavigationPreview() {
  const [selectedMenu, setSelectedMenu] = useState(["1"]);

  const tabItems = [
    {
      key: "1",
      label: "Tab 1",
      children: "Content for tab 1",
    },
    {
      key: "2",
      label: "Tab 2",
      children: "Content for tab 2",
    },
    {
      key: "3",
      label: "Tab 3",
      children: "Content for tab 3",
    },
  ];

  const menuItems = [
    {
      key: "1",
      icon: <HomeOutlined />,
      label: "Home",
    },
    {
      key: "2",
      icon: <FileOutlined />,
      label: "Documents",
      children: [
        { key: "2-1", label: "Reports" },
        { key: "2-2", label: "Invoices" },
      ],
    },
    {
      key: "3",
      icon: <TeamOutlined />,
      label: "Team",
    },
    {
      key: "4",
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ];

  return (
    <div>
      <Title level={2}>Navigation Components</Title>

      <Divider>Tabs</Divider>
      <Tabs
        items={tabItems}
        defaultActiveKey="1"
        style={{ marginBottom: "32px" }}
      />

      <Divider>Menu</Divider>
      <Menu
        mode="vertical"
        items={menuItems}
        selectedKeys={selectedMenu}
        onSelect={(e) => setSelectedMenu([e.key])}
        style={{ maxWidth: "200px", marginBottom: "32px" }}
      />

      <Divider>Breadcrumb Navigation</Divider>
      <Breadcrumb
        items={[
          { title: "Home" },
          { title: "Documents" },
          { title: "File" },
          { title: "Current Page" },
        ]}
      />

      <Divider>Horizontal Menu</Divider>
      <Menu
        mode="horizontal"
        items={[
          { key: "1", label: "Home" },
          { key: "2", label: "About" },
          { key: "3", label: "Services" },
          { key: "4", label: "Contact" },
        ]}
      />
    </div>
  );
}
