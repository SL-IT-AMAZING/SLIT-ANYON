# AI Rules for Ant Design App

## Component Usage

- Import components from `antd` (e.g., `import { Button, Card, Input, Table } from "antd"`)
- Import icons from `@ant-design/icons` (e.g., `import { PlusOutlined, DeleteOutlined } from "@ant-design/icons"`)
- Do NOT create wrapper components that duplicate Ant Design components
- `src/components/` is for custom, app-specific components only

## Component Library: Ant Design v5

- Documentation: https://ant.design/
- CSS-in-JS with design tokens via ConfigProvider
- Theme customization via `src/theme.ts`

## Styling

- Use Ant Design's built-in styling system — Do NOT use Tailwind CSS
- Use Space, Flex, Row, Col for layout
- Token-based colors: colorPrimary, colorSuccess, colorWarning, colorError
- Typography: Title (levels 1-5), Text, Paragraph

## Forms

- Use Ant Design's Form component with built-in validation (Form.useForm, Form.Item, rules)
- Can also use react-hook-form + zod for complex validation scenarios

## Available Components

Button, Input, Select, Checkbox, Switch, Radio, Slider, DatePicker, TimePicker, Card, Modal, Table, Tabs, Badge, Alert, Message, Notification, Tooltip, Avatar, Tag, List, Collapse, Divider, Progress, Skeleton, Drawer, Layout (Header/Sider/Content/Footer), Menu, Dropdown, Breadcrumb, Pagination, Steps, Transfer, Tree, Upload, Popconfirm, Popover, Descriptions, Statistic, Result, Empty, Spin, Typography (Title/Text/Paragraph), Space, Flex, Row, Col, Form

## Available Utilities & Libraries

- `react-router-dom` — For routing
- `react-hook-form` + `@hookform/resolvers` — For form handling
- `zod` — For schema validation
- `clsx` + `tailwind-merge` — For className utilities (via `cn()` in `src/lib/utils.ts`)
- `dayjs` — For date manipulation
