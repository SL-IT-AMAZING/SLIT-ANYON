import { ipc } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import type { TemplateRegistry } from "@/shared/templates";
import { useQuery } from "@tanstack/react-query";

const EMPTY_REGISTRY: TemplateRegistry = {
  version: 1,
  categories: [],
  templates: [],
};

export function useTemplates() {
  const query = useQuery({
    queryKey: queryKeys.templates.all,
    queryFn: async (): Promise<TemplateRegistry> => {
      return ipc.template.getTemplates();
    },
    placeholderData: EMPTY_REGISTRY,
    meta: {
      showErrorToast: true,
    },
  });

  const registry = query.data ?? EMPTY_REGISTRY;

  return {
    templates: registry.templates,
    categories: registry.categories,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
