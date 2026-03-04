import type { TweakcnThemeType } from "@/ipc/types";
import { Eye, Sparkles } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

const IFRAME_RENDER_WIDTH = 1280;
const THEME_PREVIEW_ORIGIN = "anyon-preview://themes";

interface TweakcnThemeCardProps {
  theme: TweakcnThemeType;
  onPreview: (themeId: string) => void;
  onUse?: (themeId: string) => void;
}

function getThemeColor(
  theme: TweakcnThemeType,
  key: string,
  fallback: string,
): string {
  return theme.cssVars.light[key] ?? fallback;
}

export const TweakcnThemeCard: React.FC<TweakcnThemeCardProps> = ({
  theme,
  onPreview,
  onUse,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0);
  const nonce = useMemo(() => crypto.randomUUID(), []);

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

  const applyTheme = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const payload = {
      type: "APPLY_THEME",
      nonce,
      cssVars: theme.cssVars,
    };

    win.postMessage(payload, THEME_PREVIEW_ORIGIN);

    const retryDelays = [120, 260, 420];
    retryDelays.forEach((delayMs) => {
      window.setTimeout(() => {
        const iframeWin = iframeRef.current?.contentWindow;
        if (!iframeWin) return;
        iframeWin.postMessage(payload, THEME_PREVIEW_ORIGIN);
      }, delayMs);
    });
  }, [nonce, theme.cssVars]);

  const previewUrl = useMemo(() => {
    return `${THEME_PREVIEW_ORIGIN}/index.html?nonce=${encodeURIComponent(nonce)}&parentOrigin=${encodeURIComponent(window.location.origin)}`;
  }, [nonce]);
  const iframeHeight = scale > 0 ? Math.ceil(180 / scale) : 960;
  const primaryColor = getThemeColor(theme, "primary", "oklch(0.6 0.2 230)");
  const secondaryColor = getThemeColor(
    theme,
    "secondary",
    "oklch(0.75 0.12 280)",
  );

  return (
    <Card
      data-testid={`tweakcn-theme-card-${theme.id}`}
      className="overflow-hidden group hover:shadow-md transition-shadow duration-200"
    >
      <div
        ref={containerRef}
        className="relative h-[180px] w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        }}
      >
        {scale > 0 && (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            tabIndex={-1}
            title={`${theme.name} preview`}
            onLoad={applyTheme}
            className="absolute top-0 left-0 border-none pointer-events-none"
            style={{
              width: `${IFRAME_RENDER_WIDTH}px`,
              height: `${iframeHeight}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Badge variant="outline" className="text-xs capitalize">
            Themes
          </Badge>
          <span className="text-xs text-muted-foreground">
            tweakcn community
          </span>
        </div>
        <h3 className="text-lg font-semibold text-foreground leading-tight">
          {theme.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          shadcn/ui compatible
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
            disabled={!onUse}
          >
            <Sparkles className="mr-1 h-4 w-4" />
            Use This
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
