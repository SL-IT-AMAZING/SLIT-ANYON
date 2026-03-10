import {
  chatErrorByIdAtom,
  chatMessagesByIdAtom,
  isStreamingByIdAtom,
} from "@/atoms/chatAtoms";
import { pendingPlanningArtifactImplementationAtom } from "@/atoms/planAtoms";
import { ipc } from "@/ipc/types";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef } from "react";

export function buildArtifactImplementationPrompt(params: {
  artifactId: string;
  artifactType: "founder_brief" | "internal_build_spec";
}) {
  if (params.artifactType === "internal_build_spec") {
    return `/implement-spec=${params.artifactId}`;
  }
  return `/implement-brief=${params.artifactId}`;
}

export function usePlanningArtifactImplementation() {
  const pendingArtifact = useAtomValue(pendingPlanningArtifactImplementationAtom);
  const setPendingArtifact = useSetAtom(pendingPlanningArtifactImplementationAtom);
  const isStreamingById = useAtomValue(isStreamingByIdAtom);
  const setIsStreamingById = useSetAtom(isStreamingByIdAtom);
  const setMessagesById = useSetAtom(chatMessagesByIdAtom);
  const setErrorById = useSetAtom(chatErrorByIdAtom);

  const hasTriggeredRef = useRef(false);
  const wasStreamingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!pendingArtifact) {
      hasTriggeredRef.current = false;
      wasStreamingRef.current = false;
      return;
    }

    const isNowStreaming = isStreamingById.get(pendingArtifact.chatId) ?? false;
    const wasStreaming = wasStreamingRef.current;
    wasStreamingRef.current = isNowStreaming;

    const streamJustCompleted = wasStreaming && !isNowStreaming;
    const neverWasStreaming = !wasStreaming && !isNowStreaming;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (
      !hasTriggeredRef.current &&
      (streamJustCompleted || neverWasStreaming)
    ) {
      hasTriggeredRef.current = true;
      const artifactToImplement = pendingArtifact;

      timeoutId = setTimeout(() => {
        const chatId = artifactToImplement.chatId;
        const prompt = buildArtifactImplementationPrompt({
          artifactId: artifactToImplement.artifactId,
          artifactType: artifactToImplement.artifactType,
        });

        setIsStreamingById((prev) => {
          const next = new Map(prev);
          next.set(chatId, true);
          return next;
        });

        setErrorById((prev) => {
          const next = new Map(prev);
          next.set(chatId, null);
          return next;
        });

        ipc.chatStream.start(
          {
            chatId,
            prompt,
            selectedComponents: [],
          },
          {
            onChunk: ({ messages: updatedMessages }) => {
              if (!isMountedRef.current) return;
              setMessagesById((prev) => {
                const next = new Map(prev);
                next.set(chatId, updatedMessages);
                return next;
              });
            },
            onEnd: () => {
              if (!isMountedRef.current) return;
              setIsStreamingById((prev) => {
                const next = new Map(prev);
                next.set(chatId, false);
                return next;
              });
            },
            onError: ({ error }) => {
              if (!isMountedRef.current) return;
              setErrorById((prev) => {
                const next = new Map(prev);
                next.set(chatId, error);
                return next;
              });
              setIsStreamingById((prev) => {
                const next = new Map(prev);
                next.set(chatId, false);
                return next;
              });
            },
          },
        );

        setPendingArtifact(null);
      }, 100);
    }

    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    pendingArtifact,
    isStreamingById,
    setPendingArtifact,
    setIsStreamingById,
    setMessagesById,
    setErrorById,
  ]);
}
