import { selectedAppIdAtom, selectedVersionIdAtom } from "@/atoms/appAtoms";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCheckoutVersion } from "@/hooks/useCheckoutVersion";
import { useLoadApp } from "@/hooks/useLoadApp";
import { useVersions } from "@/hooks/useVersions";
import type { Version } from "@/ipc/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useAtom, useAtomValue } from "jotai";
import { Database, Loader2, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useRunApp } from "@/hooks/useRunApp";

interface VersionPaneProps {
  isVisible: boolean;
  onClose: () => void;
}

export function VersionPane({ isVisible, onClose }: VersionPaneProps) {
  const { t } = useTranslation("chat");
  const appId = useAtomValue(selectedAppIdAtom);
  const { refreshApp } = useLoadApp(appId);
  const { restartApp } = useRunApp();
  const {
    versions: liveVersions,
    refreshVersions,
    revertVersion,
    isRevertingVersion,
  } = useVersions(appId);

  const [selectedVersionId, setSelectedVersionId] = useAtom(
    selectedVersionIdAtom,
  );
  const { checkoutVersion, isCheckingOutVersion } = useCheckoutVersion();
  const wasVisibleRef = useRef(false);
  const [cachedVersions, setCachedVersions] = useState<Version[]>([]);

  useEffect(() => {
    async function updatePaneState() {
      // When pane becomes visible after being closed
      if (isVisible && !wasVisibleRef.current) {
        if (appId) {
          await refreshVersions();
          setCachedVersions(liveVersions);
        }
      }

      // Reset when closing
      if (!isVisible && selectedVersionId) {
        setSelectedVersionId(null);
        if (appId) {
          await checkoutVersion({ appId, versionId: "main" });
        }
      }

      wasVisibleRef.current = isVisible;
    }
    updatePaneState();
  }, [
    isVisible,
    selectedVersionId,
    setSelectedVersionId,
    appId,
    checkoutVersion,
    refreshVersions,
    liveVersions,
  ]);

  // Initial load of cached versions when live versions become available
  useEffect(() => {
    if (isVisible && liveVersions.length > 0 && cachedVersions.length === 0) {
      setCachedVersions(liveVersions);
    }
  }, [isVisible, liveVersions, cachedVersions.length]);

  if (!isVisible) {
    return null;
  }

  const handleVersionClick = async (version: Version) => {
    if (appId) {
      setSelectedVersionId(version.oid);
      try {
        await checkoutVersion({ appId, versionId: version.oid });
      } catch (error) {
        console.error("Could not checkout version, unselecting version", error);
        setSelectedVersionId(null);
      }
      await refreshApp();
      if (version.dbTimestamp) {
        await restartApp();
      }
    }
  };

  const versions = cachedVersions.length > 0 ? cachedVersions : liveVersions;

  const isVersionInteractionDisabled =
    isCheckingOutVersion || isRevertingVersion;

  return (
    <div className="h-full flex flex-col border-t border-border w-full bg-(--background-lighter) animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            {t("ui.version")}
          </h2>
          {versions.length > 0 && (
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {versions.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          aria-label={t("ui.closePreview")}
        >
          <X size={16} />
        </button>
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto p-2">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm">{t("ui.noVersionsAvailable")}</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {versions.map((version: Version, index: number) => {
              const isSelected = selectedVersionId === version.oid;
              const isLoading = isCheckingOutVersion && isSelected;
              const isFirst = index === 0;
              const isLast = index === versions.length - 1;

              return (
                <div
                  key={version.oid}
                  className={cn(
                    "group relative flex cursor-pointer",
                    isLoading && "opacity-60 cursor-not-allowed",
                  )}
                  onClick={() => {
                    if (!isVersionInteractionDisabled) {
                      handleVersionClick(version);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      (e.key === "Enter" || e.key === " ") &&
                      !isVersionInteractionDisabled
                    ) {
                      e.preventDefault();
                      handleVersionClick(version);
                    }
                  }}
                >
                  <div className="flex flex-col items-center shrink-0 w-6">
                    <div
                      className={cn(
                        "w-px flex-1",
                        isFirst ? "bg-transparent" : "bg-border",
                      )}
                    />
                    <div
                      className={cn(
                        "rounded-full shrink-0 my-0.5 transition-all duration-200",
                        isSelected
                          ? "w-3 h-3 bg-primary ring-2 ring-primary/20"
                          : "w-2 h-2 bg-muted-foreground/30 group-hover:bg-muted-foreground/60",
                      )}
                    />
                    <div
                      className={cn(
                        "w-px flex-1",
                        isLast ? "bg-transparent" : "bg-border",
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      "flex-1 px-3 py-2.5 rounded-lg transition-all duration-150",
                      "group-hover:bg-(--background-lightest)",
                      isSelected &&
                        "bg-(--background-lightest) shadow-sm ring-1 ring-border",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                          v{versions.length - index}
                        </span>
                        <code className="text-[11px] text-muted-foreground font-mono">
                          {version.oid.slice(0, 7)}
                        </code>
                        {version.dbTimestamp &&
                          (() => {
                            const timestampMs = new Date(
                              version.dbTimestamp,
                            ).getTime();
                            const isExpired =
                              Date.now() - timestampMs > 24 * 60 * 60 * 1000;
                            return (
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <div
                                      className={cn(
                                        "inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full transition-colors duration-150",
                                        isExpired
                                          ? "bg-muted text-muted-foreground"
                                          : "bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400",
                                      )}
                                    />
                                  }
                                >
                                  <div
                                    className={cn(
                                      "inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-full transition-colors duration-150",
                                      isExpired
                                        ? "bg-muted text-muted-foreground"
                                        : "bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400",
                                    )}
                                  >
                                    <Database size={9} />
                                    <span>{t("ui.dbLabel")}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isExpired
                                    ? t("ui.databaseSnapshotExpired")
                                    : t("ui.databaseSnapshot", {
                                        timestamp: version.dbTimestamp,
                                      })}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isLoading && (
                          <Loader2
                            size={12}
                            className="animate-spin text-muted-foreground"
                          />
                        )}
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {isLoading
                            ? t("ui.loadingEllipsis")
                            : formatDistanceToNow(
                                new Date(version.timestamp * 1000),
                                {
                                  addSuffix: true,
                                },
                              )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      {version.message && (
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {version.message.startsWith(
                            "Reverted all changes back to version ",
                          )
                            ? version.message.replace(
                                /Reverted all changes back to version ([a-f0-9]+)/,
                                (_, hash) => {
                                  const targetIndex = versions.findIndex(
                                    (v) => v.oid === hash,
                                  );
                                  return targetIndex !== -1
                                    ? `Reverted all changes back to version ${
                                        versions.length - targetIndex
                                      }`
                                    : version.message;
                                },
                              )
                            : version.message}
                        </p>
                      )}

                      <button
                        onClick={async (e) => {
                          e.stopPropagation();

                          if (isRevertingVersion) {
                            return;
                          }

                          await revertVersion({
                            versionId: version.oid,
                          });
                          setSelectedVersionId(null);
                          // Close the pane after revert to force a refresh on next open
                          onClose();
                          if (version.dbTimestamp) {
                            await restartApp();
                          }
                        }}
                        disabled={isRevertingVersion}
                        className={cn(
                          "shrink-0 mt-1 flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-150",
                          "bg-primary text-primary-foreground shadow-xs hover:opacity-90 active:scale-[0.97]",
                          "invisible opacity-0 group-hover:visible group-hover:opacity-100",
                          isSelected && "visible opacity-100",
                          isRevertingVersion && "opacity-50 cursor-not-allowed",
                        )}
                        aria-label={
                          isRevertingVersion
                            ? t("ui.checkingOut")
                            : "Revert to this version"
                        }
                        title={
                          isRevertingVersion
                            ? t("ui.checkingOut")
                            : "Revert to this version"
                        }
                      >
                        {isRevertingVersion ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <RotateCcw size={11} />
                        )}
                        <span>
                          {isRevertingVersion ? t("ui.checkingOut") : "Revert"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
