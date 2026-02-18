import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpIcon, StopCircleIcon } from "lucide-react";

import { homeChatInputValueAtom } from "@/atoms/chatAtoms";
import { useAttachments } from "@/hooks/useAttachments";
import { useSettings } from "@/hooks/useSettings";
import { useStreamChat } from "@/hooks/useStreamChat";
import { useTypingPlaceholder } from "@/hooks/useTypingPlaceholder";
import type { HomeSubmitOptions } from "@/pages/home";
import { useAtom } from "jotai";
import { usePostHog } from "posthog-js/react";
import { useTranslation } from "react-i18next";
import { ChatInputControls } from "../ChatInputControls";
import { AttachmentsList } from "./AttachmentsList";
import { AuxiliaryActionsMenu } from "./AuxiliaryActionsMenu";
import { DragDropOverlay } from "./DragDropOverlay";
import { LexicalChatInput } from "./LexicalChatInput";

export function HomeChatInput({
  onSubmit,
}: {
  onSubmit: (options?: HomeSubmitOptions) => void;
}) {
  const { t } = useTranslation("chat");
  const posthog = usePostHog();
  const [inputValue, setInputValue] = useAtom(homeChatInputValueAtom);

  const { settings } = useSettings();
  const { isStreaming } = useStreamChat({
    hasChatId: false,
  }); // eslint-disable-line @typescript-eslint/no-unused-vars

  const typingText = useTypingPlaceholder([
    t("input.typingPhrase_ecommerce"),
    t("input.typingPhrase_infoPage"),
    t("input.typingPhrase_landingPage"),
  ]);
  const placeholder = typingText || t("input.placeholder");

  // Use the attachments hook
  const {
    attachments,
    isDraggingOver,
    handleFileSelect,
    removeAttachment,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearAttachments,
    handlePaste,
  } = useAttachments();

  // Custom submit function that wraps the provided onSubmit
  const handleCustomSubmit = () => {
    if ((!inputValue.trim() && attachments.length === 0) || isStreaming) {
      return;
    }

    // Call the parent's onSubmit handler with attachments
    onSubmit({ attachments });

    // Clear attachments as part of submission process
    clearAttachments();
    posthog.capture("chat:home_submit");
  };

  if (!settings) {
    return null; // Or loading state
  }

  return (
    <>
      <div
        className="px-3 pb-4 md:pb-6"
        data-testid="home-chat-input-container"
      >
        <div
          className={`relative flex flex-col border border-input rounded-2xl bg-background shadow-sm ${
            isDraggingOver ? "ring-2 ring-ring border-ring" : ""
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Attachments list */}
          <AttachmentsList
            attachments={attachments}
            onRemove={removeAttachment}
          />

          {/* Drag and drop overlay */}
          <DragDropOverlay isDraggingOver={isDraggingOver} />

          <div className="flex items-end gap-2 px-3 pb-2 pt-1">
            <LexicalChatInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleCustomSubmit}
              onPaste={handlePaste}
              placeholder={placeholder}
              disabled={isStreaming}
              excludeCurrentApp={false}
              disableSendButton={false}
              messageHistory={[]}
            />

            {isStreaming ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Cancel generation (unavailable here)"
                      className="flex items-center justify-center size-8 shrink-0 rounded-full bg-muted text-muted-foreground cursor-not-allowed"
                    />
                  }
                >
                  <StopCircleIcon size={20} />
                </TooltipTrigger>
                <TooltipContent>
                  Cancel generation (unavailable here)
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={handleCustomSubmit}
                      disabled={!inputValue.trim() && attachments.length === 0}
                      aria-label="Send message"
                      className="flex items-center justify-center size-8 shrink-0 rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90 disabled:opacity-30 disabled:pointer-events-none"
                    />
                  }
                >
                  <ArrowUpIcon size={16} />
                </TooltipTrigger>
                <TooltipContent>Send message</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="px-3 pb-2 flex items-center justify-between">
            <div className="flex items-center">
              <ChatInputControls showContextFilesPicker={false} />
            </div>

            <div className="flex items-center gap-2">
              <AuxiliaryActionsMenu
                onFileSelect={handleFileSelect}
                hideContextFilesPicker
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
