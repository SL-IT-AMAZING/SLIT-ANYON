import {
  DeleteOutlined,
  DownloadOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Button, Divider, Space, Typography } from "antd";

const { Title, Paragraph } = Typography;

export function ButtonPreview() {
  return (
    <div>
      <Title level={2}>Button Variations</Title>

      <Divider>Primary Buttons</Divider>
      <Space wrap>
        <Button type="primary">Primary</Button>
        <Button type="primary" size="large">
          Large
        </Button>
        <Button type="primary" size="small">
          Small
        </Button>
        <Button type="primary" loading>
          Loading
        </Button>
        <Button type="primary" disabled>
          Disabled
        </Button>
      </Space>

      <Divider>Default Buttons</Divider>
      <Space wrap>
        <Button>Default</Button>
        <Button size="large">Large</Button>
        <Button size="small">Small</Button>
      </Space>

      <Divider>Dashed Buttons</Divider>
      <Space wrap>
        <Button danger>Danger</Button>
        <Button type="dashed">Dashed</Button>
        <Button type="text">Text</Button>
      </Space>

      <Divider>With Icons</Divider>
      <Space wrap>
        <Button type="primary" icon={<DownloadOutlined />}>
          Download
        </Button>
        <Button type="primary" danger icon={<DeleteOutlined />}>
          Delete
        </Button>
        <Button type="primary" icon={<PlusOutlined />}>
          Add
        </Button>
      </Space>

      <Divider>Button Groups</Divider>
      <Button.Group>
        <Button>Left</Button>
        <Button>Middle</Button>
        <Button>Right</Button>
      </Button.Group>
    </div>
  );
}
