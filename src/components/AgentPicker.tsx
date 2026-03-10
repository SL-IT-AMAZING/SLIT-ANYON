import { selectedAppIdAtom } from "@/atoms/appAtoms";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLoadApp } from "@/hooks/useLoadApp";
import { useSettings } from "@/hooks/useSettings";
import { languageModelClient } from "@/ipc/types/language-model";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

const FALLBACK_AGENTS: {
  name: string;
  description: string;
  mode: "primary" | "subagent" | "all";
  native: boolean;
  color?: string;
  hidden?: boolean;
}[] = [
  {
    name: "Builder",
    description: "Main agent for planning and building your product",
    mode: "primary",
    native: false,
  },
  {
    name: "Craftsman",
    description: "Implementation and error-fixing specialist",
    mode: "primary",
    native: false,
  },
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
  const { settings, updateSettings } = useSettings();
  const getDisplayName = useAgentDisplayName();
  const getDescription = useAgentDescription();

  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const { app } = useLoadApp(selectedAppId);

  const { data: serverAgents } = useQuery({
    queryKey: queryKeys.openCodeAgents.byAppPath({ appPath: app?.path }),
    queryFn: () =>
      languageModelClient.getOpenCodeAgents({ appPath: app?.path }),
    enabled: !!app?.path,
  });

  const agents = useMemo(() => {
    const source = serverAgents?.length ? serverAgents : FALLBACK_AGENTS;
    return source.filter((agent) => !agent.hidden);
  }, [serverAgents]);

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
  };

  return (
    <Select
      value={selectedAgent?.name}
      onValueChange={(value) => {
        const agent = agents.find((item) => item.name === value);
        if (agent) {
          handleSelect(agent);
        }
      }}
    >
      <SelectTrigger
        size="sm"
        className="h-8 w-auto max-w-[110px] border-0 bg-transparent px-2 text-xs text-muted-foreground shadow-none focus-visible:ring-0"
        data-testid="agent-picker"
      >
        <SelectValue placeholder="Agent">
          {selectedAgent ? getDisplayName(selectedAgent.name) : "Agent"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[240px]">
        {agents.map((agent) => {
          const displayName = getDisplayName(agent.name);
          const description = getDescription(agent.name, agent.description);
          return (
            <SelectItem key={agent.name} value={agent.name}>
              <div className="flex min-w-0 flex-col items-start">
                <span className="truncate font-medium">{displayName}</span>
                {description && (
                  <span className="truncate text-xs text-muted-foreground">
                    {description}
                  </span>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
