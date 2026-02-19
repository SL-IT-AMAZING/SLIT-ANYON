import {
  Checkbox,
  Group,
  NumberInput,
  Radio,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Textarea,
  Title,
} from "@mantine/core";
import { IconMail } from "@tabler/icons-react";
import { useState } from "react";

export function InputPreview() {
  const [checked, setChecked] = useState(false);
  const [radioValue, setRadioValue] = useState<string | null>("option1");

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Form Inputs</Title>
        <Text c="dimmed" size="sm">
          Text inputs, selects, and other form controls
        </Text>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Text Inputs
        </Text>
        <Stack gap="sm">
          <TextInput label="Regular Input" placeholder="Enter text..." />
          <TextInput
            label="With Icon"
            placeholder="Enter email..."
            leftSection={<IconMail size={16} />}
          />
          <TextInput
            label="With Validation"
            placeholder="Type something..."
            error="This field is required"
          />
          <TextInput
            label="Disabled"
            placeholder="This is disabled..."
            disabled
          />
        </Stack>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Textarea
        </Text>
        <Textarea
          label="Message"
          placeholder="Enter your message..."
          minRows={4}
        />
      </div>

      <div>
        <Text fw={500} mb="xs">
          Select
        </Text>
        <Select
          label="Choose an option"
          placeholder="Select something..."
          data={["Option 1", "Option 2", "Option 3"]}
        />
      </div>

      <div>
        <Text fw={500} mb="xs">
          Number Input
        </Text>
        <NumberInput
          label="Quantity"
          placeholder="Enter a number..."
          defaultValue={1}
          min={0}
        />
      </div>

      <div>
        <Text fw={500} mb="xs">
          Checkbox
        </Text>
        <Checkbox
          checked={checked}
          onChange={(event) => setChecked(event.currentTarget.checked)}
          label="Accept terms and conditions"
        />
      </div>

      <div>
        <Text fw={500} mb="xs">
          Radio Group
        </Text>
        <Group>
          <Radio
            checked={radioValue === "option1"}
            onChange={() => setRadioValue("option1")}
            label="Option 1"
            value="option1"
          />
          <Radio
            checked={radioValue === "option2"}
            onChange={() => setRadioValue("option2")}
            label="Option 2"
            value="option2"
          />
          <Radio
            checked={radioValue === "option3"}
            onChange={() => setRadioValue("option3")}
            label="Option 3"
            value="option3"
          />
        </Group>
      </div>

      <div>
        <Text fw={500} mb="xs">
          Switch
        </Text>
        <Switch label="Enable notifications" defaultChecked />
      </div>
    </Stack>
  );
}
