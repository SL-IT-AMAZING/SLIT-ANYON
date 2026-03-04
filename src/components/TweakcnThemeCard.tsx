import { useLikedThemes } from "@/hooks/useLikedThemes";
import type { TweakcnThemeType } from "@/ipc/types";
import type { ThemeTag } from "@/lib/color-utils";
import { generateThemeTags, oklchToHex } from "@/lib/color-utils";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import type React from "react";
import { useMemo } from "react";

const SWATCH_KEYS = [
  "primary",
  "secondary",
  "accent",
  "muted",
  "border",
  "card",
] as const;

const MAX_VISIBLE_TAGS = 2;

interface TweakcnThemeCardProps {
  theme: TweakcnThemeType;
  onPreview: (themeId: string) => void;
  onUse?: (themeId: string) => void;
}

function getColorValue(cssVars: Record<string, string>, key: string): string {
  const raw = cssVars[key];
  if (!raw) return "#808080";
  if (raw.startsWith("oklch(")) return oklchToHex(raw);
  return raw;
}

export const TweakcnThemeCard: React.FC<TweakcnThemeCardProps> = ({
  theme,
  onPreview,
}) => {
  const { isLiked, toggleLike } = useLikedThemes();
  const lightVars = theme.cssVars.light;

  const tags = useMemo<ThemeTag[]>(
    () => generateThemeTags(lightVars),
    [lightVars],
  );

  const bgHex = useMemo(
    () => getColorValue(lightVars, "background"),
    [lightVars],
  );

  const fgHex = useMemo(
    () => getColorValue(lightVars, "foreground"),
    [lightVars],
  );

  const swatchColors = useMemo(
    () => SWATCH_KEYS.map((key) => getColorValue(lightVars, key)),
    [lightVars],
  );

  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = Math.max(0, tags.length - MAX_VISIBLE_TAGS);

  return (
    <button
      type="button"
      data-testid={`tweakcn-theme-card-${theme.id}`}
      className="group cursor-pointer text-left w-full"
      onClick={() => onPreview(theme.id)}
    >
      <div
        className={cn(
          "relative rounded-xl border border-border shadow-sm overflow-hidden h-44",
          "transition-all duration-200",
          "group-hover:shadow-md group-hover:border-foreground/20",
        )}
        style={{ backgroundColor: bgHex }}
      >
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-background/80 backdrop-blur-sm text-foreground/80 capitalize"
            >
              {tag}
            </span>
          ))}
          {overflowCount > 0 && (
            <span className="px-1.5 py-0.5 text-[11px] font-medium rounded-full bg-background/80 backdrop-blur-sm text-foreground/60">
              +{overflowCount}
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-0.5 z-10">
          {swatchColors.map((color, i) => (
            <div
              key={SWATCH_KEYS[i]}
              className="w-3 h-12 rounded-full first:rounded-l-md last:rounded-r-md"
              style={{ backgroundColor: color }}
              title={SWATCH_KEYS[i]}
            />
          ))}
        </div>

        <div className="absolute bottom-3 left-4 right-4 z-10">
          <h3
            className="text-xl font-bold leading-tight truncate"
            style={{ color: fgHex }}
          >
            {theme.name}
          </h3>
        </div>
      </div>

      <div className="flex items-center justify-between px-1 pt-2 pb-1">
        <span className="text-xs text-muted-foreground truncate">
          tweakcn community
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleLike(theme.id);
          }}
          className="p-1 rounded-md hover:bg-accent transition-colors shrink-0"
        >
          <Heart
            className={cn(
              "h-3.5 w-3.5 transition-colors",
              isLiked(theme.id)
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground hover:text-foreground",
            )}
          />
        </button>
      </div>
    </button>
  );
};

export function TweakcnThemeCardSkeleton() {
  return (
    <div>
      <div className="rounded-xl h-44 bg-accent animate-pulse" />
      <div className="px-1 pt-2 space-y-1.5">
        <div className="h-3.5 w-2/3 rounded bg-accent animate-pulse" />
        <div className="h-3 w-1/3 rounded bg-accent animate-pulse" />
      </div>
    </div>
  );
}
