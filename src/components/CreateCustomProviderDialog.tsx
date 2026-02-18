import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomLanguageModelProvider } from "@/hooks/useCustomLanguageModelProvider";
import type { LanguageModelProvider } from "@/ipc/types";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface CreateCustomProviderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingProvider?: LanguageModelProvider | null;
}

export function CreateCustomProviderDialog({
  isOpen,
  onClose,
  onSuccess,
  editingProvider = null,
}: CreateCustomProviderDialogProps) {
  const { t } = useTranslation(["app", "common"]);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [envVarName, setEnvVarName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const isEditMode = Boolean(editingProvider);

  const { createProvider, editProvider, isCreating, isEditing, error } =
    useCustomLanguageModelProvider();
  // Load provider data when editing
  useEffect(() => {
    if (editingProvider && isOpen) {
      const cleanId = editingProvider.id?.startsWith("custom::")
        ? editingProvider.id.replace("custom::", "")
        : editingProvider.id || "";
      setId(cleanId);
      setName(editingProvider.name || "");
      setApiBaseUrl(editingProvider.apiBaseUrl || "");
      setEnvVarName(editingProvider.envVarName || "");
    } else if (!isOpen) {
      // Reset form when dialog closes
      setId("");
      setName("");
      setApiBaseUrl("");
      setEnvVarName("");
      setErrorMessage("");
    }
  }, [editingProvider, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      if (isEditMode && editingProvider) {
        const cleanId = editingProvider.id?.startsWith("custom::")
          ? editingProvider.id.replace("custom::", "")
          : editingProvider.id || "";
        await editProvider({
          id: cleanId,
          name: name.trim(),
          apiBaseUrl: apiBaseUrl.trim(),
          envVarName: envVarName.trim() || undefined,
        });
      } else {
        await createProvider({
          id: id.trim(),
          name: name.trim(),
          apiBaseUrl: apiBaseUrl.trim(),
          envVarName: envVarName.trim() || undefined,
        });
      }

      // Reset form
      setId("");
      setName("");
      setApiBaseUrl("");
      setEnvVarName("");

      onSuccess();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `Failed to ${isEditMode ? "edit" : "create"} custom provider`,
      );
    }
  };

  const handleClose = () => {
    if (!isCreating && !isEditing) {
      setErrorMessage("");
      onClose();
    }
  };
  const isLoading = isCreating || isEditing;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? t("customProvider.editTitle")
              : t("customProvider.title")}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? t("customProvider.editDescription")
              : t("customProvider.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="id">{t("customProvider.providerId")}</Label>
            <Input
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder={t("customProvider.idPlaceholder")}
              required
              disabled={isLoading || isEditMode}
            />
            <p className="text-xs text-muted-foreground">
              {t("customProvider.idHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t("customProvider.displayName")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("customProvider.namePlaceholder")}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {t("customProvider.nameHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiBaseUrl">{t("customProvider.apiBaseUrl")}</Label>
            <Input
              id="apiBaseUrl"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder={t("customProvider.baseUrlPlaceholder")}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {t("customProvider.apiBaseUrlHelp")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="envVarName">{t("customProvider.envVar")}</Label>
            <Input
              id="envVarName"
              value={envVarName}
              onChange={(e) => setEnvVarName(e.target.value)}
              placeholder={t("customProvider.envVarPlaceholder")}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {t("customProvider.envVarHelp")}
            </p>
          </div>

          {(errorMessage || error) && (
            <div className="text-sm text-red-500">
              {errorMessage ||
                (error instanceof Error
                  ? error.message
                  : "Failed to create custom provider")}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t("customProvider.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading
                ? isEditMode
                  ? t("customProvider.updating")
                  : t("customProvider.adding")
                : isEditMode
                  ? t("customProvider.updateButton")
                  : t("customProvider.addButton")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
