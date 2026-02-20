import { CreateAppDialog } from "@/components/CreateAppDialog";
import { CustomThemeDialog } from "@/components/CustomThemeDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DesignSystemGallery } from "@/components/DesignSystemGallery";
import { DesignSystemPreviewDialog } from "@/components/DesignSystemPreviewDialog";
import { EditThemeDialog } from "@/components/EditThemeDialog";
import { LibraryList } from "@/components/LibraryList";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCustomThemes,
  useDeleteCustomTheme,
  useUpdateCustomTheme,
} from "@/hooks/useCustomThemes";
import type { CustomTheme } from "@/ipc/types";
import { showError } from "@/lib/toast";
import { Blocks, Palette, Plus } from "lucide-react";
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
    <div className="flex h-full w-full">
      <aside className="w-56 shrink-0 border-r border-border bg-card overflow-y-auto">
        <LibraryList />
      </aside>

      <div className="flex-1 min-w-0 px-8 py-6 overflow-y-auto">
        <h1 className="text-3xl font-bold mb-5">
          <Palette className="inline-block h-8 w-8 mr-2" />
          {t("library.themes.title", { ns: "app" })}
        </h1>

        <Tabs defaultValue="design-systems" className="w-full">
          <TabsList>
            <TabsTrigger value="design-systems">
              <Blocks className="size-4" />
              Design Systems
            </TabsTrigger>
            <TabsTrigger value="custom-themes">
              <Palette className="size-4" />
              Custom Themes
              {customThemes.length > 0 && (
                <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px] font-medium leading-none">
                  {customThemes.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design-systems">
            <DesignSystemGallery
              onPreview={(id) => setPreviewDesignSystemId(id)}
              onUse={(id) => setCreateWithDesignSystem(id)}
            />
          </TabsContent>

          <TabsContent value="custom-themes">
            <div className="flex items-center justify-between mb-6 w-full">
              <div>
                <h2 className="text-2xl font-bold">Custom Themes</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Create your own theme prompts for AI-generated apps
                </p>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("library.themes.new", { ns: "app" })}
              </Button>
            </div>

            {isLoading ? (
              <div>{t("labels.loading", { ns: "common" })}</div>
            ) : customThemes.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center py-16 text-center">
                <Palette className="size-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  {t("library.themes.empty", { ns: "app" })}
                </p>
                <p className="text-sm text-muted-foreground/70 mb-6 max-w-md">
                  Custom themes let you define styling rules that AI follows
                  when generating your app's UI.
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("library.themes.new", { ns: "app" })}
                </Button>
              </div>
            ) : (
              <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
                {customThemes.map((theme) => (
                  <ThemeCard key={theme.id} theme={theme} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

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
