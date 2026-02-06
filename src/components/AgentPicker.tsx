import { useState, useMemo } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useSettings } from "@/hooks/useSettings";
import { languageModelClient } from "@/ipc/types/language-model";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function AgentPicker() {
  const [open, setOpen] = useState(false);
  const { settings, updateSettings } = useSettings();

  const { data: agents = [] } = useQuery({
    queryKey: ["opencode-agents"] as const,
    queryFn: () => languageModelClient.getOpenCodeAgents(),
  });

  const selectedAgent = useMemo(() => {
    const agentName = settings?.selectedAgent ?? "sisyphus";
    return agents.find((a) => a.name === agentName);
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
        <span className="truncate">{selectedAgent?.name ?? "sisyphus"}</span>
        <ChevronsUpDownIcon className="h-3 w-3 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search agents..." />
          <CommandList>
            <CommandEmpty>No agents found.</CommandEmpty>
            <CommandGroup>
              {agents.map((agent) => (
                <CommandItem
                  key={agent.name}
                  value={agent.name}
                  onSelect={() => handleSelect(agent)}
                  className="flex items-center gap-2"
                >
                  {agent.color && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: agent.color }}
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{agent.name}</span>
                    {agent.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {agent.description}
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
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
