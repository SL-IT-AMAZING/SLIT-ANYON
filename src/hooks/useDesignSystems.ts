import { ipc } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export function useDesignSystems() {
  const query = useQuery({
    queryKey: queryKeys.designSystems.all,
    queryFn: async () => {
      return ipc.designSystem.getDesignSystems();
    },
    meta: {
      showErrorToast: true,
    },
  });

  return {
    designSystems: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
