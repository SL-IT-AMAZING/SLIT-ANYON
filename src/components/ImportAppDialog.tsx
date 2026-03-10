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
import { ipc } from "@/ipc/types";
import { showError, showSuccess } from "@/lib/toast";
import { useMutation } from "@tanstack/react-query";
import { Folder, Info, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useStreamChat } from "@/hooks/useStreamChat";
import type { GithubRepository } from "@/ipc/types";
import { useNavigate } from "@tanstack/react-router";

import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { UnconnectedGitHubConnector } from "@/components/GitHubConnector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoadApps } from "@/hooks/useLoadApps";
import { useSettings } from "@/hooks/useSettings";
import { getErrorMessage } from "@/lib/error";
import {
  areImportCommandsValid,
  extractRepoNameFromUrl,
} from "@/lib/importValidation";
import { useSetAtom } from "jotai";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

interface ImportAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
}
export const AI_RULES_PROMPT =
  "Generate an AI_RULES.md file for this app. Describe the tech stack in 5-10 bullet points and describe clear rules about what libraries to use for what.";
export function ImportAppDialog({ isOpen, onClose }: ImportAppDialogProps) {
  const { t } = useTranslation("app");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [hasAiRules, setHasAiRules] = useState<boolean | null>(null);
  const [customAppName, setCustomAppName] = useState<string>("");
  const [nameExists, setNameExists] = useState<boolean>(false);
  const [isCheckingName, setIsCheckingName] = useState<boolean>(false);
  const [installCommand, setInstallCommand] = useState("");
  const [startCommand, setStartCommand] = useState("");
  const [copyToAnyonApps, setCopyToAnyonApps] = useState(true);
  const navigate = useNavigate();
  const { streamMessage } = useStreamChat({ hasChatId: false });
  const { refreshApps } = useLoadApps();
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);
  // GitHub import state
  const [repos, setRepos] = useState<GithubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const { settings, refreshSettings } = useSettings();
  const isAuthenticated = !!settings?.githubAccessToken;

  const [githubAppName, setGithubAppName] = useState("");
  const [githubNameExists, setGithubNameExists] = useState(false);
  const [isCheckingGithubName, setIsCheckingGithubName] = useState(false);
  const localNameCheckSeqRef = useRef(0);
  const githubNameCheckSeqRef = useRef(0);
  const fetchReposSeqRef = useRef(0);
  const selectFolderSeqRef = useRef(0);
  const importFromUrlSeqRef = useRef(0);
  const selectRepoSeqRef = useRef(0);
  useEffect(() => {
    if (isOpen) {
      setSelectedPath(null);
      setHasAiRules(null);
      setCustomAppName("");
      setNameExists(false);
      setInstallCommand("");
      setStartCommand("");
      setCopyToAnyonApps(true);
      setUrl("");
      setGithubAppName("");
      setGithubNameExists(false);
      setIsCheckingGithubName(false);
      setIsCheckingName(false);
      localNameCheckSeqRef.current = 0;
      githubNameCheckSeqRef.current = 0;
      selectFolderSeqRef.current = 0;
      importFromUrlSeqRef.current = 0;
      selectRepoSeqRef.current = 0;
      // Fetch GitHub repos if authenticated
      if (isAuthenticated) {
        fetchRepos();
      }
    } else {
      fetchReposSeqRef.current += 1;
      localNameCheckSeqRef.current = 0;
      githubNameCheckSeqRef.current = 0;
      selectFolderSeqRef.current += 1;
      importFromUrlSeqRef.current += 1;
      selectRepoSeqRef.current += 1;
    }
  }, [isOpen, isAuthenticated]);

  const fetchRepos = async () => {
    const fetchSeq = ++fetchReposSeqRef.current;
    setLoading(true);
    try {
      const fetchedRepos = await ipc.github.listRepos();
      if (fetchSeq === fetchReposSeqRef.current) {
        setRepos(fetchedRepos);
      }
    } catch (err: unknown) {
      if (fetchSeq === fetchReposSeqRef.current) {
        showError(
          t("import.fetchReposFailed", { message: getErrorMessage(err) }),
        );
      }
    } finally {
      if (fetchSeq === fetchReposSeqRef.current) {
        setLoading(false);
      }
    }
  };
  const handleUrlBlur = async () => {
    if (!url.trim()) {
      githubNameCheckSeqRef.current += 1;
      setGithubAppName("");
      setGithubNameExists(false);
      setIsCheckingGithubName(false);
      return;
    }
    const repoName = extractRepoNameFromUrl(url);
    if (repoName) {
      const checkSeq = ++githubNameCheckSeqRef.current;
      setGithubAppName(repoName);
      setIsCheckingGithubName(true);
      try {
        const result = await ipc.import.checkAppName({
          appName: repoName,
        });
        if (checkSeq === githubNameCheckSeqRef.current) {
          setGithubNameExists(result.exists);
        }
      } catch (error: unknown) {
        if (checkSeq === githubNameCheckSeqRef.current) {
          showError(
            t("import.checkNameFailed", { message: getErrorMessage(error) }),
          );
        }
      } finally {
        if (checkSeq === githubNameCheckSeqRef.current) {
          setIsCheckingGithubName(false);
        }
      }
    } else {
      githubNameCheckSeqRef.current += 1;
      setGithubAppName("");
      setGithubNameExists(false);
      setIsCheckingGithubName(false);
    }
  };
  const handleImportFromUrl = async () => {
    if (importing || isCheckingGithubName || githubNameExists) {
      return;
    }
    const importSeq = ++importFromUrlSeqRef.current;
    setImporting(true);
    try {
      const normalizedUrl = url.trim();
      const repoName = extractRepoNameFromUrl(normalizedUrl) ?? "";
      const appName = githubAppName.trim() || repoName;
      const result = await ipc.github.cloneRepoFromUrl({
        url: normalizedUrl,
        installCommand: installCommand.trim() || undefined,
        startCommand: startCommand.trim() || undefined,
        appName,
      });
      if (importSeq !== importFromUrlSeqRef.current) {
        return;
      }
      setSelectedAppId(result.app.id);
      showSuccess(t("import.success", { name: result.app.name }));
      const chatId = await ipc.chat.createChat(result.app.id);
      navigate({ to: "/chat", search: { id: chatId } });
      if (!result.hasAiRules) {
        streamMessage({
          prompt: AI_RULES_PROMPT,
          chatId,
        });
      }
      onClose();
    } catch (error: unknown) {
      showError(
        t("import.importFailed", { message: getErrorMessage(error) }),
      );
    } finally {
      setImporting(false);
    }
  };

  const handleSelectRepo = async (repo: GithubRepository) => {
    if (importing || isCheckingGithubName || githubNameExists) {
      return;
    }
    const selectSeq = ++selectRepoSeqRef.current;
    setImporting(true);

    try {
      const appName = githubAppName.trim() || repo.name;
      const result = await ipc.github.cloneRepoFromUrl({
        url: `https://github.com/${repo.full_name}.git`,
        installCommand: installCommand.trim() || undefined,
        startCommand: startCommand.trim() || undefined,
        appName,
      });
      if (selectSeq !== selectRepoSeqRef.current) {
        return;
      }
      setSelectedAppId(result.app.id);
      showSuccess(t("import.success", { name: result.app.name }));
      const chatId = await ipc.chat.createChat(result.app.id);
      navigate({ to: "/chat", search: { id: chatId } });
      if (!result.hasAiRules) {
        streamMessage({
          prompt: AI_RULES_PROMPT,
          chatId,
        });
      }
      onClose();
    } catch (error: unknown) {
      showError(
        t("import.importFailed", { message: getErrorMessage(error) }),
      );
    } finally {
      setImporting(false);
    }
  };

  const handleGithubAppNameChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newName = e.target.value;
    setGithubAppName(newName);
    const trimmedName = newName.trim();
    if (trimmedName) {
      const checkSeq = ++githubNameCheckSeqRef.current;
      setIsCheckingGithubName(true);
      try {
        const result = await ipc.import.checkAppName({
          appName: trimmedName,
        });
        if (checkSeq === githubNameCheckSeqRef.current) {
          setGithubNameExists(result.exists);
        }
      } catch (error: unknown) {
        if (checkSeq === githubNameCheckSeqRef.current) {
          showError(
            t("import.checkNameFailed", { message: getErrorMessage(error) }),
          );
        }
      } finally {
        if (checkSeq === githubNameCheckSeqRef.current) {
          setIsCheckingGithubName(false);
        }
      }
    } else {
      githubNameCheckSeqRef.current += 1;
      setIsCheckingGithubName(false);
      setGithubNameExists(false);
    }
  };

  const checkAppName = async ({
    name,
    skipCopy,
  }: {
    name: string;
    skipCopy?: boolean;
  }): Promise<void> => {
    const checkSeq = ++localNameCheckSeqRef.current;
    setIsCheckingName(true);
    try {
      const result = await ipc.import.checkAppName({
        appName: name,
        skipCopy,
      });
      if (checkSeq === localNameCheckSeqRef.current) {
        setNameExists(result.exists);
      }
    } catch (error: unknown) {
      if (checkSeq === localNameCheckSeqRef.current) {
        showError(
          t("import.checkNameFailed", { message: getErrorMessage(error) }),
        );
      }
    } finally {
      if (checkSeq === localNameCheckSeqRef.current) {
        setIsCheckingName(false);
      }
    }
  };
  const selectFolderMutation = useMutation({
    mutationFn: async () => {
      const selectSeq = ++selectFolderSeqRef.current;
      const result = await ipc.system.selectAppFolder();
      if (selectSeq !== selectFolderSeqRef.current) {
        return null;
      }
      if (!result.path || !result.name) {
        // User cancelled the folder selection dialog
        return null;
      }
      const aiRulesCheck = await ipc.import.checkAiRules({
        path: result.path,
      });
      if (selectSeq !== selectFolderSeqRef.current) {
        return null;
      }
      setHasAiRules(aiRulesCheck.exists);
      setSelectedPath(result.path);
      // Use the folder name from the IPC response
      setCustomAppName(result.name);
      // Check if the app name already exists
      await checkAppName({ name: result.name, skipCopy: !copyToAnyonApps });
      return result;
    },
    onError: (error: unknown) => {
      showError(getErrorMessage(error));
    },
  });

  const importAppMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPath) throw new Error("No folder selected");
      return ipc.import.importApp({
        path: selectedPath,
        appName: customAppName,
        installCommand: installCommand || undefined,
        startCommand: startCommand || undefined,
        skipCopy: !copyToAnyonApps,
      });
    },
    onSuccess: async (result) => {
      showSuccess(
        !hasAiRules
          ? t("import.successAutoRules")
          : t("import.success", { name: customAppName }),
      );
      onClose();

      navigate({ to: "/chat", search: { id: result.chatId } });
      if (!hasAiRules) {
        streamMessage({
          prompt: AI_RULES_PROMPT,
          chatId: result.chatId,
        });
      }
      setSelectedAppId(result.appId);
      await refreshApps();
    },
    onError: (error: unknown) => {
      showError(getErrorMessage(error));
    },
  });

  const handleSelectFolder = () => {
    selectFolderMutation.mutate();
  };

  const handleImport = () => {
    importAppMutation.mutate();
  };

  const handleClear = () => {
    setSelectedPath(null);
    setHasAiRules(null);
    setCustomAppName("");
    setNameExists(false);
    setInstallCommand("");
    setStartCommand("");
    setCopyToAnyonApps(true);
  };

  const handleAppNameChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newName = e.target.value;
    setCustomAppName(newName);
    if (newName.trim()) {
      await checkAppName({ name: newName, skipCopy: !copyToAnyonApps });
    } else {
      localNameCheckSeqRef.current += 1;
      setIsCheckingName(false);
      setNameExists(false);
    }
  };

  const commandsValid = areImportCommandsValid(installCommand, startCommand);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[calc(100vw-2rem)] max-h-[98vh] overflow-y-auto flex flex-col p-0">
        <DialogHeader className="sticky top-0 bg-background border-b px-6 py-4">
          <DialogTitle>Import App</DialogTitle>
          <DialogDescription className="text-sm">
            Import existing app from local folder or clone from Github.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          <Alert className="border-blue-500/20 text-blue-500 mb-2">
            <Info className="h-4 w-4 flex-shrink-0" />
            <AlertDescription className="text-xs sm:text-sm">
              App import is an experimental feature. If you encounter any
              issues, please report them using the Help button.
            </AlertDescription>
          </Alert>
          <Tabs defaultValue="local-folder" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger
                value="local-folder"
                className="text-xs sm:text-sm px-2 py-2"
              >
                Local Folder
              </TabsTrigger>
              <TabsTrigger
                value="github-repos"
                className="text-xs sm:text-sm px-2 py-2"
              >
                <span className="hidden sm:inline">Your GitHub Repos</span>
                <span className="sm:hidden">GitHub Repos</span>
              </TabsTrigger>
              <TabsTrigger
                value="github-url"
                className="text-xs sm:text-sm px-2 py-2"
              >
                GitHub URL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="local-folder" className="space-y-4">
              <div className="py-4">
                {!selectedPath ? (
                  <Button
                    onClick={handleSelectFolder}
                    disabled={selectFolderMutation.isPending}
                    className="w-full"
                  >
                    {selectFolderMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Folder className="mr-2 h-4 w-4" />
                    )}
                    {selectFolderMutation.isPending
                      ? "Selecting folder..."
                      : "Select Folder"}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="text-sm font-medium mb-1">
                            Selected folder:
                          </p>
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">
                            {selectedPath}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClear}
                          className="h-8 w-8 p-0 flex-shrink-0"
                          disabled={importAppMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Clear selection</span>
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="copy-to-anyon-apps"
                        aria-label="Copy to the anyon-apps folder"
                        checked={copyToAnyonApps}
                        onCheckedChange={(checked) => {
                          const shouldCopy = checked === true;
                          setCopyToAnyonApps(shouldCopy);
                          if (customAppName.trim() && selectedPath) {
                            void checkAppName({
                              name: customAppName,
                              skipCopy: !shouldCopy,
                            });
                          }
                        }}
                        disabled={importAppMutation.isPending}
                      />
                      <label
                        htmlFor="copy-to-anyon-apps"
                        className="text-xs sm:text-sm cursor-pointer"
                      >
                        Copy to the{" "}
                        <code className="bg-muted px-1 py-0.5 rounded text-xs">
                          anyon-apps
                        </code>{" "}
                        folder
                      </label>
                    </div>

                    <div className="space-y-2">
                      {nameExists && (
                        <p className="text-xs sm:text-sm text-yellow-500">
                          An app with this name already exists. Please choose a
                          different name:
                        </p>
                      )}
                      <div className="relative">
                        <Label className="text-xs sm:text-sm ml-2 mb-2">
                          App name
                        </Label>
                        <Input
                          value={customAppName}
                          onChange={handleAppNameChange}
                          placeholder="Enter new app name"
                          className="w-full pr-8 text-sm"
                          disabled={importAppMutation.isPending || isCheckingName}
                        />
                        {isCheckingName && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>

                    <Accordion>
                      <AccordionItem value="advanced-options">
                        <AccordionTrigger className="text-xs sm:text-sm hover:no-underline">
                          Advanced options
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <div className="grid gap-2">
                            <Label className="text-xs sm:text-sm ml-2 mb-2">
                              Install command
                            </Label>
                            <Input
                              value={installCommand}
                              onChange={(e) =>
                                setInstallCommand(e.target.value)
                              }
                              placeholder="pnpm install"
                              className="text-sm"
                              disabled={importAppMutation.isPending}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-xs sm:text-sm ml-2 mb-2">
                              Start command
                            </Label>
                            <Input
                              value={startCommand}
                              onChange={(e) => setStartCommand(e.target.value)}
                              placeholder="pnpm dev"
                              className="text-sm"
                              disabled={importAppMutation.isPending}
                            />
                          </div>
                          {!commandsValid && (
                            <p className="text-xs sm:text-sm text-red-500">
                              Both commands are required when customizing.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {hasAiRules === false && (
                      <Alert className="border-yellow-500/20 text-yellow-500 flex items-start gap-2">
                        <span
                          title="AI_RULES.md lets Anyon know which tech stack to use for editing the app"
                          className="flex-shrink-0 mt-1"
                        >
                          <Info className="h-4 w-4" />
                        </span>
                        <AlertDescription className="text-xs sm:text-sm">
                          No AI_RULES.md found. Anyon will automatically
                          generate one after importing.
                        </AlertDescription>
                      </Alert>
                    )}

                    {importAppMutation.isPending && (
                      <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-muted-foreground animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Importing app...</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={importAppMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    !selectedPath ||
                    importAppMutation.isPending ||
                    isCheckingName ||
                    nameExists ||
                    !commandsValid
                  }
                  className="w-full sm:w-auto min-w-[80px]"
                >
                  {importAppMutation.isPending ? <>Importing...</> : "Import"}
                </Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="github-repos" className="space-y-4">
              {!isAuthenticated ? (
                <UnconnectedGitHubConnector
                  appId={null}
                  folderName=""
                  settings={settings}
                  refreshSettings={refreshSettings}
                  handleRepoSetupComplete={() => undefined}
                  expanded={false}
                />
              ) : (
                <>
                  {loading && (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin h-6 w-6" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm ml-2 mb-2">
                      App name (optional)
                    </Label>
                    <Input
                      value={githubAppName}
                      onChange={handleGithubAppNameChange}
                      placeholder="Leave empty to use repository name"
                      className="w-full pr-8 text-sm"
                            disabled={importing || isCheckingGithubName}
                    />
                    {isCheckingGithubName && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {githubNameExists && (
                      <p className="text-xs sm:text-sm text-yellow-500">
                        An app with this name already exists. Please choose a
                        different name.
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 max-h-64 overflow-y-auto overflow-x-hidden">
                    {!loading && repos.length === 0 && (
                      <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">
                        No repositories found
                      </p>
                    )}
                    {repos.map((repo) => (
                      <div
                        key={repo.full_name}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors min-w-0"
                      >
                        <div className="min-w-0 flex-1 overflow-hidden mr-2">
                          <p className="font-semibold truncate text-sm">
                            {repo.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {repo.full_name}
                          </p>
                        </div>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleSelectRepo(repo)}
                           disabled={
                             importing || isCheckingGithubName || githubNameExists
                           }
                           className="flex-shrink-0 text-xs"
                         >
                          {importing ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                          ) : (
                            "Import"
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  {repos.length > 0 && (
                    <Accordion>
                      <AccordionItem value="advanced-options">
                        <AccordionTrigger className="text-xs sm:text-sm hover:no-underline">
                          Advanced options
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          <div className="grid gap-2">
                            <Label className="text-xs sm:text-sm">
                              Install command
                            </Label>
                            <Input
                              value={installCommand}
                              onChange={(e) => setInstallCommand(e.target.value)}
                              placeholder="pnpm install"
                              className="text-sm"
                              disabled={importing}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-xs sm:text-sm">
                              Start command
                            </Label>
                            <Input
                              value={startCommand}
                              onChange={(e) => setStartCommand(e.target.value)}
                              placeholder="pnpm dev"
                              className="text-sm"
                              disabled={importing}
                            />
                          </div>
                          {!commandsValid && (
                            <p className="text-xs sm:text-sm text-red-500">
                              Both commands are required when customizing.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </>
              )}
            </TabsContent>
            <TabsContent value="github-url" className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Repository URL</Label>
                <Input
                  placeholder="https://github.com/user/repo.git"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={importing}
                  onBlur={handleUrlBlur}
                  className="text-sm break-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">
                  App name (optional)
                </Label>
                <Input
                  value={githubAppName}
                  onChange={handleGithubAppNameChange}
                  placeholder="Leave empty to use repository name"
                  disabled={importing}
                  className="text-sm"
                />
                {isCheckingGithubName && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {githubNameExists && (
                  <p className="text-xs sm:text-sm text-yellow-500">
                    An app with this name already exists. Please choose a
                    different name.
                  </p>
                )}
              </div>

              <Accordion>
                <AccordionItem value="advanced-options">
                  <AccordionTrigger className="text-xs sm:text-sm hover:no-underline">
                    Advanced options
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-xs sm:text-sm">
                        Install command
                      </Label>
                      <Input
                        value={installCommand}
                        onChange={(e) => setInstallCommand(e.target.value)}
                        placeholder="pnpm install"
                        className="text-sm"
                        disabled={importing || isCheckingGithubName}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs sm:text-sm">
                        Start command
                      </Label>
                      <Input
                        value={startCommand}
                        onChange={(e) => setStartCommand(e.target.value)}
                        placeholder="pnpm dev"
                        className="text-sm"
                        disabled={importing}
                      />
                    </div>
                    {!commandsValid && (
                      <p className="text-xs sm:text-sm text-red-500">
                        Both commands are required when customizing.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button
                onClick={handleImportFromUrl}
                disabled={
                  importing ||
                  isCheckingGithubName ||
                  githubNameExists ||
                  !url.trim() ||
                  !commandsValid
                }
                className="w-full"
              >
                {importing ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Importing...
                  </>
                ) : (
                  "Import"
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
