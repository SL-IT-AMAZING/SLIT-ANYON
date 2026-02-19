import { HeartOutlined, RocketOutlined, StarOutlined } from "@ant-design/icons";
import { Button, Card, Col, Divider, Row, Typography } from "antd";

const { Title, Paragraph } = Typography;

export function OverviewPreview() {
  return (
    <div>
      <Title level={1} style={{ marginBottom: "8px" }}>
        Ant Design Component Preview
      </Title>
      <Paragraph
        style={{ marginBottom: "32px", fontSize: "16px", color: "#666" }}
      >
        A comprehensive showcase of Ant Design components in an interactive
        environment.
      </Paragraph>

      <Divider />

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card>
            <RocketOutlined style={{ fontSize: "32px", color: "#1890ff" }} />
            <Title level={4} style={{ marginTop: "16px" }}>
              Interactive
            </Title>
            <Paragraph>
              Explore interactive component previews with real-time interactions
              and responsive layouts.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <StarOutlined style={{ fontSize: "32px", color: "#faad14" }} />
            <Title level={4} style={{ marginTop: "16px" }}>
              Complete Library
            </Title>
            <Paragraph>
              Browse through all major Ant Design components including buttons,
              forms, tables, and modals.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <HeartOutlined style={{ fontSize: "32px", color: "#f5222d" }} />
            <Title level={4} style={{ marginTop: "16px" }}>
              Production Ready
            </Title>
            <Paragraph>
              Use these patterns in your production applications with Ant
              Design's reliable component library.
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Title level={3}>Getting Started</Title>
      <Paragraph>
        Navigate using the buttons at the top to explore different component
        categories. Each section demonstrates various use cases and
        configurations.
      </Paragraph>

      <Button type="primary" size="large" style={{ marginTop: "16px" }}>
        Explore Components
      </Button>
    </div>
  );
}
