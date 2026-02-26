/**
 * Register All OMO Hooks — Bulk registration entry point.
 *
 * Imports all individual hook registration functions and calls them
 * against the provided HookRegistry. This is the single call site
 * that the runtime uses to wire up all OMO hooks at startup.
 */
import type { HookRegistry } from "../hook_system";

import { registerContextInjectorHook } from "./context_injector";
import { registerDirectoryAgentsInjectorHook } from "./directory_agents_injector";
import { registerDirectoryReadmeInjectorHook } from "./directory_readme_injector";
// --- Critical hooks ---
import { registerRalphLoopHook } from "./ralph_loop";
import { registerRulesInjectorHook } from "./rules_injector";
import { registerThinkModeHook } from "./think_mode";
import { registerTodoContinuationHook } from "./todo_continuation";

import { registerAgentUsageReminderHook } from "./agent_usage_reminder";
import { registerBackgroundNotificationHook } from "./background_notification";
// --- Important hooks ---
import { registerContextWindowMonitorHook } from "./context_window_monitor";
import { registerContextWindowRecoveryHook } from "./context_window_recovery";
import { registerDelegateTaskRetryHook } from "./delegate_task_retry";
import { registerEditErrorRecoveryHook } from "./edit_error_recovery";
import { registerThinkingBlockValidatorHook } from "./thinking_block_validator";
import { registerToolOutputTruncatorHook } from "./tool_output_truncator";

import { registerAutoSlashCommandHook } from "./auto_slash_command";
import { registerBoulderStateHook } from "./boulder_state";
import { registerEmptyTaskResponseDetectorHook } from "./empty_task_response_detector";
import { registerInteractiveBashSessionHook } from "./interactive_bash_session";
// --- Nice-to-have hooks ---
import { registerKeywordDetectorHook } from "./keyword_detector";
import { registerStartWorkHook } from "./start_work";
import { registerTaskResumeInfoHook } from "./task_resume_info";

// --- V3 hooks: atlas, claude-code-bridge, compaction, session recovery ---
import { registerAtlasHook } from "./atlas";
import { registerBackgroundCompactionHook } from "./background_compaction";
import { registerClaudeCodeBridgeHook } from "./claude_code_bridge";
import { registerCommentCheckerHook } from "./comment_checker";
import { registerCompactionContextInjectorHook } from "./compaction_context_injector";
import { registerPrometheusMdOnlyHook } from "./prometheus_md_only";
import { registerSessionRecoveryHook } from "./session_recovery";

/**
 * Register all OMO hooks with the given registry.
 *
 * Hooks are registered in groups by importance. Within each group,
 * the individual hook's priority determines execution order.
 */
export function registerAllOmoHooks(registry: HookRegistry): void {
  // --- Critical: context injection (messages.transform, low priority numbers = early) ---
  registerThinkingBlockValidatorHook(registry); // priority 3
  registerThinkModeHook(registry); // priority 5
  registerRulesInjectorHook(registry); // priority 10
  registerDirectoryAgentsInjectorHook(registry); // priority 15
  registerDirectoryReadmeInjectorHook(registry); // priority 16
  registerContextInjectorHook(registry); // priority 20

  // --- Important: tool execution hooks ---
  registerToolOutputTruncatorHook(registry); // priority 10
  registerAgentUsageReminderHook(registry); // priority 30
  registerInteractiveBashSessionHook(registry); // priority 40
  registerDelegateTaskRetryHook(registry); // priority 70
  registerEditErrorRecoveryHook(registry); // priority 80

  // --- Important: step lifecycle hooks ---
  registerTaskResumeInfoHook(registry); // priority 40 (step.before)
  registerEmptyTaskResponseDetectorHook(registry); // priority 45
  registerContextWindowMonitorHook(registry); // priority 50
  registerContextWindowRecoveryHook(registry); // priority 55
  registerBackgroundNotificationHook(registry); // priority 60

  // --- Critical: continuation hooks (agent.step.after, high priority numbers = late) ---
  registerTodoContinuationHook(registry); // priority 90
  registerBoulderStateHook(registry); // priority 95
  registerRalphLoopHook(registry); // priority 100

  // --- Nice-to-have: chat message hooks ---
  registerKeywordDetectorHook(registry); // priority 20
  registerAutoSlashCommandHook(registry); // priority 25
  registerStartWorkHook(registry); // priority 30

  // --- V3: Atlas (turn-level auto-continuation + delegation enforcement) ---
  registerAtlasHook(registry); // agent.turn.stop (50) + agent.step.after (85)

  // --- V3: Claude-code-bridge (transcript, todowrite, error state, compaction) ---
  registerClaudeCodeBridgeHook(registry); // multiple hook points

  // --- V3: Compaction hooks ---
  registerBackgroundCompactionHook(registry); // compaction.before/after (40)
  registerCompactionContextInjectorHook(registry); // compaction.after (60)

  // --- V3: Additional hooks ---
  registerSessionRecoveryHook(registry); // tool.execute.after, step lifecycle
  registerPrometheusMdOnlyHook(registry); // tool.execute.before for planning agents
  registerCommentCheckerHook(registry); // tool.execute.after for write/edit tools
}
