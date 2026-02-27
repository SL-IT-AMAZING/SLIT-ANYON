import { omoCommandPaletteOpenAtom } from "@/atoms/omoAtoms";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useOmoCommands } from "@/hooks/useOmoCommands";
import { useAtom } from "jotai";
import { Slash, Terminal } from "lucide-react";

const SCOPE_LABELS: Record<string, string> = {
  builtin: "Built-in",
  user: "User",
  project: "Project",
};

export function OmoCommandPalette({
  onSelectCommand,
}: {
  onSelectCommand: (commandName: string) => void;
}) {
  const [open, setOpen] = useAtom(omoCommandPaletteOpenAtom);
  const { commands } = useOmoCommands(open);

  const handleSelect = (commandName: string) => {
    setOpen(false);
    onSelectCommand(commandName);
  };

  // Group by scope
  const grouped = commands.reduce(
    (acc, cmd) => {
      const scope = cmd.scope || "builtin";
      if (!acc[scope]) acc[scope] = [];
      acc[scope].push(cmd);
      return acc;
    },
    {} as Record<string, typeof commands>,
  );

  const scopeOrder = ["project", "user", "builtin"];

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="OMO Commands"
      description="Search and run OMO commands"
      data-testid="omo-command-palette"
    >
      <CommandInput placeholder="Search OMO commands..." />
      <CommandList>
        <CommandEmpty>No OMO commands found.</CommandEmpty>
        {scopeOrder.map((scope) => {
          const cmds = grouped[scope];
          if (!cmds?.length) return null;
          return (
            <CommandGroup key={scope} heading={SCOPE_LABELS[scope] ?? scope}>
              {cmds.map((cmd) => (
                <CommandItem
                  key={cmd.name}
                  value={cmd.name}
                  onSelect={() => handleSelect(cmd.name)}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                    {cmd.name.startsWith("/") ? (
                      <Slash className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium text-sm">{cmd.name}</span>
                    {cmd.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {cmd.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
