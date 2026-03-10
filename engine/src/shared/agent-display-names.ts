export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  conductor: "Builder",
  craftsman: "Craftsman",
  strategist: "Strategist",
  taskmaster: "Taskmaster",
  worker: "Worker",
  analyst: "Analyst",
  critic: "Critic",
  advisor: "Advisor",
  researcher: "Researcher",
  scout: "Scout",
  inspector: "Inspector",
};

export function getAgentDisplayName(configKey: string): string {
  const exactMatch = AGENT_DISPLAY_NAMES[configKey];
  if (exactMatch !== undefined) return exactMatch;

  const lowerKey = configKey.toLowerCase();
  for (const [k, v] of Object.entries(AGENT_DISPLAY_NAMES)) {
    if (k.toLowerCase() === lowerKey) return v;
  }

  return configKey;
}

const REVERSE_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(AGENT_DISPLAY_NAMES).map(([key, displayName]) => [
    displayName.toLowerCase(),
    key,
  ]),
);

const LEGACY_DISPLAY_NAME_MAP: Record<string, string> = {
  builder: "conductor",
  "conductor (turbo)": "conductor",
  "craftsman (deep)": "craftsman",
  "euler (turboer)": "conductor",
  "tesla (deep agent)": "craftsman",
  "newton (plan builder)": "strategist",
  "turing (plan executor)": "taskmaster",
  "euler-junior": "worker",
  "lovelace (plan consultant)": "analyst",
  "nietzsche (plan critic)": "critic",
};

export function getAgentConfigKey(agentName: string): string {
  const lower = agentName.toLowerCase();
  const reversed = REVERSE_DISPLAY_NAMES[lower];
  if (reversed !== undefined) return reversed;
  const legacy = LEGACY_DISPLAY_NAME_MAP[lower];
  if (legacy !== undefined) return legacy;
  if (AGENT_DISPLAY_NAMES[lower] !== undefined) return lower;
  return lower;
}
