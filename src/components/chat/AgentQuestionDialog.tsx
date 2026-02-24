import { useEffect, useState } from "react";
import type { AgentQuestionRequestPayload } from "@/ipc/types";
import { Button } from "../ui/button";

interface AgentQuestionDialogProps {
  pending: AgentQuestionRequestPayload;
  onSubmit: (answers: string[][]) => void;
  onCancel: () => void;
}

export function AgentQuestionDialog({
  pending,
  onSubmit,
  onCancel,
}: AgentQuestionDialogProps) {
  // Track selections per question: Map<questionIndex, Set<optionLabel>>
  const [selections, setSelections] = useState<Map<number, Set<string>>>(
    () => new Map(),
  );

  // Auto-dismiss after 60 seconds
  useEffect(() => {
    const timer = setTimeout(onCancel, 60_000);
    return () => clearTimeout(timer);
  }, [pending.requestId, onCancel]);

  const toggleOption = (
    questionIdx: number,
    label: string,
    multiple: boolean,
  ) => {
    setSelections((prev) => {
      const next = new Map(prev);
      const current = next.get(questionIdx) ?? new Set<string>();
      if (multiple) {
        // Toggle in multi-select
        const updated = new Set(current);
        if (updated.has(label)) {
          updated.delete(label);
        } else {
          updated.add(label);
        }
        next.set(questionIdx, updated);
      } else {
        // Single select — replace
        next.set(questionIdx, new Set([label]));
      }
      return next;
    });
  };

  const handleSubmit = () => {
    const answers = pending.questions.map((_q, idx) =>
      Array.from(selections.get(idx) ?? []),
    );
    onSubmit(answers);
  };

  const hasAnySelection = Array.from(selections.values()).some(
    (s) => s.size > 0,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      />

      {/* Dialog */}
      <div className="relative bg-background border border-border rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Agent Question</h2>

          <div className="space-y-6">
            {pending.questions.map((q, qIdx) => (
              <div key={qIdx} className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  {q.header}
                </div>
                <div className="text-sm">{q.question}</div>

                <div className="space-y-1.5 mt-2">
                  {q.options.map((opt) => {
                    const isSelected =
                      selections.get(qIdx)?.has(opt.label) ?? false;
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() =>
                          toggleOption(qIdx, opt.label, q.multiple ?? false)
                        }
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-accent/50"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className={`mt-0.5 w-4 h-4 ${q.multiple ? "rounded-sm" : "rounded-full"} border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? "border-primary bg-primary"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {opt.label}
                            </div>
                            {opt.description && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {opt.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
            <Button
              onClick={handleSubmit}
              size="sm"
              disabled={!hasAnySelection}
              className="px-6"
            >
              Submit
            </Button>
            <Button
              onClick={onCancel}
              size="sm"
              variant="outline"
              className="px-6"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
