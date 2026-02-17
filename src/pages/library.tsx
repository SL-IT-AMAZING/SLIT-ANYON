import {
  CreateOrEditPromptDialog,
  CreatePromptDialog,
} from "@/components/CreatePromptDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { LibraryList } from "@/components/LibraryList";
import { useDeepLink } from "@/contexts/DeepLinkContext";
import { usePrompts } from "@/hooks/usePrompts";
import type { AddPromptDeepLinkData } from "@/ipc/deep_link_data";
import { showInfo } from "@/lib/toast";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function LibraryPage() {
  const { t } = useTranslation(["app", "common"]);
  const { prompts, isLoading, createPrompt, updatePrompt, deletePrompt } =
    usePrompts();
  const { lastDeepLink, clearLastDeepLink } = useDeepLink();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefillData, setPrefillData] = useState<
    | {
        title: string;
        description: string;
        content: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    const handleDeepLink = async () => {
      if (lastDeepLink?.type === "add-prompt") {
        const deepLink = lastDeepLink as unknown as AddPromptDeepLinkData;
        const payload = deepLink.payload;
        showInfo(t("library.prompts.prefilled", { title: payload.title }));
        setPrefillData({
          title: payload.title,
          description: payload.description,
          content: payload.content,
        });
        setDialogOpen(true);
        clearLastDeepLink();
      }
    };
    handleDeepLink();
  }, [lastDeepLink?.timestamp, clearLastDeepLink]);

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Clear prefill data when dialog closes
      setPrefillData(undefined);
    }
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-card">
        <LibraryList />
      </aside>

      <div className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold mr-4">
              {t("library.prompts.title")}
            </h1>
            <CreatePromptDialog
              onCreatePrompt={createPrompt}
              prefillData={prefillData}
              isOpen={dialogOpen}
              onOpenChange={handleDialogClose}
            />
          </div>

          {isLoading ? (
            <div>{t("labels.loading", { ns: "common" })}</div>
          ) : prompts.length === 0 ? (
            <div className="text-muted-foreground">
              {t("library.prompts.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {prompts.map((p) => (
                <PromptCard
                  key={p.id}
                  prompt={p}
                  onUpdate={updatePrompt}
                  onDelete={deletePrompt}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PromptCard({
  prompt,
  onUpdate,
  onDelete,
}: {
  prompt: {
    id: number;
    title: string;
    description: string | null;
    content: string;
  };
  onUpdate: (p: {
    id: number;
    title: string;
    description?: string;
    content: string;
  }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const { t } = useTranslation("app");
  return (
    <div
      data-testid="prompt-card"
      className="border rounded-lg p-4 bg-(--background-lightest) min-w-80"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{prompt.title}</h3>
            {prompt.description && (
              <p className="text-sm text-muted-foreground">
                {prompt.description}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <CreateOrEditPromptDialog
              mode="edit"
              prompt={prompt}
              onUpdatePrompt={onUpdate}
            />
            <DeleteConfirmationDialog
              itemName={prompt.title}
              itemType={t("library.prompts.itemType")}
              onDelete={() => onDelete(prompt.id)}
            />
          </div>
        </div>
        <pre className="text-sm whitespace-pre-wrap bg-transparent border rounded p-2 max-h-48 overflow-auto">
          {prompt.content}
        </pre>
      </div>
    </div>
  );
}
