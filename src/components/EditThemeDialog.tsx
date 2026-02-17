import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CustomTheme } from "@/ipc/types";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Edit2, Loader2, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface EditThemeDialogProps {
  theme: CustomTheme;
  onUpdateTheme: (params: {
    id: number;
    name: string;
    description?: string;
    prompt: string;
  }) => Promise<void>;
  trigger?: React.ReactNode;
}

export function EditThemeDialog({
  theme,
  onUpdateTheme,
  trigger,
}: EditThemeDialogProps) {
  const { t } = useTranslation(["app", "common"]);
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    description: "",
    prompt: "",
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea function
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const currentHeight = textarea.style.height;
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = window.innerHeight * 0.5;
      const minHeight = 150;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

      if (`${newHeight}px` !== currentHeight) {
        textarea.style.height = `${newHeight}px`;
      }
    }
  };

  // Initialize draft with theme data
  useEffect(() => {
    if (open) {
      setDraft({
        name: theme.name,
        description: theme.description || "",
        prompt: theme.prompt,
      });
    }
  }, [open, theme]);

  // Auto-resize textarea when content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [draft.prompt]);

  // Trigger resize when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(adjustTextareaHeight, 0);
    }
  }, [open]);

  const handleSave = async () => {
    if (!draft.name.trim() || !draft.prompt.trim()) return;

    setIsSaving(true);
    try {
      await onUpdateTheme({
        id: theme.id,
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        prompt: draft.prompt.trim(),
      });
      toast.success(t("library.themes.updated", { ns: "app" }));
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(t("library.themes.updateFailed", { ns: "app", message }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft({
      name: theme.name,
      description: theme.description || "",
      prompt: theme.prompt,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <DialogTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          data-testid="edit-theme-button"
          title={t("library.themes.editTooltip", { ns: "app" })}
        >
          <Edit2 className="h-4 w-4" />
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("library.themes.editTitle", { ns: "app" })}
          </DialogTitle>
          <DialogDescription>
            {t("library.themes.editDescription", { ns: "app" })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="edit-theme-name" className="text-sm font-medium">
              {t("library.themes.name", { ns: "app" })}
            </label>
            <Input
              id="edit-theme-name"
              placeholder={t("library.themes.namePlaceholder", { ns: "app" })}
              value={draft.name}
              onChange={(e) =>
                setDraft((d) => ({ ...d, name: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="edit-theme-description"
              className="text-sm font-medium"
            >
              {t("library.themes.descriptionOptional", { ns: "app" })}
            </label>
            <Input
              id="edit-theme-description"
              placeholder={t("library.themes.descriptionPlaceholder", {
                ns: "app",
              })}
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="edit-theme-prompt" className="text-sm font-medium">
              {t("library.themes.prompt", { ns: "app" })}
            </label>
            <Textarea
              id="edit-theme-prompt"
              ref={textareaRef}
              placeholder={t("library.themes.promptPlaceholder", { ns: "app" })}
              value={draft.prompt}
              onChange={(e) => {
                setDraft((d) => ({ ...d, prompt: e.target.value }));
                requestAnimationFrame(adjustTextareaHeight);
              }}
              className="resize-none overflow-y-auto font-mono text-sm"
              style={{ minHeight: "150px" }}
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            {t("buttons.cancel", { ns: "common" })}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !draft.name.trim() || !draft.prompt.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("library.themes.saving", { ns: "app" })}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("buttons.save", { ns: "common" })}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
