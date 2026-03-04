import { ipc } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

export function useTweakcnThemes() {
  const query = useQuery({
    queryKey: queryKeys.tweakcnThemes.all,
    queryFn: async () => {
      return ipc.designSystem.getTweakcnThemes();
    },
    meta: {
      showErrorToast: true,
    },
  });

  return {
    themes: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
