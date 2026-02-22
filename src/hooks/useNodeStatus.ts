import { ipc } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook for checking Node.js installation status.
 * Returns cached node/pnpm version info, auto-refetches when invalidated.
 *
 * Usage:
 *   const { data, isLoading, refetch } = useNodeStatus();
 *   const isNodeAvailable = !!data?.nodeVersion;
 */
export function useNodeStatus() {
  return useQuery({
    queryKey: queryKeys.system.nodeStatus(),
    queryFn: () => ipc.system.getNodejsStatus(),
    staleTime: 30_000,
    retry: 1,
  });
}
