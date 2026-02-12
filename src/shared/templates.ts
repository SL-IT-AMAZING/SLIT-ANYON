export type TemplateCategory = "apps" | "web" | "saas";

export interface Template {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  githubUrl?: string;
  isOfficial: boolean;
  isExperimental?: boolean;
  requiresNeon?: boolean;
  category?: TemplateCategory;
  subcategory?: string;
  tags?: string[];
  techStack?: string[];
  screenshots?: string[];
  features?: string[];
  longDescription?: string;
  demoUrl?: string;
  author?: {
    name: string;
    avatar?: string;
    url?: string;
  };
}

// API Template interface from the external API
export interface ApiTemplate {
  githubOrg: string;
  githubRepo: string;
  title: string;
  description: string;
  imageUrl: string;
}

export const DEFAULT_TEMPLATE_ID = "react";
export const DEFAULT_TEMPLATE: Template = {
  id: "react",
  title: "React.js Template",
  description: "Uses React.js, Vite, Shadcn, Tailwind and TypeScript.",
  imageUrl:
    "https://github.com/user-attachments/assets/5b700eab-b28c-498e-96de-8649b14c16d9",
  isOfficial: true,
  category: "apps",
  techStack: ["React", "Vite", "Tailwind", "TypeScript"],
  tags: ["react", "starter", "vite"],
  features: [
    "React.js with Vite for fast development",
    "Shadcn/ui component library",
    "Tailwind CSS for styling",
    "TypeScript support",
  ],
};

const PORTAL_MINI_STORE_ID = "portal-mini-store";
export const NEON_TEMPLATE_IDS = new Set<string>([PORTAL_MINI_STORE_ID]);

export const localTemplatesData: Template[] = [
  DEFAULT_TEMPLATE,
  {
    id: "next",
    title: "Next.js Template",
    description: "Uses Next.js, React.js, Shadcn, Tailwind and TypeScript.",
    imageUrl:
      "https://github.com/user-attachments/assets/96258e4f-abce-4910-a62a-a9dff77965f2",
    isOfficial: true,
    category: "apps",
    techStack: ["Next.js", "React", "Tailwind", "TypeScript"],
    tags: ["nextjs", "starter", "react"],
    features: [
      "Next.js App Router",
      "Shadcn/ui component library",
      "Tailwind CSS for styling",
      "TypeScript support",
    ],
  },
  {
    id: PORTAL_MINI_STORE_ID,
    title: "Portal: Mini Store Template",
    description: "Uses Neon DB, Payload CMS, Next.js",
    imageUrl:
      "https://github.com/user-attachments/assets/ed86f322-40bf-4fd5-81dc-3b1d8a16e12b",
    githubUrl:
      "https://github.com/SL-IT-AMAZING/anyon-portal-mini-store-template",
    isOfficial: true,
    isExperimental: true,
    requiresNeon: true,
    category: "saas",
    techStack: ["Next.js", "Neon", "Payload CMS"],
    tags: ["ecommerce", "saas", "neon"],
    features: [
      "Neon serverless Postgres",
      "Payload CMS for content management",
      "Next.js for server-side rendering",
      "E-commerce ready",
    ],
  },
  {
    id: "blazity-next-saas-starter",
    title: "SaaS Landing Page",
    description:
      "A modern SaaS landing page starter with blog, documentation, and marketing pages.",
    imageUrl: "https://opengraph.githubassets.com/1/Blazity/next-saas-starter",
    githubUrl: "https://github.com/Blazity/next-saas-starter",
    isOfficial: false,
    category: "web",
    techStack: ["Next.js", "TypeScript", "MDX", "Tailwind"],
    tags: ["landing-page", "saas", "marketing"],
    features: [
      "SEO-optimized landing pages",
      "Blog with MDX support",
      "Dark mode support",
      "Responsive design",
    ],
  },
  {
    id: "arifszn-gitprofile",
    title: "Portfolio Site",
    description:
      "An automatic portfolio builder that creates a portfolio from your GitHub profile.",
    imageUrl: "https://opengraph.githubassets.com/1/arifszn/gitprofile",
    githubUrl: "https://github.com/arifszn/gitprofile",
    isOfficial: false,
    category: "web",
    techStack: ["React", "Vite", "TypeScript"],
    tags: ["portfolio", "personal-site", "github"],
    features: [
      "Auto-generated from GitHub profile",
      "Project showcase",
      "Blog integration",
      "Customizable themes",
    ],
  },
  {
    id: "timlrx-tailwind-nextjs-starter-blog",
    title: "Blog Starter",
    description:
      "A feature-rich Next.js blog starter with Tailwind CSS, MDX support, and search.",
    imageUrl:
      "https://opengraph.githubassets.com/1/timlrx/tailwind-nextjs-starter-blog",
    githubUrl: "https://github.com/timlrx/tailwind-nextjs-starter-blog",
    isOfficial: false,
    category: "web",
    techStack: ["Next.js", "Tailwind", "MDX"],
    tags: ["blog", "writing", "mdx"],
    features: [
      "MDX for rich content",
      "Full-text search",
      "RSS feed generation",
      "SEO optimized",
    ],
  },
  {
    id: "shadcn-ui-taxonomy",
    title: "Admin Dashboard",
    description:
      "An open source application built with Next.js and shadcn/ui components.",
    imageUrl: "https://opengraph.githubassets.com/1/shadcn-ui/taxonomy",
    githubUrl: "https://github.com/shadcn-ui/taxonomy",
    isOfficial: false,
    category: "apps",
    techStack: ["Next.js", "Tailwind", "shadcn/ui", "TypeScript"],
    tags: ["dashboard", "admin", "app"],
    features: [
      "Authentication with NextAuth.js",
      "Dashboard layout",
      "Shadcn/ui components",
      "Dark mode support",
    ],
  },
  {
    id: "mickasmt-next-saas-stripe-starter",
    title: "SaaS Starter with Stripe",
    description:
      "A Next.js SaaS starter with authentication, Stripe billing, and admin dashboard.",
    imageUrl:
      "https://opengraph.githubassets.com/1/mickasmt/next-saas-stripe-starter",
    githubUrl: "https://github.com/mickasmt/next-saas-stripe-starter",
    isOfficial: false,
    category: "saas",
    techStack: ["Next.js", "shadcn/ui", "Stripe", "TypeScript"],
    tags: ["saas", "stripe", "billing"],
    features: [
      "Stripe subscription billing",
      "Authentication system",
      "Admin dashboard",
      "User management",
    ],
  },
  {
    id: "chatgptnextweb-chatgpt-next-web",
    title: "AI Chat App",
    description:
      "A cross-platform ChatGPT/Gemini UI with deploy-your-own capability.",
    imageUrl:
      "https://opengraph.githubassets.com/1/ChatGPTNextWeb/ChatGPT-Next-Web",
    githubUrl: "https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web",
    isOfficial: false,
    category: "saas",
    techStack: ["Next.js", "TypeScript"],
    tags: ["ai", "chatbot", "gpt"],
    features: [
      "Multiple AI model support",
      "Conversation history",
      "Markdown rendering",
      "Deploy anywhere",
    ],
  },
];
