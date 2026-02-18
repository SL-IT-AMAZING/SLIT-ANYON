import { AgentPicker } from "./AgentPicker";
import { BoosterToggle } from "./BoosterToggle";
import { ContextFilesPicker } from "./ContextFilesPicker";
import { ThinkingLevelPicker } from "./ThinkingLevelPicker";

export function ChatInputControls({
  showContextFilesPicker = false,
}: {
  showContextFilesPicker?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <AgentPicker />
      <ThinkingLevelPicker />
      <BoosterToggle />
      {showContextFilesPicker && <ContextFilesPicker />}
    </div>
  );
}
