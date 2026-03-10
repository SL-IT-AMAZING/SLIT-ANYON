import { Button } from "@/components/ui/button";
import { usePlanningArtifactList } from "@/hooks/usePlanningArtifactList";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { useState } from "react";
import { MarkdownContent } from "../chat-v2/MarkdownContent";

function getStatusClasses(status: string) {
  if (status === "approved") {
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  }
  if (status === "active") {
    return "bg-blue-500/10 text-blue-700 border-blue-500/20";
  }
  return "bg-amber-500/10 text-amber-700 border-amber-500/20";
}

export function PlanningArtifactPanel() {
  const { artifacts, hasArtifacts } = usePlanningArtifactList();
  const [selectedKey, setSelectedKey] = useState<string | null>(
    artifacts[0]?.key ?? null,
  );

  if (!hasArtifacts) {
    return null;
  }

  const selectedArtifact =
    artifacts.find((artifact) => artifact?.key === selectedKey) ?? artifacts[0];

  return (
    <div className="mx-4 mb-2 rounded-lg border border-border/60 bg-muted/20">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Builder Artifacts</span>
      </div>

      <div className="flex flex-wrap gap-2 px-3 py-2">
        {artifacts.map((artifact) => {
          if (!artifact) return null;

          return (
            <Button
              key={artifact.key}
              variant={artifact.key === selectedArtifact?.key ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedKey(artifact.key)}
              className="h-7"
            >
              {artifact.label}
            </Button>
          );
        })}
      </div>

      {selectedArtifact && (
        <div className="border-t border-border/60 px-3 py-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{selectedArtifact.title}</div>
              <div className="text-xs text-muted-foreground">{selectedArtifact.label}</div>
            </div>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
                getStatusClasses(selectedArtifact.status),
              )}
            >
              {selectedArtifact.status}
            </span>
          </div>

          <MarkdownContent
            content={selectedArtifact.content}
            className="max-h-64 overflow-y-auto text-sm"
          />
        </div>
      )}
    </div>
  );
}
