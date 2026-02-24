export interface AgentConfig {
  name: string;
  description: string;
  steps: number; // default Infinity
  tools: string[];
  mode: "primary" | "subagent" | "all";
  prompt?: string;
  temperature?: number;
  topP?: number;
  color?: string;
}

export interface ToolContext {
  sessionId: number;
  chatId: number;
  appPath: string;
  abort: AbortSignal;
  askConsent: (params: ConsentRequest) => Promise<boolean>;
  askQuestion: (params: QuestionRequest) => Promise<QuestionAnswer[]>;
  event: Electron.IpcMainInvokeEvent;
}

export interface ConsentRequest {
  toolName: string;
  toolDescription?: string;
  riskLevel: "safe" | "moderate" | "dangerous";
  inputPreview?: string;
}

export interface QuestionOption {
  label: string;
  description: string;
}

export interface QuestionItem {
  question: string;
  header: string;
  options: QuestionOption[];
  multiple?: boolean;
}

export interface QuestionRequest {
  questions: QuestionItem[];
}

export interface QuestionAnswer {
  question: string;
  selectedOptions: string[];
}

export interface StreamCallbacks {
  onTextDelta: (text: string) => void;
  onReasoningDelta: (text: string) => void;
  onToolCall: (toolName: string, toolCallId: string, input: unknown) => void;
  onToolResult: (toolName: string, toolCallId: string, output: string) => void;
  onToolError: (toolName: string, toolCallId: string, error: string) => void;
  onStepFinish: (usage: { inputTokens: number; outputTokens: number }) => void;
  onFinish: (totalUsage: { inputTokens: number; outputTokens: number }) => void;
  onError: (error: Error) => void;
}

export type LoopResult = "completed" | "aborted" | "max-steps";
