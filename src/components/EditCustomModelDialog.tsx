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
import { useSettings } from "@/hooks/useSettings";
import { ipc } from "@/ipc/types";
import { showError, showSuccess } from "@/lib/toast";
import { useMutation } from "@tanstack/react-query";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface Model {
  apiName: string;
  displayName: string;
  description?: string;
  maxOutputTokens?: number;
  contextWindow?: number;
  type: "cloud" | "custom";
  tag?: string;
}

interface EditCustomModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  providerId: string;
  model: Model | null;
}

export function EditCustomModelDialog({
  isOpen,
  onClose,
  onSuccess,
  providerId,
  model,
}: EditCustomModelDialogProps) {
  const { t } = useTranslation(["app", "common"]);
  const [apiName, setApiName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [maxOutputTokens, setMaxOutputTokens] = useState<string>("");
  const [contextWindow, setContextWindow] = useState<string>("");
  const { settings, updateSettings } = useSettings();

  useEffect(() => {
    if (model) {
      setApiName(model.apiName);
      setDisplayName(model.displayName);
      setDescription(model.description || "");
      setMaxOutputTokens(model.maxOutputTokens?.toString() || "");
      setContextWindow(model.contextWindow?.toString() || "");
    }
  }, [model]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!model) throw new Error("No model to edit");

      const newParams = {
        apiName,
        displayName,
        providerId,
        description: description || undefined,
        maxOutputTokens: maxOutputTokens
          ? Number.parseInt(maxOutputTokens, 10)
          : undefined,
        contextWindow: contextWindow
          ? Number.parseInt(contextWindow, 10)
          : undefined,
      };

      if (!newParams.apiName) throw new Error("Model API name is required");
      if (!newParams.displayName)
        throw new Error("Model display name is required");
      if (maxOutputTokens && isNaN(newParams.maxOutputTokens ?? Number.NaN))
        throw new Error("Max Output Tokens must be a valid number");
      if (contextWindow && isNaN(newParams.contextWindow ?? Number.NaN))
        throw new Error("Context Window must be a valid number");

      // First delete the old model
      await ipc.languageModel.deleteModel({
        providerId,
        modelApiName: model.apiName,
      });

      // Then create the new model
      await ipc.languageModel.createCustomModel({
        providerId: newParams.providerId,
        displayName: newParams.displayName,
        apiName: newParams.apiName,
        description: newParams.description,
        maxOutputTokens: newParams.maxOutputTokens,
        contextWindow: newParams.contextWindow,
      });
    },
    onSuccess: async () => {
      if (
        settings?.selectedModel?.name === model?.apiName &&
        settings?.selectedModel?.provider === providerId
      ) {
        const newModel = {
          ...settings.selectedModel,
          name: apiName,
        };
        try {
          await updateSettings({ selectedModel: newModel });
        } catch {
          showError(t("customModel.updateFailed"));
          return; // stop closing dialog
        }
      }
      showSuccess(t("customModel.updated"));
      onSuccess();
      onClose();
    },
    onError: (error) => {
      showError(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      onClose();
    }
  };

  if (!model) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t("customModel.title")}</DialogTitle>
          <DialogDescription>{t("customModel.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-model-id" className="text-right">
                {t("customModel.modelId")}
              </Label>
              <Input
                id="edit-model-id"
                value={apiName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setApiName(e.target.value)
                }
                className="col-span-3"
                placeholder={t("customModel.modelIdPlaceholder")}
                required
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-model-name" className="text-right">
                {t("customModel.name")}
              </Label>
              <Input
                id="edit-model-name"
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDisplayName(e.target.value)
                }
                className="col-span-3"
                placeholder={t("customModel.namePlaceholder")}
                required
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                {t("labels.description", { ns: "common" })}
              </Label>
              <Input
                id="edit-description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDescription(e.target.value)
                }
                className="col-span-3"
                placeholder={t("customModel.descriptionPlaceholder")}
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-max-output-tokens" className="text-right">
                {t("customModel.maxOutputTokens")}
              </Label>
              <Input
                id="edit-max-output-tokens"
                type="number"
                value={maxOutputTokens}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMaxOutputTokens(e.target.value)
                }
                className="col-span-3"
                placeholder={t("customModel.maxOutputPlaceholder")}
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-context-window" className="text-right">
                {t("customModel.contextWindow")}
              </Label>
              <Input
                id="edit-context-window"
                type="number"
                value={contextWindow}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setContextWindow(e.target.value)
                }
                className="col-span-3"
                placeholder={t("customModel.contextWindowPlaceholder")}
                disabled={mutation.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              {t("customModel.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? t("customModel.updating")
                : t("customModel.updateModel")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
