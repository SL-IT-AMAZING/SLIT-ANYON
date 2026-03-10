import { ipc } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import type { ChatSummary } from "@/lib/schemas";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useChats(appId: number | null) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ChatSummary[]>({
    queryKey: queryKeys.chats.list({ appId }),
    queryFn: async () => {
      return ipc.chat.getChats(appId ?? undefined);
    },
  });

  const invalidateChats = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.chats.list({ appId }) });
    queryClient.invalidateQueries({
      queryKey: queryKeys.chats.list({ appId: null }),
    });
  };

  return {
    chats: data ?? [],
    loading: isLoading,
    invalidateChats,
  };
}
