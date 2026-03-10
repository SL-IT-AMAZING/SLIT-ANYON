import type { PluginInput } from "@opencode-ai/plugin"
import { appendSessionId, getPlanProgress, readThesisState } from "../../features/thesis-state"
import { collectGitDiffStats, formatFileChanges } from "../../shared/git-worktree"
import { log } from "../../shared/logger"
import { isCallerOrchestrator } from "../../shared/session-utils"
import { isAnyonPath } from "./anyon-path"
import { HOOK_NAME } from "./hook-name"
import { extractSessionIdFromOutput } from "./subagent-session-id"
import { DIRECT_WORK_REMINDER } from "./system-reminder-templates"
import type { ToolExecuteAfterInput, ToolExecuteAfterOutput } from "./types"
import { buildOrchestratorReminder, buildStandaloneVerificationReminder } from "./verification-reminders"
import { isWriteOrEditToolName } from "./write-edit-tool-policy"

export function createToolExecuteAfterHandler(input: {
  ctx: PluginInput
  pendingFilePaths: Map<string, string>
  autoCommit: boolean
  }): (toolInput: ToolExecuteAfterInput, toolOutput: ToolExecuteAfterOutput) => Promise<void> {
  const { ctx, pendingFilePaths, autoCommit } = input
  return async (toolInput, toolOutput): Promise<void> => {
    // Guard against undefined output (e.g., from /review command - see issue #1035)
    if (!toolOutput) {
      return
    }

    if (!(await isCallerOrchestrator(toolInput.sessionID, ctx.client))) {
      return
    }

    if (isWriteOrEditToolName(toolInput.tool)) {
      let filePath = toolInput.callID ? pendingFilePaths.get(toolInput.callID) : undefined
      if (toolInput.callID) {
        pendingFilePaths.delete(toolInput.callID)
      }
      if (!filePath) {
        filePath = toolOutput.metadata?.filePath as string | undefined
      }
      if (filePath && !isAnyonPath(filePath)) {
        toolOutput.output = (toolOutput.output || "") + DIRECT_WORK_REMINDER
        log(`[${HOOK_NAME}] Direct work reminder appended`, {
          sessionID: toolInput.sessionID,
          tool: toolInput.tool,
          filePath,
        })
      }
      return
    }

    if (toolInput.tool !== "task") {
      return
    }

    const outputStr = toolOutput.output && typeof toolOutput.output === "string" ? toolOutput.output : ""
    const isBackgroundLaunch = outputStr.includes("Background task launched") || outputStr.includes("Background task continued")
    if (isBackgroundLaunch) {
      return
    }

    if (toolOutput.output && typeof toolOutput.output === "string") {
      const gitStats = collectGitDiffStats(ctx.directory)
      const fileChanges = formatFileChanges(gitStats)
      const subagentSessionId = extractSessionIdFromOutput(toolOutput.output)

      const thesisState = readThesisState(ctx.directory)
      if (thesisState) {
        const progress = getPlanProgress(thesisState.active_plan)

        if (toolInput.sessionID && !thesisState.session_ids?.includes(toolInput.sessionID)) {
          appendSessionId(ctx.directory, toolInput.sessionID)
          log(`[${HOOK_NAME}] Appended session to thesis`, {
            sessionID: toolInput.sessionID,
            plan: thesisState.plan_name,
          })
        }

        // Preserve original subagent response - critical for debugging failed tasks
        const originalResponse = toolOutput.output

toolOutput.output = `
## SUBAGENT WORK COMPLETED

${fileChanges}

---

**Subagent Response:**

${originalResponse}

<system-reminder>
${buildOrchestratorReminder(thesisState.plan_name, progress, subagentSessionId, autoCommit)}
</system-reminder>`

        log(`[${HOOK_NAME}] Output transformed for orchestrator mode (thesis)`, {
          plan: thesisState.plan_name,
          progress: `${progress.completed}/${progress.total}`,
          fileCount: gitStats.length,
        })
      } else {
        toolOutput.output += `\n<system-reminder>\n${buildStandaloneVerificationReminder(subagentSessionId)}\n</system-reminder>`

        log(`[${HOOK_NAME}] Verification reminder appended for orchestrator`, {
          sessionID: toolInput.sessionID,
          fileCount: gitStats.length,
        })
      }
    }
  }
}
