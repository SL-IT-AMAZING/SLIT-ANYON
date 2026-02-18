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
import { useCheckName } from "@/hooks/useCheckName";
import { useCreateApp } from "@/hooks/useCreateApp";
import type { Template } from "@/shared/templates";
import { useSetAtom } from "jotai";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useRouter } from "@tanstack/react-router";

import { showError } from "@/lib/toast";
import { Loader2 } from "lucide-react";

interface CreateAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | undefined;
}

export function CreateAppDialog({
  open,
  onOpenChange,
  template,
}: CreateAppDialogProps) {
  const { t } = useTranslation(["app", "common"]);
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);
  const [appName, setAppName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createApp } = useCreateApp();
  const { data: nameCheckResult } = useCheckName(appName);
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appName.trim()) {
      return;
    }

    if (nameCheckResult?.exists) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createApp({
        name: appName.trim(),
        templateId: template?.id,
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

  const isNameValid = appName.trim().length > 0;
  const nameExists = nameCheckResult?.exists;
  const canSubmit = isNameValid && !nameExists && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
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
