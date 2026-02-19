export interface DesignSystem {
  id: string;
  displayName: string;
  description: string;
  libraryName: string;
  thumbnailPath: string;
  category: DesignSystemCategory;
  tier: 1 | 2 | 3 | 4;
  scaffoldDir: string;
  previewDir: string;
  defaultPlatform: "react";
  tags: string[];
  colorScheme: {
    primary: string;
    secondary: string;
    background: string;
  };
  componentCount: number;
  componentStrategy: "code-copy" | "library-import";
  importPattern: string;
  isBuiltin: boolean;
  isAvailable: boolean;
}

export type DesignSystemCategory =
  | "minimal"
  | "material"
  | "enterprise"
  | "modern"
  | "accessible"
  | "playful";

export const DESIGN_SYSTEMS: DesignSystem[] = [
  {
    id: "shadcn",
    displayName: "Clean Minimalist",
    description:
      "Elegant, minimal design with sharp typography and subtle animations. Perfect for SaaS products and professional tools.",
    libraryName: "shadcn/ui",
    thumbnailPath: "thumbnails/shadcn.png",
    category: "minimal",
    tier: 1,
    scaffoldDir: "scaffold",
    previewDir: "preview-shadcn",
    defaultPlatform: "react",
    tags: ["minimalist", "professional", "saas", "tailwind"],
    colorScheme: {
      primary: "#18181B",
      secondary: "#F4F4F5",
      background: "#FFFFFF",
    },
    componentCount: 49,
    componentStrategy: "code-copy",
    importPattern: "@/components/ui/",
    isBuiltin: true,
    isAvailable: true,
  },
  {
    id: "mui",
    displayName: "Material Modern",
    description:
      "Google's Material Design 3 with elevated surfaces, ripple effects, and a polished enterprise feel.",
    libraryName: "Material UI",
    thumbnailPath: "thumbnails/mui.png",
    category: "material",
    tier: 1,
    scaffoldDir: "scaffold-mui",
    previewDir: "preview-mui",
    defaultPlatform: "react",
    tags: ["material", "google", "enterprise", "elevation"],
    colorScheme: {
      primary: "#1976D2",
      secondary: "#9C27B0",
      background: "#FAFAFA",
    },
    componentCount: 40,
    componentStrategy: "library-import",
    importPattern: "@mui/material",
    isBuiltin: true,
    isAvailable: true,
  },
  {
    id: "antd",
    displayName: "Enterprise Data",
    description:
      "Data-dense interfaces with robust table components and form handling. Ideal for admin panels and dashboards.",
    libraryName: "Ant Design",
    thumbnailPath: "thumbnails/antd.png",
    category: "enterprise",
    tier: 1,
    scaffoldDir: "scaffold-antd",
    previewDir: "preview-antd",
    defaultPlatform: "react",
    tags: ["enterprise", "data", "dashboard", "admin"],
    colorScheme: {
      primary: "#1677FF",
      secondary: "#722ED1",
      background: "#FFFFFF",
    },
    componentCount: 40,
    componentStrategy: "library-import",
    importPattern: "antd",
    isBuiltin: true,
    isAvailable: true,
  },
  {
    id: "mantine",
    displayName: "Developer Friendly",
    description:
      "Modern, accessible components with excellent defaults and rich hook ecosystem. Great for rapid prototyping.",
    libraryName: "Mantine",
    thumbnailPath: "thumbnails/mantine.png",
    category: "modern",
    tier: 1,
    scaffoldDir: "scaffold-mantine",
    previewDir: "preview-mantine",
    defaultPlatform: "react",
    tags: ["modern", "hooks", "accessible", "prototyping"],
    colorScheme: {
      primary: "#339AF0",
      secondary: "#51CF66",
      background: "#FFFFFF",
    },
    componentCount: 40,
    componentStrategy: "library-import",
    importPattern: "@mantine/core",
    isBuiltin: true,
    isAvailable: true,
  },
  {
    id: "chakra",
    displayName: "Accessible Simple",
    description:
      "Simple, modular, and accessible components built with a composable API. Clean and straightforward.",
    libraryName: "Chakra UI",
    thumbnailPath: "thumbnails/chakra.png",
    category: "accessible",
    tier: 1,
    scaffoldDir: "scaffold-chakra",
    previewDir: "preview-chakra",
    defaultPlatform: "react",
    tags: ["accessible", "simple", "composable", "emotion"],
    colorScheme: {
      primary: "#319795",
      secondary: "#805AD5",
      background: "#FFFFFF",
    },
    componentCount: 35,
    componentStrategy: "library-import",
    importPattern: "@chakra-ui/react",
    isBuiltin: true,
    isAvailable: true,
  },
  {
    id: "daisyui",
    displayName: "Playful Tailwind",
    description:
      "Colorful, theme-rich components powered by Tailwind CSS. 30+ built-in themes with zero JavaScript overhead.",
    libraryName: "DaisyUI",
    thumbnailPath: "thumbnails/daisyui.png",
    category: "playful",
    tier: 1,
    scaffoldDir: "scaffold-daisyui",
    previewDir: "preview-daisyui",
    defaultPlatform: "react",
    tags: ["playful", "colorful", "tailwind", "themes"],
    colorScheme: {
      primary: "#570DF8",
      secondary: "#F000B8",
      background: "#FFFFFF",
    },
    componentCount: 35,
    componentStrategy: "code-copy",
    importPattern: "@/components/ui/",
    isBuiltin: true,
    isAvailable: true,
  },
];

export const DESIGN_SYSTEM_IDS = DESIGN_SYSTEMS.map((ds) => ds.id);

export function getDesignSystemById(id: string): DesignSystem | undefined {
  return DESIGN_SYSTEMS.find((ds) => ds.id === id);
}
