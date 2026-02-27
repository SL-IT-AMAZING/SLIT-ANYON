/**
 * Thinking Block Validator Hook — Validates thinking blocks in messages.
 *
 * Ensures that thinking blocks in the message history conform to the
 * expected format. Removes or fixes malformed thinking blocks to prevent
 * API errors when sending message history back to the model.
 */
import log from "electron-log";

import type { HookHandler, HookRegistry } from "../hook_system";

const logger = log.scope("hook:thinking-block-validator");

/** Shape of a message content block. */
interface ContentBlock {
  type: string;
  text?: string;
  thinking?: string;
  signature?: string;
}

/** Shape of a message in the message array. */
interface Message {
  role: string;
  content: string | ContentBlock[];
}

/** Typed view of the input that may carry messages. */
interface ValidatorInput {
  messages?: Message[];
}

/** Typed view of the output we may mutate. */
interface ValidatorOutput {
  messages?: Message[];
  thinkingBlocksFixed?: number;
}

/** Check if a content block is a valid thinking block. */
function isValidThinkingBlock(block: ContentBlock): boolean {
  if (block.type !== "thinking") return true; // Not a thinking block — skip

  // Thinking blocks must have text content
  if (!block.thinking && !block.text) return false;

  return true;
}

export function registerThinkingBlockValidatorHook(
  registry: HookRegistry,
): void {
  const handler: HookHandler = async (input, output, _ctx) => {
    const inp = input as ValidatorInput;
    const messages = inp.messages;

    if (!messages || !Array.isArray(messages)) return;

    let fixedCount = 0;

    for (const message of messages) {
      if (!Array.isArray(message.content)) continue;

      // Filter out invalid thinking blocks
      const original = message.content as ContentBlock[];
      const filtered = original.filter((block) => {
        if (isValidThinkingBlock(block)) return true;
        fixedCount++;
        return false;
      });

      if (filtered.length !== original.length) {
        message.content = filtered;
      }
    }

    if (fixedCount > 0) {
      logger.log(`Removed ${fixedCount} malformed thinking block(s)`);
      const out = output as ValidatorOutput;
      out.thinkingBlocksFixed = fixedCount;
    }
  };

  registry.register(
    "messages.transform",
    "thinking-block-validator",
    handler,
    3,
    "global",
  );
}
