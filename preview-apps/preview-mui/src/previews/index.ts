import { ButtonPreview } from "./ButtonPreview";
import { CardPreview } from "./CardPreview";
import { DialogPreview } from "./DialogPreview";
import { FeedbackPreview } from "./FeedbackPreview";
import { InputPreview } from "./InputPreview";
import { NavigationPreview } from "./NavigationPreview";
import { OverviewPreview } from "./OverviewPreview";
import { TablePreview } from "./TablePreview";

export interface PreviewComponent {
  id: string;
  name: string;
  category: string;
  component: React.FC;
}

export const componentRegistry: PreviewComponent[] = [
  {
    id: "overview",
    name: "Overview",
    category: "general",
    component: OverviewPreview,
  },
  {
    id: "buttons",
    name: "Buttons",
    category: "actions",
    component: ButtonPreview,
  },
  {
    id: "inputs",
    name: "Inputs",
    category: "forms",
    component: InputPreview,
  },
  {
    id: "cards",
    name: "Cards",
    category: "layout",
    component: CardPreview,
  },
  {
    id: "dialogs",
    name: "Dialogs",
    category: "overlay",
    component: DialogPreview,
  },
  {
    id: "tables",
    name: "Tables",
    category: "data",
    component: TablePreview,
  },
  {
    id: "navigation",
    name: "Navigation",
    category: "navigation",
    component: NavigationPreview,
  },
  {
    id: "feedback",
    name: "Feedback",
    category: "feedback",
    component: FeedbackPreview,
  },
];
