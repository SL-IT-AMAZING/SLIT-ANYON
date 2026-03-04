interface OklchComponents {
  l: number;
  c: number;
  h: number;
}

function parseOklch(oklchStr: string): OklchComponents | null {
  const match = oklchStr.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/);
  if (!match) return null;
  return {
    l: Number.parseFloat(match[1]),
    c: Number.parseFloat(match[2]),
    h: Number.parseFloat(match[3]),
  };
}

function oklchToLinearSrgb(
  l: number,
  c: number,
  h: number,
): [number, number, number] {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const lCubeRoot = l + 0.3963377774 * a + 0.2158037573 * b;
  const mCubeRoot = l - 0.1055613458 * a - 0.0638541728 * b;
  const sCubeRoot = l - 0.0894841775 * a - 1.291485548 * b;

  const lms_l = lCubeRoot * lCubeRoot * lCubeRoot;
  const lms_m = mCubeRoot * mCubeRoot * mCubeRoot;
  const lms_s = sCubeRoot * sCubeRoot * sCubeRoot;

  const r = +4.0767416621 * lms_l - 3.3077115913 * lms_m + 0.2309699292 * lms_s;
  const g = -1.2684380046 * lms_l + 2.6097574011 * lms_m - 0.3413193965 * lms_s;
  const bOut =
    -0.0041960863 * lms_l - 0.7034186147 * lms_m + 1.707614701 * lms_s;

  return [r, g, bOut];
}

function linearToSrgb(c: number): number {
  if (c <= 0.0031308) return 12.92 * c;
  return 1.055 * c ** (1 / 2.4) - 0.055;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function toHex(n: number): string {
  const byte = Math.round(clamp(n, 0, 1) * 255);
  return byte.toString(16).padStart(2, "0");
}

export function oklchToHex(oklchStr: string): string {
  const parsed = parseOklch(oklchStr);
  if (!parsed) return "#808080";

  const [rLin, gLin, bLin] = oklchToLinearSrgb(parsed.l, parsed.c, parsed.h);
  const r = linearToSrgb(rLin);
  const g = linearToSrgb(gLin);
  const b = linearToSrgb(bLin);

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export type ThemeTag =
  | "light"
  | "dark"
  | "pastel"
  | "moody"
  | "vibrant"
  | "colorful"
  | "minimal"
  | "muted"
  | "warm"
  | "cool"
  | "professional"
  | "playful";

export function generateThemeTags(cssVars: Record<string, string>): ThemeTag[] {
  const tags: ThemeTag[] = [];

  const bgColor = parseOklch(cssVars.background ?? "");
  const primaryColor = parseOklch(cssVars.primary ?? "");
  const accentColor = parseOklch(cssVars.accent ?? "");

  if (bgColor) {
    if (bgColor.l > 0.85) tags.push("light");
    if (bgColor.l < 0.3) tags.push("dark");
    if (bgColor.l > 0.9 && bgColor.c < 0.02) tags.push("minimal");
  }

  if (primaryColor) {
    if (primaryColor.c > 0.15) tags.push("vibrant");
    else if (primaryColor.c < 0.05) tags.push("muted");

    if (
      primaryColor.c > 0.03 &&
      ((primaryColor.h >= 0 && primaryColor.h <= 60) || primaryColor.h >= 300)
    ) {
      tags.push("warm");
    }
    if (
      primaryColor.c > 0.03 &&
      primaryColor.h >= 180 &&
      primaryColor.h <= 270
    ) {
      tags.push("cool");
    }
  }

  if (
    primaryColor &&
    primaryColor.l > 0.7 &&
    primaryColor.c > 0.05 &&
    primaryColor.c < 0.15
  ) {
    tags.push("pastel");
  }

  if (bgColor && bgColor.l < 0.3 && accentColor && accentColor.c > 0.1) {
    tags.push("moody");
  }

  const highChromaCount = [primaryColor, accentColor].filter(
    (c) => c && c.c > 0.12,
  ).length;
  if (highChromaCount >= 2) tags.push("colorful");

  if (bgColor && bgColor.c < 0.01 && primaryColor && primaryColor.c < 0.08) {
    tags.push("professional");
  }

  if (primaryColor && primaryColor.l > 0.6 && primaryColor.c > 0.18) {
    tags.push("playful");
  }

  return [...new Set(tags)];
}

export const ALL_THEME_TAGS: ThemeTag[] = [
  "light",
  "dark",
  "pastel",
  "vibrant",
  "minimal",
  "muted",
  "warm",
  "cool",
  "moody",
  "colorful",
  "professional",
  "playful",
];
