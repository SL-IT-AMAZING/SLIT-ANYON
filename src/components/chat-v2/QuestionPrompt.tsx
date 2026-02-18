import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";

export interface QuestionOption {
  label: string;
  description?: string;
}

export interface Question {
  question: string;
  header?: string;
  options: QuestionOption[];
  multiple?: boolean;
}

export interface QuestionPromptProps {
  questions: Question[];
  onSubmit: (answers: string[][]) => void;
  onDismiss?: () => void;
  className?: string;
}

export function QuestionPrompt({
  questions,
  onSubmit,
  onDismiss,
  className,
}: QuestionPromptProps) {
  const { t } = useTranslation("common");
  const [tab, setTab] = useState(0);
  const [answers, setAnswers] = useState<string[][]>(() =>
    questions.map(() => []),
  );
  const [customInputs, setCustomInputs] = useState<string[]>(() =>
    questions.map(() => ""),
  );
  const [editing, setEditing] = useState(false);

  const isMultiQuestion = questions.length > 1;
  const isConfirm = isMultiQuestion && tab === questions.length;
  const currentQuestion = isConfirm ? undefined : questions[tab];
  const multi = currentQuestion?.multiple ?? false;

  function goToTab(index: number) {
    setTab(index);
    setEditing(false);
  }

  function pickOption(questionIndex: number, label: string) {
    const updated = [...answers];
    const current = updated[questionIndex];

    if (multi) {
      if (current.includes(label)) {
        updated[questionIndex] = current.filter((l) => l !== label);
      } else {
        updated[questionIndex] = [...current, label];
      }
      setAnswers(updated);
    } else {
      updated[questionIndex] = [label];
      setAnswers(updated);

      if (!isMultiQuestion) {
        onSubmit(updated);
      } else {
        goToTab(Math.min(questionIndex + 1, questions.length));
      }
    }
  }

  function handleCustomSubmit(e: FormEvent) {
    e.preventDefault();
    const value = customInputs[tab]?.trim();
    if (!value) return;

    if (multi) {
      const updated = [...answers];
      if (!updated[tab].includes(value)) {
        updated[tab] = [...updated[tab], value];
      }
      setAnswers(updated);
      const newInputs = [...customInputs];
      newInputs[tab] = "";
      setCustomInputs(newInputs);
      setEditing(false);
    } else {
      const updated = [...answers];
      updated[tab] = [value];
      setAnswers(updated);

      if (!isMultiQuestion) {
        onSubmit(updated);
      } else {
        goToTab(Math.min(tab + 1, questions.length));
      }
    }
  }

  function cancelEdit() {
    setEditing(false);
    const newInputs = [...customInputs];
    newInputs[tab] = "";
    setCustomInputs(newInputs);
  }

  function nextTab() {
    if (isMultiQuestion) {
      goToTab(Math.min(tab + 1, questions.length));
    } else {
      onSubmit(answers);
    }
  }

  function submit() {
    onSubmit(answers);
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/10 p-4 space-y-4",
        className,
      )}
    >
      {isMultiQuestion && (
        <div className="flex gap-1 border-b border-border/50 pb-2">
          {questions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToTab(i)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-t transition-colors relative",
                i === tab
                  ? "bg-background text-foreground border border-b-0 border-border -mb-px"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {q.header || `Q${i + 1}`}
              {answers[i].length > 0 && i !== tab && (
                <span className="absolute top-1 right-1 size-1.5 rounded-full bg-foreground/40" />
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => goToTab(questions.length)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-t transition-colors",
              tab === questions.length
                ? "bg-background text-foreground border border-b-0 border-border -mb-px"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Confirm
          </button>
        </div>
      )}

      {!isConfirm && currentQuestion && (
        <div>
          <p className="text-sm text-foreground mb-3">
            {currentQuestion.question}
            {multi && " (select all that apply)"}
          </p>
          <div className="space-y-1.5">
            {currentQuestion.options.map((opt) => {
              const picked = answers[tab]?.includes(opt.label) ?? false;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => pickOption(tab, opt.label)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md border transition-colors relative",
                    picked
                      ? "border-foreground/30 bg-muted/30"
                      : "border-border hover:bg-muted/20",
                  )}
                >
                  <span className="text-sm text-foreground">{opt.label}</span>
                  {opt.description && (
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      {opt.description}
                    </span>
                  )}
                  {picked && (
                    <Check className="size-4 text-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </button>
              );
            })}

            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="w-full text-left px-3 py-2 rounded-md border border-dashed border-border hover:bg-muted/20 transition-colors"
              >
                <span className="text-sm text-muted-foreground">
                  Type your own answer
                </span>
              </button>
            )}

            {editing && (
              <form className="flex gap-2 mt-2" onSubmit={handleCustomSubmit}>
                <input
                  autoFocus
                  className="flex-1 px-3 py-1.5 text-sm rounded-md border border-border bg-background outline-none focus:border-foreground/50"
                  placeholder={t("placeholders.typeYourAnswer")}
                  value={customInputs[tab]}
                  onChange={(e) => {
                    const newInputs = [...customInputs];
                    newInputs[tab] = e.target.value;
                    setCustomInputs(newInputs);
                  }}
                />
                <Button variant="outline" size="sm" type="submit">
                  {multi ? "Add" : "Submit"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {isConfirm && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Review your answers
          </p>
          {questions.map((q, i) => {
            const answered = answers[i].length > 0;
            const value = answers[i].join(", ");
            return (
              <button
                key={i}
                type="button"
                className="w-full flex justify-between text-sm py-1.5 hover:bg-muted/20 rounded px-2 -mx-2 transition-colors"
                onClick={() => goToTab(i)}
              >
                <span className="text-muted-foreground truncate">
                  {q.question}
                </span>
                <span
                  className={
                    answered
                      ? "text-foreground"
                      : "text-muted-foreground/50 italic"
                  }
                >
                  {answered ? value : "(not answered)"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 justify-end pt-2 border-t border-border/50">
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
        {isConfirm && (
          <Button variant="default" size="sm" onClick={submit}>
            Submit
          </Button>
        )}
        {multi && !isConfirm && (
          <Button
            variant="outline"
            size="sm"
            onClick={nextTab}
            disabled={answers[tab]?.length === 0}
          >
            {isMultiQuestion ? "Next" : "Submit"}
          </Button>
        )}
      </div>
    </div>
  );
}
