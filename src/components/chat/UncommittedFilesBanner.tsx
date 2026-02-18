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
import { useCommitChanges } from "@/hooks/useCommitChanges";
import {
  type UncommittedFile,
  useUncommittedFiles,
} from "@/hooks/useUncommittedFiles";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  FileWarning,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface UncommittedFilesBannerProps {
  appId: number | null;
}

function getStatusIcon(status: UncommittedFile["status"]) {
  switch (status) {
    case "added":
      return <Plus className="h-4 w-4 text-green-500" />;
    case "modified":
      return <Pencil className="h-4 w-4 text-yellow-500" />;
    case "deleted":
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case "renamed":
      return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
    default:
      return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStatusLabel(status: UncommittedFile["status"], t: any) {
  switch (status) {
    case "added":
      return t("git.added");
    case "modified":
      return t("git.modified");
    case "deleted":
      return t("git.deleted");
    case "renamed":
      return t("git.renamed");
    default:
      return status;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateDefaultCommitMessage(
  files: UncommittedFile[],
  t: any,
): string {
  if (files.length === 0) return "";

  const added = files.filter((f) => f.status === "added").length;
  const modified = files.filter((f) => f.status === "modified").length;
  const deleted = files.filter((f) => f.status === "deleted").length;
  const renamed = files.filter((f) => f.status === "renamed").length;

  const parts: string[] = [];
  if (added > 0) parts.push(t("git.commitAddFiles", { count: added }));
  if (modified > 0) parts.push(t("git.commitUpdateFiles", { count: modified }));
  if (deleted > 0) parts.push(t("git.commitRemoveFiles", { count: deleted }));
  if (renamed > 0) parts.push(t("git.commitRenameFiles", { count: renamed }));

  if (parts.length === 0) return t("git.updateFiles");

  // Capitalize first letter
  const message = parts.join(", ");
  return message.charAt(0).toUpperCase() + message.slice(1);
}

export function UncommittedFilesBanner({ appId }: UncommittedFilesBannerProps) {
  const { t } = useTranslation(["chat", "app", "common"]);
  const { uncommittedFiles, hasUncommittedFiles, isLoading } =
    useUncommittedFiles(appId);
  const { commitChanges, isCommitting } = useCommitChanges();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");

  if (!appId || isLoading || !hasUncommittedFiles) {
    return null;
  }

  const handleOpenDialog = () => {
    // Set default commit message only when opening the dialog
    // This prevents overwriting user's custom message during polling
    setCommitMessage(generateDefaultCommitMessage(uncommittedFiles, t));
    setIsDialogOpen(true);
  };

  const handleCommit = async () => {
    if (!appId || !commitMessage.trim()) return;

    await commitChanges({ appId, message: commitMessage.trim() });
    setIsDialogOpen(false);
    setCommitMessage("");
  };

  return (
    <>
      <div
        className="flex flex-col @sm:flex-row items-center justify-between px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
        data-testid="uncommitted-files-banner"
      >
        <div className="flex items-center gap-2 text-sm">
          <FileWarning size={16} />
          <span>
            {t("preview.youHave", { ns: "app" })}{" "}
            <strong>{uncommittedFiles.length}</strong>{" "}
            {t("preview.uncommittedLabel", {
              count: uncommittedFiles.length,
              ns: "app",
            })}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenDialog}
          data-testid="review-commit-button"
        >
          {t("preview.reviewCommit", { ns: "app" })}
        </Button>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          // Prevent closing while committing
          if (!open && isCommitting) return;
          setIsDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-lg" data-testid="commit-dialog">
          <DialogHeader>
            <DialogTitle>
              {t("preview.reviewCommitChanges", { ns: "app" })}
            </DialogTitle>
            <DialogDescription>
              {t("preview.reviewYourChanges", { ns: "app" })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="commit-message"
                className="text-sm font-medium mb-2 block"
              >
                {t("preview.commitMessage", { ns: "app" })}
              </label>
              <Input
                id="commit-message"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder={t("preview.enterCommitMessage", { ns: "app" })}
                data-testid="commit-message-input"
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">
                {t("preview.changedFiles", {
                  count: uncommittedFiles.length,
                  ns: "app",
                })}
              </p>
              <div
                className="max-h-60 overflow-y-auto rounded-md border p-2 space-y-1"
                data-testid="changed-files-list"
              >
                {uncommittedFiles.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted"
                  >
                    {getStatusIcon(file.status)}
                    <span
                      className={cn(
                        "flex-1 truncate font-mono text-xs",
                        file.status === "deleted" && "line-through opacity-60",
                      )}
                    >
                      {file.path}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        file.status === "added" &&
                          "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
                        file.status === "modified" &&
                          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
                        file.status === "deleted" &&
                          "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                        file.status === "renamed" &&
                          "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
                      )}
                    >
                      {getStatusLabel(file.status, t)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isCommitting}
            >
              {t("buttons.cancel", { ns: "common" })}
            </Button>
            <Button
              onClick={handleCommit}
              disabled={!commitMessage.trim() || isCommitting}
              data-testid="commit-button"
            >
              {isCommitting
                ? t("preview.committing", { ns: "app" })
                : t("preview.commit", { ns: "app" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
