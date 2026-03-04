import type { FC } from "react";
import { CardsPreview } from "./CardsPreview";
import { ColorPalettePreview } from "./ColorPalettePreview";
import { DashboardPreview } from "./DashboardPreview";
import { MailPreview } from "./MailPreview";
import { PricingPreview } from "./PricingPreview";

export interface PreviewComponent {
  id: string;
  name: string;
  category: string;
  component: FC;
}

export const componentRegistry: PreviewComponent[] = [
  { id: "cards", name: "Cards", category: "preview", component: CardsPreview },
  {
    id: "dashboard",
    name: "Dashboard",
    category: "preview",
    component: DashboardPreview,
  },
  { id: "mail", name: "Mail", category: "preview", component: MailPreview },
  {
    id: "pricing",
    name: "Pricing",
    category: "preview",
    component: PricingPreview,
  },
  {
    id: "colors",
    name: "Color Palette",
    category: "preview",
    component: ColorPalettePreview,
  },
];
