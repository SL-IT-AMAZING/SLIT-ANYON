import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { pendingVisualChangesAtom } from "@/atoms/previewAtoms";
import { Button } from "@/components/ui/button";
import { ipc } from "@/ipc/types";
import { showError, showSuccess } from "@/lib/toast";
import { useAtom, useAtomValue } from "jotai";
import { Check, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  VISUAL_EDITING_RESPONSE_TIMEOUT_MS,
  getVisualEditingResponseKey,
  mergeVisualEditingTextContent,
  shouldRefreshLiveTextContent,
} from "./visualEditingSaveUtils";

interface VisualEditingChangesDialogProps {
  onReset?: () => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}

export function VisualEditingChangesDialog({
  onReset,
  iframeRef,
}: VisualEditingChangesDialogProps) {
  const { t } = useTranslation(["app", "common"]);
  const [pendingChanges, setPendingChanges] = useAtom(pendingVisualChangesAtom);
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const [isSaving, setIsSaving] = useState(false);
  const textContentCache = useRef<Map<string, string>>(new Map());
  const [allResponsesReceived, setAllResponsesReceived] = useState(false);
  const expectedResponsesRef = useRef<Set<string>>(new Set());
  const isWaitingForResponses = useRef(false);
  const responseTimeoutRef = useRef<number | null>(null);
  const usedTextFallbackRef = useRef(false);

  const clearResponseTimeout = useCallback(() => {
    if (responseTimeoutRef.current !== null) {
      window.clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);

  // Listen for text content responses
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "anyon-text-content-response") {
        const responseKey = getVisualEditingResponseKey({
          componentId: event.data.componentId,
          runtimeId: event.data.runtimeId,
        });
        const { text } = event.data;
        if (text !== null) {
          textContentCache.current.set(responseKey, text);
        }

        expectedResponsesRef.current.delete(responseKey);

        if (
          isWaitingForResponses.current &&
          expectedResponsesRef.current.size === 0
        ) {
          clearResponseTimeout();
          setAllResponsesReceived(true);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      clearResponseTimeout();
    };
  }, [clearResponseTimeout]);

  // Execute when all responses are received
  useEffect(() => {
    if (allResponsesReceived && isSaving) {
      const applyChanges = async () => {
        try {
          const changesToSave = Array.from(pendingChanges.values());
          const updatedChanges = mergeVisualEditingTextContent(
            changesToSave,
            textContentCache.current,
          );

          await ipc.visualEditing.applyChanges({
            appId: selectedAppId!,
            changes: updatedChanges,
          });

          setPendingChanges(new Map());
          textContentCache.current.clear();
          showSuccess(t("preview.visualChangesSaved", { ns: "app" }));
          if (usedTextFallbackRef.current) {
            console.warn(
              "Timed out waiting for preview text sync; saved using the last captured text.",
            );
          }
          onReset?.();
        } catch (error) {
          console.error("Failed to save visual editing changes:", error);
          showError(
            t("preview.visualChangesFailed", {
              message: String(error),
              ns: "app",
            }),
          );
        } finally {
          clearResponseTimeout();
          setIsSaving(false);
          setAllResponsesReceived(false);
          isWaitingForResponses.current = false;
          usedTextFallbackRef.current = false;
        }
      };

      applyChanges();
    }
  }, [
    allResponsesReceived,
    isSaving,
    pendingChanges,
    selectedAppId,
    onReset,
    setPendingChanges,
    t,
    clearResponseTimeout,
  ]);

  if (pendingChanges.size === 0) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const changesToSave = Array.from(pendingChanges.values());
      const textChangesToRefresh = changesToSave.filter(
        shouldRefreshLiveTextContent,
      );

      if (
        iframeRef?.current?.contentWindow &&
        textChangesToRefresh.length > 0
      ) {
        setAllResponsesReceived(false);
        clearResponseTimeout();
        textContentCache.current.clear();
        expectedResponsesRef.current.clear();
        isWaitingForResponses.current = true;
        usedTextFallbackRef.current = false;

        for (const change of textChangesToRefresh) {
          expectedResponsesRef.current.add(getVisualEditingResponseKey(change));
        }

        for (const change of textChangesToRefresh) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: "get-anyon-text-content",
              data: {
                componentId: change.componentId,
                runtimeId: change.runtimeId,
              },
            },
            "*",
          );
        }

        if (expectedResponsesRef.current.size === 0) {
          setAllResponsesReceived(true);
        } else {
          responseTimeoutRef.current = window.setTimeout(() => {
            if (!isWaitingForResponses.current) {
              return;
            }

            if (expectedResponsesRef.current.size > 0) {
              usedTextFallbackRef.current = true;
            }

            expectedResponsesRef.current.clear();
            isWaitingForResponses.current = false;
            setAllResponsesReceived(true);
          }, VISUAL_EDITING_RESPONSE_TIMEOUT_MS);
        }
      } else {
        await ipc.visualEditing.applyChanges({
          appId: selectedAppId!,
          changes: changesToSave,
        });

        setPendingChanges(new Map());
        textContentCache.current.clear();
        showSuccess(t("preview.visualChangesSaved", { ns: "app" }));
        onReset?.();
      }
    } catch (error) {
      console.error("Failed to save visual editing changes:", error);
      showError(
        t("preview.visualChangesFailed", { message: String(error), ns: "app" }),
      );
      clearResponseTimeout();
      setIsSaving(false);
      isWaitingForResponses.current = false;
      usedTextFallbackRef.current = false;
    }
  };

  const handleDiscard = () => {
    setPendingChanges(new Map());
    onReset?.();
  };

  return (
    <div className="bg-[var(--background)] border-b border-[var(--border)] px-2 lg:px-4 py-1.5 flex flex-col lg:flex-row items-start lg:items-center lg:justify-between gap-1.5 lg:gap-4 flex-wrap">
      <p className="text-xs lg:text-sm w-full lg:w-auto">
        <span className="font-medium">{pendingChanges.size}</span>{" "}
        {t("preview.pendingChanges", {
          count: pendingChanges.size,
          ns: "app",
        })}{" "}
        {t("preview.modifiedComponents", { ns: "app" })}
      </p>
      <div className="flex gap-1 lg:gap-2 w-full lg:w-auto flex-wrap">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          <Check size={14} className="mr-1" />
          <span>
            {isSaving
              ? t("preview.savingChanges", { ns: "app" })
              : t("preview.saveChanges", { ns: "app" })}
          </span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDiscard}
          disabled={isSaving}
        >
          <X size={14} className="mr-1" />
          <span>{t("preview.discardChanges", { ns: "app" })}</span>
        </Button>
      </div>
    </div>
  );
}
