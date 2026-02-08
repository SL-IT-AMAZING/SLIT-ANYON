import { McpToolsPicker } from "@/components/McpToolsPicker";
import { useSettings } from "@/hooks/useSettings";
import { AgentPicker } from "./AgentPicker";
import { ChatModeSelector } from "./ChatModeSelector";
import { ContextFilesPicker } from "./ContextFilesPicker";
import { ModelPicker } from "./ModelPicker";
import { ProModeSelector } from "./ProModeSelector";

export function ChatInputControls({
  showContextFilesPicker = false,
}: {
  showContextFilesPicker?: boolean;
}) {
  const { settings } = useSettings();

  return (
    <div className="flex items-center gap-1">
      <ChatModeSelector />
      {settings?.selectedChatMode === "agent" && <McpToolsPicker />}
      <AgentPicker />
      <ModelPicker />
      <ProModeSelector />
      {showContextFilesPicker && <ContextFilesPicker />}
    </div>
  );
}
