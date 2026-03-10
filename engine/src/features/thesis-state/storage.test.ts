import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  appendSessionId,
  clearThesisState,
  createThesisState,
  getPlanName,
  getPlanProgress,
  readThesisState,
  writeThesisState,
} from "./storage";
import type { ThesisState } from "./types";

describe("thesis-state", () => {
  const TEST_DIR = join(tmpdir(), "thesis-state-test-" + Date.now());
  const EULER_DIR = join(TEST_DIR, ".anyon");

  beforeEach(() => {
    if (!existsSync(TEST_DIR)) {
      mkdirSync(TEST_DIR, { recursive: true });
    }
    if (!existsSync(EULER_DIR)) {
      mkdirSync(EULER_DIR, { recursive: true });
    }
    clearThesisState(TEST_DIR);
  });

  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe("readThesisState", () => {
    test("should return null when no thesis.json exists", () => {
      // given - no thesis.json file
      // when
      const result = readThesisState(TEST_DIR);
      // then
      expect(result).toBeNull();
    });

    test("should return null for JSON null value", () => {
      //#given - thesis.json containing null
      const thesisFile = join(EULER_DIR, "thesis.json");
      writeFileSync(thesisFile, "null");

      //#when
      const result = readThesisState(TEST_DIR);

      //#then
      expect(result).toBeNull();
    });

    test("should return null for JSON primitive value", () => {
      //#given - thesis.json containing a string
      const thesisFile = join(EULER_DIR, "thesis.json");
      writeFileSync(thesisFile, '"just a string"');

      //#when
      const result = readThesisState(TEST_DIR);

      //#then
      expect(result).toBeNull();
    });

    test("should default session_ids to [] when missing from JSON", () => {
      //#given - thesis.json without session_ids field
      const thesisFile = join(EULER_DIR, "thesis.json");
      writeFileSync(
        thesisFile,
        JSON.stringify({
          active_plan: "/path/to/plan.md",
          started_at: "2026-01-01T00:00:00Z",
          plan_name: "plan",
        }),
      );

      //#when
      const result = readThesisState(TEST_DIR);

      //#then
      expect(result).not.toBeNull();
      expect(result!.session_ids).toEqual([]);
    });

    test("should default session_ids to [] when not an array", () => {
      //#given - thesis.json with session_ids as a string
      const thesisFile = join(EULER_DIR, "thesis.json");
      writeFileSync(
        thesisFile,
        JSON.stringify({
          active_plan: "/path/to/plan.md",
          started_at: "2026-01-01T00:00:00Z",
          session_ids: "not-an-array",
          plan_name: "plan",
        }),
      );

      //#when
      const result = readThesisState(TEST_DIR);

      //#then
      expect(result).not.toBeNull();
      expect(result!.session_ids).toEqual([]);
    });

    test("should default session_ids to [] for empty object", () => {
      //#given - thesis.json with empty object
      const thesisFile = join(EULER_DIR, "thesis.json");
      writeFileSync(thesisFile, JSON.stringify({}));

      //#when
      const result = readThesisState(TEST_DIR);

      //#then
      expect(result).not.toBeNull();
      expect(result!.session_ids).toEqual([]);
    });

    test("should read valid thesis state", () => {
      // given - valid thesis.json
      const state: ThesisState = {
        active_plan: "/path/to/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1", "session-2"],
        plan_name: "my-plan",
      };
      writeThesisState(TEST_DIR, state);

      // when
      const result = readThesisState(TEST_DIR);

      // then
      expect(result).not.toBeNull();
      expect(result?.active_plan).toBe("/path/to/plan.md");
      expect(result?.session_ids).toEqual(["session-1", "session-2"]);
      expect(result?.plan_name).toBe("my-plan");
    });
  });

  describe("writeThesisState", () => {
    test("should write state and create .anyon directory if needed", () => {
      // given - state to write
      const state: ThesisState = {
        active_plan: "/test/plan.md",
        started_at: "2026-01-02T12:00:00Z",
        session_ids: ["ses-123"],
        plan_name: "test-plan",
      };

      // when
      const success = writeThesisState(TEST_DIR, state);
      const readBack = readThesisState(TEST_DIR);

      // then
      expect(success).toBe(true);
      expect(readBack).not.toBeNull();
      expect(readBack?.active_plan).toBe("/test/plan.md");
    });
  });

  describe("appendSessionId", () => {
    test("should append new session id to existing state", () => {
      // given - existing state with one session
      const state: ThesisState = {
        active_plan: "/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
      };
      writeThesisState(TEST_DIR, state);

      // when
      const result = appendSessionId(TEST_DIR, "session-2");

      // then
      expect(result).not.toBeNull();
      expect(result?.session_ids).toEqual(["session-1", "session-2"]);
    });

    test("should not duplicate existing session id", () => {
      // given - state with session-1 already
      const state: ThesisState = {
        active_plan: "/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
      };
      writeThesisState(TEST_DIR, state);

      // when
      appendSessionId(TEST_DIR, "session-1");
      const result = readThesisState(TEST_DIR);

      // then
      expect(result?.session_ids).toEqual(["session-1"]);
    });

    test("should return null when no state exists", () => {
      // given - no thesis.json
      // when
      const result = appendSessionId(TEST_DIR, "new-session");
      // then
      expect(result).toBeNull();
    });

    test("should not crash when thesis.json has no session_ids field", () => {
      //#given - thesis.json without session_ids
      const thesisFile = join(EULER_DIR, "thesis.json");
      writeFileSync(
        thesisFile,
        JSON.stringify({
          active_plan: "/plan.md",
          started_at: "2026-01-01T00:00:00Z",
          plan_name: "plan",
        }),
      );

      //#when
      const result = appendSessionId(TEST_DIR, "ses-new");

      //#then - should not crash and should contain the new session
      expect(result).not.toBeNull();
      expect(result!.session_ids).toContain("ses-new");
    });
  });

  describe("clearThesisState", () => {
    test("should remove thesis.json", () => {
      // given - existing state
      const state: ThesisState = {
        active_plan: "/plan.md",
        started_at: "2026-01-02T10:00:00Z",
        session_ids: ["session-1"],
        plan_name: "plan",
      };
      writeThesisState(TEST_DIR, state);

      // when
      const success = clearThesisState(TEST_DIR);
      const result = readThesisState(TEST_DIR);

      // then
      expect(success).toBe(true);
      expect(result).toBeNull();
    });

    test("should succeed even when no file exists", () => {
      // given - no thesis.json
      // when
      const success = clearThesisState(TEST_DIR);
      // then
      expect(success).toBe(true);
    });
  });

  describe("getPlanProgress", () => {
    test("should count completed and uncompleted checkboxes", () => {
      // given - plan file with checkboxes
      const planPath = join(TEST_DIR, "test-plan.md");
      writeFileSync(
        planPath,
        `# Plan
- [ ] Task 1
- [x] Task 2  
- [ ] Task 3
- [X] Task 4
`,
      );

      // when
      const progress = getPlanProgress(planPath);

      // then
      expect(progress.total).toBe(4);
      expect(progress.completed).toBe(2);
      expect(progress.isComplete).toBe(false);
    });

    test("should count space-indented unchecked checkbox", () => {
      // given - plan file with a two-space indented checkbox
      const planPath = join(TEST_DIR, "space-indented-plan.md");
      writeFileSync(
        planPath,
        `# Plan
  - [ ] indented task
`,
      );

      // when
      const progress = getPlanProgress(planPath);

      // then
      expect(progress.total).toBe(1);
      expect(progress.completed).toBe(0);
      expect(progress.isComplete).toBe(false);
    });

    test("should count tab-indented unchecked checkbox", () => {
      // given - plan file with a tab-indented checkbox
      const planPath = join(TEST_DIR, "tab-indented-plan.md");
      writeFileSync(
        planPath,
        `# Plan
	- [ ] tab-indented task
`,
      );

      // when
      const progress = getPlanProgress(planPath);

      // then
      expect(progress.total).toBe(1);
      expect(progress.completed).toBe(0);
      expect(progress.isComplete).toBe(false);
    });

    test("should count mixed top-level checked and indented unchecked checkboxes", () => {
      // given - plan file with checked top-level and unchecked indented task
      const planPath = join(TEST_DIR, "mixed-indented-plan.md");
      writeFileSync(
        planPath,
        `# Plan
- [x] top-level completed task
  - [ ] nested unchecked task
`,
      );

      // when
      const progress = getPlanProgress(planPath);

      // then
      expect(progress.total).toBe(2);
      expect(progress.completed).toBe(1);
      expect(progress.isComplete).toBe(false);
    });

    test("should count space-indented completed checkbox", () => {
      // given - plan file with a two-space indented completed checkbox
      const planPath = join(TEST_DIR, "indented-completed-plan.md");
      writeFileSync(
        planPath,
        `# Plan
  - [x] indented completed task
`,
      );

      // when
      const progress = getPlanProgress(planPath);

      // then
      expect(progress.total).toBe(1);
      expect(progress.completed).toBe(1);
      expect(progress.isComplete).toBe(true);
    });

    test("should return isComplete true when all checked", () => {
      // given - all tasks completed
      const planPath = join(TEST_DIR, "complete-plan.md");
      writeFileSync(
        planPath,
        `# Plan
- [x] Task 1
- [X] Task 2
`,
      );

      // when
      const progress = getPlanProgress(planPath);

      // then
      expect(progress.total).toBe(2);
      expect(progress.completed).toBe(2);
      expect(progress.isComplete).toBe(true);
    });

    test("should return isComplete true for empty plan", () => {
      // given - plan with no checkboxes
      const planPath = join(TEST_DIR, "empty-plan.md");
      writeFileSync(planPath, "# Plan\nNo tasks here");

      // when
      const progress = getPlanProgress(planPath);

      // then
      expect(progress.total).toBe(0);
      expect(progress.isComplete).toBe(true);
    });

    test("should handle non-existent file", () => {
      // given - non-existent file
      // when
      const progress = getPlanProgress("/non/existent/file.md");
      // then
      expect(progress.total).toBe(0);
      expect(progress.isComplete).toBe(true);
    });
  });

  describe("getPlanName", () => {
    test("should extract plan name from path", () => {
      // given
      const path = "/home/user/.anyon/plans/project/my-feature.md";
      // when
      const name = getPlanName(path);
      // then
      expect(name).toBe("my-feature");
    });
  });

  describe("createThesisState", () => {
    test("should create state with correct fields", () => {
      // given
      const planPath = "/path/to/auth-refactor.md";
      const sessionId = "ses-abc123";

      // when
      const state = createThesisState(planPath, sessionId);

      // then
      expect(state.active_plan).toBe(planPath);
      expect(state.session_ids).toEqual([sessionId]);
      expect(state.plan_name).toBe("auth-refactor");
      expect(state.started_at).toBeDefined();
    });

    test("should include agent field when provided", () => {
      //#given - plan path, session id, and agent type
      const planPath = "/path/to/feature.md";
      const sessionId = "ses-xyz789";
      const agent = "taskmaster";

      //#when - createThesisState is called with agent
      const state = createThesisState(planPath, sessionId, agent);

      //#then - state should include the agent field
      expect(state.agent).toBe("taskmaster");
      expect(state.active_plan).toBe(planPath);
      expect(state.session_ids).toEqual([sessionId]);
      expect(state.plan_name).toBe("feature");
    });

    test("should allow agent to be undefined", () => {
      //#given - plan path and session id without agent
      const planPath = "/path/to/legacy.md";
      const sessionId = "ses-legacy";

      //#when - createThesisState is called without agent
      const state = createThesisState(planPath, sessionId);

      //#then - state should not have agent field (backward compatible)
      expect(state.agent).toBeUndefined();
    });
  });
});
