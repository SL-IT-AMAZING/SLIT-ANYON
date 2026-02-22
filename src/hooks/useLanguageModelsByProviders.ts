import { type LanguageModel, ipc } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";

/**
 * Fetches all available language models grouped by their provider IDs.
 *
 * @returns TanStack Query result object for the language models organized by provider.
 */
export function useLanguageModelsByProviders(appPath?: string) {
  return useQuery<Record<string, LanguageModel[]>, Error>({
    queryKey: queryKeys.languageModels.byProviders({ appPath }),
    queryFn: async () => {
      return ipc.languageModel.getModelsByProviders({ appPath });
    },
    enabled: !!appPath,
  });
}
