import { selectedOmoAgentIdAtom } from "@/atoms/omoAtoms";
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
import { useOmoAgents } from "@/hooks/useOmoAgents";
import { cn } from "@/lib/utils";
import { useAtom } from "jotai";
import { Bot, CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useMemo, useState } from "react";

const KIND_LABELS: Record<string, string> = {
  primary: "Primary",
  subagent: "Subagent",
};

export function OmoAgentSelector() {
  const [open, setOpen] = useState(false);
  const { agents } = useOmoAgents(open);
  const [selectedAgentId, setSelectedAgentId] = useAtom(selectedOmoAgentIdAtom);

  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return agents[0] ?? null;
    return agents.find((a) => a.id === selectedAgentId) ?? agents[0] ?? null;
  }, [agents, selectedAgentId]);

  const handleSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    setOpen(false);
  };

  // Group agents by kind
  const primaryAgents = agents.filter((a) => a.kind === "primary");
  const subAgents = agents.filter((a) => a.kind === "subagent");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 max-w-[160px] justify-between gap-1 px-2 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
            data-testid="omo-agent-selector"
          />
        }
      >
        <Bot className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {selectedAgent ? selectedAgent.name : "OMO Agent"}
        </span>
        <ChevronsUpDownIcon className="h-3 w-3 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search OMO agents..." />
          <CommandList>
            <CommandEmpty>No OMO agents found.</CommandEmpty>
            {primaryAgents.length > 0 && (
              <CommandGroup heading={KIND_LABELS.primary}>
                {primaryAgents.map((agent) => (
                  <AgentItem
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgent?.id === agent.id}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
            )}
            {subAgents.length > 0 && (
              <CommandGroup heading={KIND_LABELS.subagent}>
                {subAgents.map((agent) => (
                  <AgentItem
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgent?.id === agent.id}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AgentItem({
  agent,
  isSelected,
  onSelect,
}: {
  agent: { id: string; name: string; description: string; icon?: string };
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <CommandItem
      value={agent.name}
      onSelect={() => onSelect(agent.id)}
      className="flex items-center gap-3 py-2 px-3"
    >
      {agent.icon ? (
        <span className="text-base shrink-0">{agent.icon}</span>
      ) : (
        <Bot className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-sm">{agent.name}</span>
        {agent.description && (
          <span className="truncate text-xs text-muted-foreground">
            {agent.description}
          </span>
        )}
      </div>
      <CheckIcon
        className={cn(
          "ml-auto h-4 w-4 shrink-0",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
    </CommandItem>
  );
}
