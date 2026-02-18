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
import { ipc } from "@/ipc/types";
import { showError, showSuccess } from "@/lib/toast";
import { useMutation } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface CreateCustomModelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  providerId: string;
}

export function CreateCustomModelDialog({
  isOpen,
  onClose,
  onSuccess,
  providerId,
}: CreateCustomModelDialogProps) {
  const { t } = useTranslation(["app", "common"]);
  const [apiName, setApiName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [maxOutputTokens, setMaxOutputTokens] = useState<string>("");
  const [contextWindow, setContextWindow] = useState<string>("");

  const mutation = useMutation({
    mutationFn: async () => {
      const params = {
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

      if (!params.apiName) throw new Error("Model API name is required");
      if (!params.displayName)
        throw new Error("Model display name is required");
      if (maxOutputTokens && isNaN(params.maxOutputTokens ?? Number.NaN))
        throw new Error("Max Output Tokens must be a valid number");
      if (contextWindow && isNaN(params.contextWindow ?? Number.NaN))
        throw new Error("Context Window must be a valid number");

      await ipc.languageModel.createCustomModel({
        providerId: params.providerId,
        displayName: params.displayName,
        apiName: params.apiName,
        description: params.description,
        maxOutputTokens: params.maxOutputTokens,
        contextWindow: params.contextWindow,
      });
    },
    onSuccess: () => {
      showSuccess(t("customModel.created", { ns: "app" }));
      resetForm();
      onSuccess(); // Refetch or update UI
      onClose();
    },
    onError: (error) => {
      showError(error);
    },
  });

  const resetForm = () => {
    setApiName("");
    setDisplayName("");
    setDescription("");
    setMaxOutputTokens("");
    setContextWindow("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{t("customModel.addTitle", { ns: "app" })}</DialogTitle>
          <DialogDescription>
            {t("customModel.description", { ns: "app" })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model-id" className="text-right">
                {t("customModel.modelId", { ns: "app" })}*
              </Label>
              <Input
                id="model-id"
                value={apiName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setApiName(e.target.value)
                }
                className="col-span-3"
                placeholder={t("customModel.modelIdPlaceholder", { ns: "app" })}
                required
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model-name" className="text-right">
                {t("labels.name", { ns: "common" })}*
              </Label>
              <Input
                id="model-name"
                value={displayName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDisplayName(e.target.value)
                }
                className="col-span-3"
                placeholder={t("customModel.displayNamePlaceholder", {
                  ns: "app",
                })}
                required
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                {t("labels.description", { ns: "common" })}
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDescription(e.target.value)
                }
                className="col-span-3"
                placeholder={t("customModel.descriptionPlaceholder", {
                  ns: "app",
                })}
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max-output-tokens" className="text-right">
                {t("customModel.maxOutputTokens", { ns: "app" })}
              </Label>
              <Input
                id="max-output-tokens"
                type="number"
                value={maxOutputTokens}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMaxOutputTokens(e.target.value)
                }
                className="col-span-3"
                placeholder={t("customModel.maxOutputPlaceholder", {
                  ns: "app",
                })}
                disabled={mutation.isPending}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="context-window" className="text-right">
                {t("customModel.contextWindow", { ns: "app" })}
              </Label>
              <Input
                id="context-window"
                type="number"
                value={contextWindow}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setContextWindow(e.target.value)
                }
                className="col-span-3"
                placeholder={t("customModel.contextWindowPlaceholder", {
                  ns: "app",
                })}
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
              {t("buttons.cancel", { ns: "common" })}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? `${t("buttons.add", { ns: "common" })}...`
                : t("customModel.addModel", { ns: "app" })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
