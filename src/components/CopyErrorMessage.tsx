import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyErrorMessageProps {
  errorMessage: string;
  className?: string;
}

export const CopyErrorMessage = ({
  errorMessage,
  className = "",
}: CopyErrorMessageProps) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(errorMessage);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error message:", err);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              isCopied
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                : "bg-muted text-muted-foreground hover:bg-accent"
            } ${className}`}
          />
        }
      >
        {isCopied ? (
          <>
            <Check size={14} />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy size={14} />
            <span>Copy</span>
          </>
        )}
      </TooltipTrigger>
      <TooltipContent>
        {isCopied ? "Copied!" : "Copy error message"}
      </TooltipContent>
    </Tooltip>
  );
};
