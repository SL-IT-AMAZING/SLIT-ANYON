import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguageModelProviders } from "@/hooks/useLanguageModelProviders";
import { useLanguageModelsByProviders } from "@/hooks/useLanguageModelsByProviders";
import { useLoadApp } from "@/hooks/useLoadApp";
import { useSettings } from "@/hooks/useSettings";
import type { LanguageModel } from "@/ipc/types";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

function formatContextWindow(tokens: number | undefined): string {
  if (!tokens) return "";
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(tokens % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(tokens % 1_000 === 0 ? 0 : 1)}K`;
  }
  return tokens.toString();
}

export function ModelPicker() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { settings, updateSettings } = useSettings();
  const queryClient = useQueryClient();
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const { app } = useLoadApp(selectedAppId);

  const { data: modelsByProviders, isLoading: modelsLoading } =
    useLanguageModelsByProviders(app?.path);
  const { data: providers, isLoading: providersLoading } =
    useLanguageModelProviders(app?.path);

  const isLoading = modelsLoading || providersLoading;

  const providerNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (providers) {
      for (const provider of providers) {
        map[provider.id] = provider.name;
      }
    }
    return map;
  }, [providers]);

  const filteredModelsByProvider = useMemo(() => {
    if (!modelsByProviders) return {};

    const searchLower = search.toLowerCase().trim();
    const result: Record<string, LanguageModel[]> = {};

    for (const [providerId, models] of Object.entries(modelsByProviders)) {
      const providerName = providerNameMap[providerId] || providerId;
      const providerMatches = providerName.toLowerCase().includes(searchLower);

      const filteredModels = models.filter((model) => {
        if (!searchLower) return true;
        if (providerMatches) return true;
        return (
          model.displayName.toLowerCase().includes(searchLower) ||
          model.apiName.toLowerCase().includes(searchLower)
        );
      });

      if (filteredModels.length > 0) {
        result[providerId] = filteredModels;
      }
    }

    return result;
  }, [modelsByProviders, providerNameMap, search]);

  const hasModels = Object.keys(filteredModelsByProvider).length > 0;
  const hasAnyModels =
    modelsByProviders && Object.keys(modelsByProviders).length > 0;

  const selectedModel = settings?.selectedModel;

  const currentModelDisplayName = useMemo(() => {
    if (!selectedModel || !modelsByProviders) return "Select model";

    const providerModels = modelsByProviders[selectedModel.provider];
    if (!providerModels) return selectedModel.name;

    const model = providerModels.find((m) => m.apiName === selectedModel.name);
    return model?.displayName ?? selectedModel.name;
  }, [selectedModel, modelsByProviders]);

  const handleModelSelect = (model: LanguageModel, providerId: string) => {
    updateSettings({
      selectedModel: {
        name: model.apiName,
        provider: providerId,
      },
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.tokenCount.all });
    setOpen(false);
    setSearch("");
  };

  if (!settings) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 max-w-[160px] justify-between gap-1 px-2 text-xs"
            data-testid="model-picker"
            title={currentModelDisplayName}
          />
        }
      >
        <span className="truncate">{currentModelDisplayName}</span>
        <ChevronsUpDownIcon className="size-3 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("placeholders.searchModels")}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-80">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading models...
              </div>
            ) : !hasAnyModels ? (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-4">
                  <span className="text-muted-foreground">
                    No models available
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Connect a provider in Settings
                  </span>
                </div>
              </CommandEmpty>
            ) : !hasModels ? (
              <CommandEmpty>No models found</CommandEmpty>
            ) : (
              Object.entries(filteredModelsByProvider).map(
                ([providerId, models]) => (
                  <CommandGroup
                    key={providerId}
                    heading={providerNameMap[providerId] || providerId}
                  >
                    {models.map((model) => {
                      const isSelected =
                        selectedModel?.provider === providerId &&
                        selectedModel?.name === model.apiName;

                      return (
                        <CommandItem
                          key={`${providerId}-${model.apiName}`}
                          value={`${providerId}-${model.apiName}`}
                          onSelect={() => handleModelSelect(model, providerId)}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckIcon
                              className={cn(
                                "size-4 shrink-0",
                                isSelected ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="truncate">
                              {model.displayName}
                            </span>
                          </div>
                          {model.contextWindow && (
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatContextWindow(model.contextWindow)}
                            </span>
                          )}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ),
              )
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
