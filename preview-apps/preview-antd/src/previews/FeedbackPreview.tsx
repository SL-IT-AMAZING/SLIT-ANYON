import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Divider,
  Progress,
  Space,
  Tag,
  Tooltip,
  Typography,
  notification,
} from "antd";

const { Title } = Typography;

export function FeedbackPreview() {
  const showNotification = (type: "success" | "info" | "warning" | "error") => {
    notification[type]({
      message: "Notification Title",
      description:
        "This is a sample notification message that appears in the top-right corner.",
      duration: 4.5,
    });
  };

  return (
    <div>
      <Title level={2}>Feedback Components</Title>

      <Divider>Alerts</Divider>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Alert
          message="Success"
          description="This is a success alert message"
          type="success"
          icon={<CheckCircleOutlined />}
        />
        <Alert
          message="Info"
          description="This is an informational alert message"
          type="info"
          icon={<InfoCircleOutlined />}
        />
        <Alert
          message="Warning"
          description="This is a warning alert message"
          type="warning"
          icon={<WarningOutlined />}
        />
        <Alert
          message="Error"
          description="This is an error alert message"
          type="error"
          icon={<CloseCircleOutlined />}
        />
      </Space>

      <Divider>Tags</Divider>
      <Space wrap>
        <Tag>Default Tag</Tag>
        <Tag color="blue">Blue Tag</Tag>
        <Tag color="green">Green Tag</Tag>
        <Tag color="orange">Orange Tag</Tag>
        <Tag color="red">Red Tag</Tag>
        <Tag color="purple">Purple Tag</Tag>
      </Space>

      <Divider>Badges</Divider>
      <Space wrap>
        <Badge count={5} />
        <Badge count={99} />
        <Badge count={999} overflowCount={99} />
        <Badge status="success" text="Success" />
        <Badge status="error" text="Error" />
        <Badge status="processing" text="Processing" />
      </Space>

      <Divider>Progress</Divider>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Progress percent={30} />
        <Progress percent={50} status="active" />
        <Progress percent={70} status="success" />
        <Progress percent={100} status="exception" />
        <Progress type="circle" percent={75} width={80} />
      </Space>

      <Divider>Tooltips</Divider>
      <Space>
        <Tooltip title="Helpful tooltip text">
          <Button>Hover me</Button>
        </Tooltip>
        <Tooltip title="More information">
          <Button type="primary">Primary Button</Button>
        </Tooltip>
      </Space>

      <Divider>Notifications</Divider>
      <Space>
        <Button onClick={() => showNotification("success")} type="primary">
          Success Notification
        </Button>
        <Button onClick={() => showNotification("info")}>Info</Button>
        <Button onClick={() => showNotification("warning")} type="dashed">
          Warning
        </Button>
        <Button onClick={() => showNotification("error")} danger>
          Error
        </Button>
      </Space>
    </div>
  );
}
