import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import {
  Checkbox,
  DatePicker,
  Divider,
  Input,
  InputNumber,
  Select,
  Space,
  TimePicker,
  Typography,
} from "antd";
import { useState } from "react";

const { Title } = Typography;

export function InputPreview() {
  const [value, setValue] = useState("");

  return (
    <div>
      <Title level={2}>Input Components</Title>

      <Divider>Text Input</Divider>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Input placeholder="Basic input" />
        <Input placeholder="With prefix icon" prefix={<UserOutlined />} />
        <Input.Search
          placeholder="Search"
          prefix={<SearchOutlined />}
          onSearch={(val) => console.log(val)}
        />
        <Input.TextArea rows={4} placeholder="Text area for longer content" />
      </Space>

      <Divider>Number Input</Divider>
      <Space direction="vertical" style={{ width: "100%" }}>
        <InputNumber
          min={0}
          max={100}
          defaultValue={50}
          style={{ width: "100%" }}
        />
        <InputNumber
          min={0}
          step={0.1}
          defaultValue={3.14}
          style={{ width: "100%" }}
        />
      </Space>

      <Divider>Select</Divider>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Select
          placeholder="Select an option"
          options={[
            { label: "Option 1", value: "opt1" },
            { label: "Option 2", value: "opt2" },
            { label: "Option 3", value: "opt3" },
          ]}
          style={{ width: "100%" }}
        />
        <Select
          mode="multiple"
          placeholder="Select multiple"
          options={[
            { label: "React", value: "react" },
            { label: "Vue", value: "vue" },
            { label: "Angular", value: "angular" },
          ]}
          style={{ width: "100%" }}
        />
      </Space>

      <Divider>Checkbox</Divider>
      <Space direction="vertical">
        <Checkbox>Unchecked</Checkbox>
        <Checkbox defaultChecked>Checked</Checkbox>
        <Checkbox disabled>Disabled</Checkbox>
      </Space>

      <Divider>Date & Time</Divider>
      <Space direction="vertical" style={{ width: "100%" }}>
        <DatePicker style={{ width: "100%" }} />
        <TimePicker style={{ width: "100%" }} />
      </Space>
    </div>
  );
}
