import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCheckName } from "@/hooks/useCheckName";
import { useCreateApp } from "@/hooks/useCreateApp";
import { useDesignSystems } from "@/hooks/useDesignSystems";
import { showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { Template } from "@/shared/templates";
import { useRouter } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface CreateAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | undefined;
  initialDesignSystemId?: string;
}

export function canSubmitCreateApp(
  appName: string,
  nameExists: boolean | undefined,
  isSubmitting: boolean,
): boolean {
  return appName.trim().length > 0 && !nameExists && !isSubmitting;
}

export function CreateAppDialog({
  open,
  onOpenChange,
  template,
  initialDesignSystemId,
}: CreateAppDialogProps) {
  const { t } = useTranslation(["app", "common"]);
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);
  const [appName, setAppName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDesignSystem, setSelectedDesignSystem] = useState<string>(
    initialDesignSystemId ?? "shadcn",
  );
  const { createApp } = useCreateApp();
  const { designSystems } = useDesignSystems();
  const { data: nameCheckResult } = useCheckName(appName);
  const router = useRouter();

  useEffect(() => {
    if (initialDesignSystemId) {
      setSelectedDesignSystem(initialDesignSystemId);
    }
  }, [initialDesignSystemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmitCreateApp(appName, nameCheckResult?.exists, isSubmitting)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createApp({
        name: appName.trim(),
        templateId: template?.id,
        designSystemId: selectedDesignSystem,
      });
      setSelectedAppId(result.app.id);
      // Navigate to the new app's first chat
      router.navigate({
        to: "/chat",
        search: { id: result.chatId },
      });
      setAppName("");
      onOpenChange(false);
    } catch (error) {
      showError(error as any);
      // Error is already handled by createApp hook or shown above
      console.error("Error creating app:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = canSubmitCreateApp(
    appName,
    nameCheckResult?.exists,
    isSubmitting,
  );
  const nameExists = Boolean(nameCheckResult?.exists);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t("apps.createTitle", { ns: "app" })}</DialogTitle>
          <DialogDescription>
            {t("apps.createWithTemplate", {
              ns: "app",
              title: template?.title,
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Design System</Label>
              <ScrollArea className="h-[200px]">
                <div className="grid grid-cols-2 gap-2">
                  {designSystems.map((ds) => (
                    <button
                      key={ds.id}
                      type="button"
                      onClick={() => setSelectedDesignSystem(ds.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-left",
                        selectedDesignSystem === ds.id
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-border hover:bg-accent/50",
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-md shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${ds.colorScheme.primary}, ${ds.colorScheme.secondary})`,
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">
                          {ds.displayName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {ds.libraryName}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="appName">
                {t("labels.name", { ns: "common" })}
              </Label>
              <Input
                id="appName"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder={t("apps.enterAppName", { ns: "app" })}
                className={nameExists ? "border-red-500" : ""}
                disabled={isSubmitting}
              />
              {nameExists && (
                <p className="text-sm text-red-500">
                  {t("apps.nameExists", { ns: "app" })}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("buttons.cancel", { ns: "common" })}
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting
                ? `${t("buttons.create", { ns: "common" })}...`
                : t("apps.createApp", { ns: "app" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
