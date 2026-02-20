export interface TemplateCategory {
  id: string;
  label: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  path: string;
  techStack?: string[];
  tags?: string[];
  features?: string[];
  longDescription?: string;
  screenshots?: string[];
}

export interface TemplateRegistry {
  version: number;
  categories: TemplateCategory[];
  templates: Template[];
}

export const DEFAULT_TEMPLATE_ID = "react";
export type ScaffoldId = "react" | "next";
