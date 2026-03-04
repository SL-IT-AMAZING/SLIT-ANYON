import themesJson from "./tweakcn-themes.json";

export interface TweakcnTheme {
  id: string;
  name: string;
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

export const TWEAKCN_THEMES: TweakcnTheme[] = themesJson as TweakcnTheme[];

export function getTweakcnThemeById(id: string): TweakcnTheme | undefined {
  return TWEAKCN_THEMES.find((t) => t.id === id);
}
