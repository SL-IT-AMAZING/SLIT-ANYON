import { buttonVariants } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PanelLeft } from "lucide-react";

export function SidebarToggle({ className }: { className?: string }) {
  const { toggleSidebar, open } = useSidebar();

  return (
    <Tooltip>
      <TooltipTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "cursor-pointer size-8 text-muted-foreground hover:text-foreground",
          className,
        )}
        onClick={toggleSidebar}
        aria-label={open ? "Close sidebar" : "Open sidebar"}
      >
        <PanelLeft className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start">
        {open ? "Close sidebar" : "Open sidebar"} (⌘B)
      </TooltipContent>
    </Tooltip>
  );
}
