import {
  EyeOutlined,
  HeartOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { Badge, Button, Card, Col, Divider, Row, Typography } from "antd";

const { Title, Paragraph } = Typography;

export function CardPreview() {
  return (
    <div>
      <Title level={2}>Card Layouts</Title>

      <Divider>Basic Cards</Divider>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card
            title="Card Title"
            extra={<a href="#">More</a>}
            style={{ cursor: "pointer" }}
            hoverable
          >
            <Paragraph>
              This is a basic card with a title and some content. Cards are
              useful for organizing information.
            </Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            cover={
              <div
                style={{
                  height: "200px",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              />
            }
            hoverable
          >
            <Card.Meta
              title="Card with Cover"
              description="Ant Design card with cover image"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            title="Product Card"
            extra={<Badge count={5} />}
            actions={[
              <HeartOutlined key="like" />,
              <EyeOutlined key="view" />,
              <ShareAltOutlined key="share" />,
            ]}
          >
            <Paragraph>Product price: $99.99</Paragraph>
            <Button type="primary" block>
              Add to Cart
            </Button>
          </Card>
        </Col>
      </Row>

      <Divider>Card Variants</Divider>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card type="inner" title="Inner Card">
            <Paragraph>This is a nested inner card</Paragraph>
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card loading={false} title="Loaded Card">
            <Paragraph>Content is fully loaded</Paragraph>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
