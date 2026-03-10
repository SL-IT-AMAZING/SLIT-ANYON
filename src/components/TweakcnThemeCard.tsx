import { useLikedThemes } from "@/hooks/useLikedThemes";
import { ipc } from "@/ipc/types";
import type { TweakcnThemeType } from "@/ipc/types";
import type { ThemeTag } from "@/lib/color-utils";
import { generateThemeTags, oklchToHex } from "@/lib/color-utils";
import { cn } from "@/lib/utils";
import { Eye, Heart, Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

const SWATCH_KEYS = [
  "primary",
  "secondary",
  "accent",
  "muted",
  "border",
  "card",
] as const;

const MAX_VISIBLE_TAGS = 2;
const IFRAME_RENDER_WIDTH = 1280;
const THEMES_PREVIEW_COMPONENT_ID = "dashboard";

type ThemePreviewSession = {
  url: string;
  nonce: string;
};

let themesPreviewSessionPromise: Promise<ThemePreviewSession> | null = null;

function getThemePreviewSession() {
  if (!themesPreviewSessionPromise) {
    themesPreviewSessionPromise = ipc.designSystem.getPreviewUrl({
      designSystemId: "themes",
    });
  }

  return themesPreviewSessionPromise;
}

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
  onUse,
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

  const [previewSession, setPreviewSession] = useState<ThemePreviewSession | null>(
    null,
  );
  const [scale, setScale] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const swatchColors = useMemo(
    () => SWATCH_KEYS.map((key) => getColorValue(lightVars, key)),
    [lightVars],
  );

  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = Math.max(0, tags.length - MAX_VISIBLE_TAGS);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.offsetWidth;
      if (width > 0) {
        setScale(width / IFRAME_RENDER_WIDTH);
      }
    };

    updateScale();
    const observer = new ResizeObserver(() => updateScale());
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    getThemePreviewSession()
      .then((session) => {
        if (cancelled) return;
        setPreviewSession(session);
      })
      .catch(() => {
        if (cancelled) return;
        setPreviewSession(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!previewSession) return;
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;

    const targetOrigin = (() => {
      try {
        return new URL(previewSession.url).origin;
      } catch {
        return "*";
      }
    })();

    const payload = {
      type: "APPLY_THEME",
      nonce: previewSession.nonce,
      cssVars: theme.cssVars,
    };

    const navigatePayload = {
      type: "NAVIGATE_COMPONENT",
      nonce: previewSession.nonce,
      componentId: THEMES_PREVIEW_COMPONENT_ID,
    };

    iframeWindow.postMessage(payload, targetOrigin);
    iframeWindow.postMessage(navigatePayload, targetOrigin);

    const retryDelays = [120, 260, 420];
    const timeoutIds = retryDelays.map((delayMs) => {
      return window.setTimeout(() => {
        const win = iframeRef.current?.contentWindow;
        if (!win) return;
        win.postMessage(payload, targetOrigin);
        win.postMessage(navigatePayload, targetOrigin);
      }, delayMs);
    });

    return () => {
      timeoutIds.forEach((id) => window.clearTimeout(id));
    };
  }, [previewSession, theme.cssVars]);

  const iframeHeight = scale > 0 ? Math.ceil(180 / scale) : 960;

  return (
    <Card
      data-testid={`tweakcn-theme-card-${theme.id}`}
      className="overflow-hidden group hover:shadow-md transition-shadow duration-200"
    >
      <div
        ref={containerRef}
        className="relative h-[180px] w-full overflow-hidden flex items-center justify-center"
        style={{ backgroundColor: bgHex }}
      >
        {previewSession && scale > 0 ? (
          <iframe
            ref={iframeRef}
            src={previewSession.url}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            tabIndex={-1}
            title={`${theme.name} preview`}
            className="absolute top-0 left-0 border-none pointer-events-none"
            style={{
              width: `${IFRAME_RENDER_WIDTH}px`,
              height: `${iframeHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        ) : (
          <div className="flex items-center gap-1.5">
            {swatchColors.map((color, i) => (
              <div
                key={SWATCH_KEYS[i]}
                className="w-5 h-16 rounded-lg"
                style={{ backgroundColor: color }}
                title={SWATCH_KEYS[i]}
              />
            ))}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs capitalize">
                {tag}
              </Badge>
            ))}
            {overflowCount > 0 && (
              <span className="text-xs text-muted-foreground">
                +{overflowCount}
              </span>
            )}
          </div>
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

        <h3 className="text-lg font-semibold text-foreground leading-tight">
          {theme.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          tweakcn community
        </p>

        <div className="flex items-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onPreview(theme.id)}
          >
            <Eye className="mr-1 h-4 w-4" />
            Preview
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            onClick={() => onUse?.(theme.id)}
          >
            <Sparkles className="mr-1 h-4 w-4" />
            Use This
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export function TweakcnThemeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-[180px] w-full bg-accent animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-16 rounded-full bg-accent animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-accent animate-pulse" />
        </div>
        <div className="h-5 w-2/3 rounded bg-accent animate-pulse" />
        <div className="h-3.5 w-1/3 rounded bg-accent animate-pulse" />
        <div className="flex gap-2 pt-1">
          <div className="h-8 flex-1 rounded bg-accent animate-pulse" />
          <div className="h-8 flex-1 rounded bg-accent animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
