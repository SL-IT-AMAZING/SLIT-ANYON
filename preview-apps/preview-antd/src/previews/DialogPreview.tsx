import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Button, Divider, Modal, Space, Typography } from "antd";
import { useState } from "react";

const { Title } = Typography;

export function DialogPreview() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const showConfirm = () => {
    Modal.confirm({
      title: "Confirm Action",
      icon: <ExclamationCircleOutlined />,
      content: "Are you sure you want to proceed with this action?",
      okText: "Yes",
      cancelText: "No",
      onOk() {
        console.log("OK");
      },
      onCancel() {
        console.log("Cancel");
      },
    });
  };

  return (
    <div>
      <Title level={2}>Dialog & Modal Components</Title>

      <Divider>Basic Modal</Divider>
      <Space>
        <Button type="primary" onClick={() => setIsOpen(true)}>
          Open Modal
        </Button>

        <Modal
          title="Modal Dialog"
          open={isOpen}
          onOk={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        >
          <p>This is a modal dialog with interactive content.</p>
          <p>You can add any content inside including forms and buttons.</p>
        </Modal>
      </Space>

      <Divider>Confirm Dialog</Divider>
      <Button onClick={showConfirm}>Show Confirm</Button>

      <Divider>Dialog Variations</Divider>
      <Space direction="vertical">
        <Button
          onClick={() => {
            Modal.success({
              title: "Success",
              content: "Operation completed successfully!",
            });
          }}
        >
          Success Modal
        </Button>
        <Button
          onClick={() => {
            Modal.error({
              title: "Error",
              content: "An error occurred during the operation.",
            });
          }}
          danger
        >
          Error Modal
        </Button>
        <Button
          onClick={() => {
            Modal.info({
              title: "Information",
              content: "This is an informational message.",
            });
          }}
          type="dashed"
        >
          Info Modal
        </Button>
        <Button
          onClick={() => {
            Modal.warning({
              title: "Warning",
              content: "Please be careful with this action.",
            });
          }}
          type="dashed"
        >
          Warning Modal
        </Button>
      </Space>
    </div>
  );
}
