import { ipc } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useLikedThemes() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.themes.liked,
    queryFn: async () => {
      return ipc.likedThemes.getLikedThemes();
    },
    meta: {
      showErrorToast: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (themeId: string) => {
      return ipc.likedThemes.toggleThemeLike({ themeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.themes.liked,
      });
    },
  });

  const likedThemeIds = query.data?.themeIds ?? [];

  const toggleLike = async (themeId: string) => {
    const result = await mutation.mutateAsync(themeId);
    return result.liked;
  };

  const isLiked = (themeId: string) => {
    return likedThemeIds.includes(themeId);
  };

  return {
    likedThemeIds,
    toggleLike,
    isLiked,
  };
}
