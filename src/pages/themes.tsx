import { CreateAppDialog } from "@/components/CreateAppDialog";
import { CustomThemeDialog } from "@/components/CustomThemeDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DesignSystemGallery } from "@/components/DesignSystemGallery";
import { DesignSystemPreviewDialog } from "@/components/DesignSystemPreviewDialog";
import { EditThemeDialog } from "@/components/EditThemeDialog";
import { LibraryList } from "@/components/LibraryList";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  useCustomThemes,
  useDeleteCustomTheme,
  useUpdateCustomTheme,
} from "@/hooks/useCustomThemes";
import type { CustomTheme } from "@/ipc/types";
import { showError } from "@/lib/toast";
import { Palette, Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ThemesPage() {
  const { t } = useTranslation(["app", "common"]);
  const { customThemes, isLoading } = useCustomThemes();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewDesignSystemId, setPreviewDesignSystemId] = useState<
    string | null
  >(null);
  const [createWithDesignSystem, setCreateWithDesignSystem] = useState<
    string | null
  >(null);

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-card">
        <LibraryList />
      </aside>

      <div className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="max-w-5xl">
          <h1 className="text-3xl font-bold mb-6">
            <Palette className="inline-block h-8 w-8 mr-2" />
            {t("library.themes.title", { ns: "app" })}
          </h1>

          <DesignSystemGallery
            onPreview={(id) => setPreviewDesignSystemId(id)}
            onUse={(id) => setCreateWithDesignSystem(id)}
          />

          <Separator className="my-8" />

          {/* Custom Themes */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Custom Themes</h2>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("library.themes.new", { ns: "app" })}
            </Button>
          </div>

          {isLoading ? (
            <div>{t("labels.loading", { ns: "common" })}</div>
          ) : customThemes.length === 0 ? (
            <div className="text-muted-foreground">
              {t("library.themes.empty", { ns: "app" })}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
              {customThemes.map((theme) => (
                <ThemeCard key={theme.id} theme={theme} />
              ))}
            </div>
          )}

          <CustomThemeDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
          />

          <DesignSystemPreviewDialog
            designSystemId={previewDesignSystemId}
            open={previewDesignSystemId !== null}
            onOpenChange={(open) => {
              if (!open) setPreviewDesignSystemId(null);
            }}
            onUseDesignSystem={(id) => {
              setPreviewDesignSystemId(null);
              setCreateWithDesignSystem(id);
            }}
          />

          <CreateAppDialog
            open={createWithDesignSystem !== null}
            onOpenChange={(open) => {
              if (!open) setCreateWithDesignSystem(null);
            }}
            template={undefined}
            initialDesignSystemId={createWithDesignSystem ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}

function ThemeCard({ theme }: { theme: CustomTheme }) {
  const { t } = useTranslation("app");
  const updateThemeMutation = useUpdateCustomTheme();
  const deleteThemeMutation = useDeleteCustomTheme();
  const isDeleting = deleteThemeMutation.isPending;

  const handleUpdate = async (params: {
    id: number;
    name: string;
    description?: string;
    prompt: string;
  }) => {
    await updateThemeMutation.mutateAsync(params);
  };

  const handleDelete = async () => {
    try {
      await deleteThemeMutation.mutateAsync(theme.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showError(t("library.themes.deleteFailed", { message }));
    }
  };

  return (
    <div
      data-testid="theme-card"
      className="border rounded-lg p-4 bg-(--background-lightest)"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground shrink-0" />
              <h3 className="text-lg font-semibold truncate">{theme.name}</h3>
            </div>
            {theme.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {theme.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 shrink-0 ml-2">
            <EditThemeDialog theme={theme} onUpdateTheme={handleUpdate} />
            <DeleteConfirmationDialog
              itemName={theme.name}
              itemType={t("library.themes.itemType")}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          </div>
        </div>
        <pre className="text-sm whitespace-pre-wrap bg-transparent border rounded p-2 max-h-48 overflow-auto">
          {theme.prompt}
        </pre>
      </div>
    </div>
  );
}
