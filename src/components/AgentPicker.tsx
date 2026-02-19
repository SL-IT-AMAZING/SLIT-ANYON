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
import { useSettings } from "@/hooks/useSettings";
import { languageModelClient } from "@/ipc/types/language-model";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import expertIcon from "../../assets/expert.svg";
import mainBuilderIcon from "../../assets/main-builder.svg";
import plannerIcon from "../../assets/planner.svg";

const AGENT_ICONS: Record<string, string> = {
  Sisyphus: mainBuilderIcon,
  Hephaestus: expertIcon,
  Atlas: plannerIcon,
};

const FALLBACK_AGENTS: {
  name: string;
  description: string;
  mode: "primary" | "subagent" | "all";
  native: boolean;
  color?: string;
}[] = [
  { name: "Sisyphus", description: "", mode: "primary", native: false },
  { name: "Hephaestus", description: "", mode: "primary", native: false },
  { name: "Atlas", description: "", mode: "primary", native: false },
];

function getBaseAgentName(name: string): string {
  const idx = name.indexOf(" (");
  return idx === -1 ? name : name.slice(0, idx);
}

function useAgentDisplayName() {
  const { t } = useTranslation("app");
  return useCallback(
    (name: string) => {
      const base = getBaseAgentName(name);
      const translated = t(`agents.${base}.name`, { defaultValue: "" });
      return translated || name;
    },
    [t],
  );
}

function useAgentDescription() {
  const { t } = useTranslation("app");
  return useCallback(
    (name: string, fallback?: string) => {
      const base = getBaseAgentName(name);
      const translated = t(`agents.${base}.description`, {
        defaultValue: "",
      });
      return translated || fallback || "";
    },
    [t],
  );
}

export function AgentPicker() {
  const { t } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const { settings, updateSettings } = useSettings();
  const getDisplayName = useAgentDisplayName();
  const getDescription = useAgentDescription();

  const { data: serverAgents } = useQuery({
    queryKey: ["opencode-agents"] as const,
    queryFn: () => languageModelClient.getOpenCodeAgents(),
  });

  const agents = serverAgents?.length ? serverAgents : FALLBACK_AGENTS;

  const selectedAgent = useMemo(() => {
    const agentName = settings?.selectedAgent;
    if (agentName) {
      const exact = agents.find((a) => a.name === agentName);
      if (exact) return exact;
      const baseName = getBaseAgentName(agentName);
      const base = agents.find((a) => getBaseAgentName(a.name) === baseName);
      if (base) return base;
    }
    return agents[0];
  }, [agents, settings?.selectedAgent]);

  const handleSelect = (agent: (typeof agents)[number]) => {
    updateSettings({ selectedAgent: agent.name });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="h-8 max-w-[140px] justify-between gap-1 px-2 text-xs"
            data-testid="agent-picker"
          />
        }
      >
        <span className="truncate">
          {selectedAgent ? getDisplayName(selectedAgent.name) : "Agent"}
        </span>
        <ChevronsUpDownIcon className="h-3 w-3 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("placeholders.searchAgents")} />
          <CommandList>
            <CommandEmpty>No agents found.</CommandEmpty>
            <CommandGroup>
              {agents.map((agent) => {
                const displayName = getDisplayName(agent.name);
                const description = getDescription(
                  agent.name,
                  agent.description,
                );
                return (
                  <CommandItem
                    key={agent.name}
                    value={displayName}
                    onSelect={() => handleSelect(agent)}
                    className="flex items-center gap-3 py-2.5 px-3"
                  >
                    {AGENT_ICONS[getBaseAgentName(agent.name)] ? (
                      <img
                        src={AGENT_ICONS[getBaseAgentName(agent.name)]}
                        alt=""
                        className="h-9 w-9 shrink-0 dark:invert"
                      />
                    ) : (
                      agent.color && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: agent.color }}
                        />
                      )
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">
                        {displayName}
                      </span>
                      {description && (
                        <span className="truncate text-xs text-muted-foreground">
                          {description}
                        </span>
                      )}
                    </div>
                    <CheckIcon
                      className={cn(
                        "ml-auto h-4 w-4 shrink-0",
                        selectedAgent?.name === agent.name
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
