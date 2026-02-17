import { useScrollAndNavigateTo } from "@/hooks/useScrollAndNavigateTo";
import { queryKeys } from "@/lib/queryKeys";
import { SECTION_IDS } from "@/lib/settingsSearchIndex";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { type DeepLinkData, ipc } from "../ipc/types";

type DeepLinkContextType = {
  lastDeepLink: (DeepLinkData & { timestamp: number }) | null;
  clearLastDeepLink: () => void;
};

const DeepLinkContext = createContext<DeepLinkContextType>({
  lastDeepLink: null,
  clearLastDeepLink: () => {},
});

export function DeepLinkProvider({ children }: { children: React.ReactNode }) {
  const [lastDeepLink, setLastDeepLink] = useState<
    (DeepLinkData & { timestamp: number }) | null
  >(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scrollAndNavigateTo = useScrollAndNavigateTo("/settings", {
    behavior: "smooth",
    block: "start",
  });
  useEffect(() => {
    const unsubscribe = ipc.events.misc.onDeepLinkReceived((data) => {
      // Update with timestamp to ensure state change even if same type comes twice
      setLastDeepLink({ ...data, timestamp: Date.now() });
      if (data.type === "add-mcp-server") {
        scrollAndNavigateTo(SECTION_IDS.toolsMcp);
      } else if (data.type === "add-prompt") {
        navigate({ to: "/library" });
      } else if (data.type === "auth-return") {
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.state });
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
      } else if (data.type === "checkout-success") {
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlement.all });
      }
    });

    return unsubscribe;
  }, [navigate, scrollAndNavigateTo, queryClient]);

  return (
    <DeepLinkContext.Provider
      value={{
        lastDeepLink,
        clearLastDeepLink: () => setLastDeepLink(null),
      }}
    >
      {children}
    </DeepLinkContext.Provider>
  );
}

export const useDeepLink = () => useContext(DeepLinkContext);
