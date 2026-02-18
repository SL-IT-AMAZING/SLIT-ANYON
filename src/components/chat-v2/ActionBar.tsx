import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Check, Copy, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ActionBarProps {
  onCopy?: () => void;
  onReload?: () => void;
  showReload?: boolean;
  className?: string;
}

export function ActionBar({
  onCopy,
  onReload,
  showReload = false,
  className,
}: ActionBarProps) {
  const { t } = useTranslation("chat");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    onCopy?.();
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100",
          className,
        )}
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleCopy}
                aria-label={copied ? "Copied" : "Copy"}
              />
            }
          >
            {copied ? (
              <Check className="size-3 text-muted-foreground" />
            ) : (
              <Copy className="size-3 text-muted-foreground" />
            )}
          </TooltipTrigger>
          <TooltipContent>{copied ? "Copied" : "Copy"}</TooltipContent>
        </Tooltip>

        {showReload && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={onReload}
                  aria-label={t("actions.regenerate")}
                />
              }
            >
              <RefreshCw className="size-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>Regenerate</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
