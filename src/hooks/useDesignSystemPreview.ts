import { ipc } from "@/ipc/types";
import { useCallback, useEffect, useRef, useState } from "react";

interface PreviewComponent {
  id: string;
  label: string;
  category?: string;
}

interface PreviewReadyMessage {
  type: "PREVIEW_READY";
  components: {
    id: string;
    name?: string;
    label?: string;
    category?: string;
  }[];
  nonce: string;
}

function isPreviewReadyMessage(data: unknown): data is PreviewReadyMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;
  return (
    msg.type === "PREVIEW_READY" &&
    Array.isArray(msg.components) &&
    typeof msg.nonce === "string"
  );
}

interface UseDesignSystemPreviewReturn {
  previewUrl: string | null;
  nonce: string | null;
  isLoading: boolean;
  error: Error | null;
  components: PreviewComponent[];
  activeComponentId: string | null;
  navigateToComponent: (componentId: string) => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export function useDesignSystemPreview(
  designSystemId: string | null,
): UseDesignSystemPreviewReturn {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [nonce, setNonce] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [components, setComponents] = useState<PreviewComponent[]>([]);
  const [activeComponentId, setActiveComponentId] = useState<string | null>(
    null,
  );
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!designSystemId) {
      setPreviewUrl(null);
      setNonce(null);
      setComponents([]);
      setActiveComponentId(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setComponents([]);
    setActiveComponentId(null);

    ipc.designSystem
      .getPreviewUrl({ designSystemId })
      .then((result) => {
        if (cancelled) return;
        setPreviewUrl(result.url);
        setNonce(result.nonce);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err : new Error("Failed to get preview URL"),
        );
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [designSystemId]);

  useEffect(() => {
    if (!nonce || !previewUrl) return;

    function handleMessage(event: MessageEvent) {
      if (!isPreviewReadyMessage(event.data)) return;
      if (event.data.nonce !== nonce) return;

      setComponents(
        event.data.components.map((c) => ({
          id: c.id,
          label: c.label ?? c.name ?? c.id,
          category: c.category,
        })),
      );
      setIsLoading(false);

      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: "HANDSHAKE_ACK", nonce }, "*");
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [nonce, previewUrl]);

  const navigateToComponent = useCallback(
    (componentId: string) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !nonce) return;

      iframe.contentWindow.postMessage(
        { type: "NAVIGATE_COMPONENT", componentId, nonce },
        "*",
      );
      setActiveComponentId(componentId);
    },
    [nonce],
  );

  useEffect(() => {
    return () => {
      ipc.designSystem.stopActivePreview().catch(() => {});
    };
  }, []);

  return {
    previewUrl,
    nonce,
    isLoading,
    error,
    components,
    activeComponentId,
    navigateToComponent,
    iframeRef,
  };
}
