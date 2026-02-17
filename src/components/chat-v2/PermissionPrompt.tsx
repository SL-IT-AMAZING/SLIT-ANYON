import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PermissionPromptProps {
  onAllowOnce: () => void;
  onAllowAlways: () => void;
  onDeny: () => void;
  className?: string;
}

export function PermissionPrompt({
  onAllowOnce,
  onAllowAlways,
  onDeny,
  className,
}: PermissionPromptProps) {
  return (
    <div className={cn("flex items-center gap-2 justify-end py-2", className)}>
      <Button variant="ghost" size="sm" onClick={onDeny}>
        Deny
      </Button>
      <Button variant="outline" size="sm" onClick={onAllowAlways}>
        Allow always
      </Button>
      <Button variant="default" size="sm" onClick={onAllowOnce}>
        Allow once
      </Button>
    </div>
  );
}
