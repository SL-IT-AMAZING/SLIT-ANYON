import type { PersistLoopConfig } from "../../config";

export interface PersistLoopState {
  active: boolean;
  iteration: number;
  max_iterations: number;
  message_count_at_start?: number;
  completion_promise: string;
  started_at: string;
  prompt: string;
  session_id?: string;
  turbo?: boolean;
  strategy?: "reset" | "continue";
}

export interface PersistLoopOptions {
  config?: PersistLoopConfig;
  getTranscriptPath?: (sessionId: string) => string;
  apiTimeout?: number;
  checkSessionExists?: (sessionId: string) => Promise<boolean>;
}
