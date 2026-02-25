import { ipc } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export function useOmoAgents(enabled = true) {
  const {
    data: agents,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.omo.agents,
    queryFn: () => ipc.omo.listAgents({}),
    enabled,
    staleTime: 30_000,
  });

  return { agents: agents ?? [], isLoading, error };
}
