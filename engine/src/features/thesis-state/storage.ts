/**
 * Thesis State Storage
 *
 * Handles reading/writing thesis.json for active plan tracking.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { NEWTON_PLANS_DIR, THESIS_DIR, THESIS_FILE } from "./constants";
import type { PlanProgress, ThesisState } from "./types";

export function getThesisFilePath(directory: string): string {
  return join(directory, THESIS_DIR, THESIS_FILE);
}

export function readThesisState(directory: string): ThesisState | null {
  const filePath = getThesisFilePath(directory);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    if (!Array.isArray(parsed.session_ids)) {
      parsed.session_ids = [];
    }
    return parsed as ThesisState;
  } catch {
    return null;
  }
}

export function writeThesisState(
  directory: string,
  state: ThesisState,
): boolean {
  const filePath = getThesisFilePath(directory);

  try {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, JSON.stringify(state, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

export function appendSessionId(
  directory: string,
  sessionId: string,
): ThesisState | null {
  const state = readThesisState(directory);
  if (!state) return null;

  if (!state.session_ids?.includes(sessionId)) {
    if (!Array.isArray(state.session_ids)) {
      state.session_ids = [];
    }
    state.session_ids.push(sessionId);
    if (writeThesisState(directory, state)) {
      return state;
    }
  }

  return state;
}

export function clearThesisState(directory: string): boolean {
  const filePath = getThesisFilePath(directory);

  try {
    if (existsSync(filePath)) {
      const { unlinkSync } = require("node:fs");
      unlinkSync(filePath);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Find Strategist plan files for this project.
 * Strategist stores plans at: {project}/.anyon/plans/{name}.md
 */
export function findStrategistPlans(directory: string): string[] {
  const plansDir = join(directory, NEWTON_PLANS_DIR);

  if (!existsSync(plansDir)) {
    return [];
  }

  try {
    const files = readdirSync(plansDir);
    return files
      .filter((f) => f.endsWith(".md"))
      .map((f) => join(plansDir, f))
      .sort((a, b) => {
        // Sort by modification time, newest first
        const aStat = require("node:fs").statSync(a);
        const bStat = require("node:fs").statSync(b);
        return bStat.mtimeMs - aStat.mtimeMs;
      });
  } catch {
    return [];
  }
}

/**
 * Parse a plan file and count checkbox progress.
 */
export function getPlanProgress(planPath: string): PlanProgress {
  if (!existsSync(planPath)) {
    return { total: 0, completed: 0, isComplete: true };
  }

  try {
    const content = readFileSync(planPath, "utf-8");

    // Match markdown checkboxes: - [ ] or - [x] or - [X]
    const uncheckedMatches = content.match(/^\s*[-*]\s*\[\s*\]/gm) || [];
    const checkedMatches = content.match(/^\s*[-*]\s*\[[xX]\]/gm) || [];

    const total = uncheckedMatches.length + checkedMatches.length;
    const completed = checkedMatches.length;

    return {
      total,
      completed,
      isComplete: total === 0 || completed === total,
    };
  } catch {
    return { total: 0, completed: 0, isComplete: true };
  }
}

/**
 * Extract plan name from file path.
 */
export function getPlanName(planPath: string): string {
  return basename(planPath, ".md");
}

/**
 * Create a new thesis state for a plan.
 */
export function createThesisState(
  planPath: string,
  sessionId: string,
  agent?: string,
  worktreePath?: string,
): ThesisState {
  return {
    active_plan: planPath,
    started_at: new Date().toISOString(),
    session_ids: [sessionId],
    plan_name: getPlanName(planPath),
    ...(agent !== undefined ? { agent } : {}),
    ...(worktreePath !== undefined ? { worktree_path: worktreePath } : {}),
  };
}
