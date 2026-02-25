import { ipc } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export function useOmoCommands(enabled = true) {
  const {
    data: commands,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.omo.commands,
    queryFn: () => ipc.omo.listCommands({}),
    enabled,
    staleTime: 30_000,
  });

  return { commands: commands ?? [], isLoading, error };
}
