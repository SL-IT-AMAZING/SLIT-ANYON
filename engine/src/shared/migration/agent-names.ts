export const AGENT_NAME_MAP: Record<string, string> = {
  // Conductor variants (was euler/sisyphus)
  omo: "conductor",
  OmO: "conductor",
  Euler: "conductor",
  euler: "conductor",
  sisyphus: "conductor",
  Sisyphus: "conductor",
  conductor: "conductor",

  // Worker variants (was faraday/sisyphus-junior)
  "Euler-Junior": "worker",
  faraday: "worker",
  "sisyphus-junior": "worker",
  "Sisyphus-Junior": "worker",
  worker: "worker",

  // Craftsman variants (was tesla/hephaestus)
  tesla: "craftsman",
  hephaestus: "craftsman",
  Hephaestus: "craftsman",
  craftsman: "craftsman",

  // Strategist variants (was newton/prometheus)
  "OmO-Plan": "strategist",
  "omo-plan": "strategist",
  "Planner-Euler": "strategist",
  "planner-euler": "strategist",
  "Newton (Planner)": "strategist",
  newton: "strategist",
  prometheus: "strategist",
  Prometheus: "strategist",
  strategist: "strategist",

  // Taskmaster variants (was turing/atlas)
  "orchestrator-euler": "taskmaster",
  Turing: "taskmaster",
  turing: "taskmaster",
  atlas: "taskmaster",
  Atlas: "taskmaster",
  taskmaster: "taskmaster",

  // Advisor variants (was socrates/oracle)
  socrates: "advisor",
  oracle: "advisor",
  Oracle: "advisor",
  advisor: "advisor",

  // Researcher variants (was curie/librarian)
  curie: "researcher",
  librarian: "researcher",
  Librarian: "researcher",
  researcher: "researcher",

  // Analyst variants (was lovelace/metis)
  "plan-consultant": "analyst",
  "Lovelace (Plan Consultant)": "analyst",
  lovelace: "analyst",
  metis: "analyst",
  Metis: "analyst",
  analyst: "analyst",

  // Critic variants (was nietzsche/momus)
  "Nietzsche (Plan Reviewer)": "critic",
  nietzsche: "critic",
  momus: "critic",
  Momus: "critic",
  critic: "critic",

  // Inspector variants (was davinci/multimodal-looker)
  davinci: "inspector",
  "multimodal-looker": "inspector",
  "Multimodal-Looker": "inspector",
  inspector: "inspector",

  // Scout variants (was explore/galileo)
  explore: "scout",
  galileo: "scout",
  scout: "scout",

  // Passthrough
  build: "build",
};

export const BUILTIN_AGENT_NAMES = new Set([
  "conductor",
  "advisor",
  "researcher",
  "scout",
  "inspector",
  "analyst",
  "critic",
  "strategist",
  "taskmaster",
  "build",
]);

export function migrateAgentNames(agents: Record<string, unknown>): {
  migrated: Record<string, unknown>;
  changed: boolean;
} {
  const migrated: Record<string, unknown> = {};
  let changed = false;

  for (const [key, value] of Object.entries(agents)) {
    const newKey =
      AGENT_NAME_MAP[key.toLowerCase()] ?? AGENT_NAME_MAP[key] ?? key;
    if (newKey !== key) {
      changed = true;
    }
    migrated[newKey] = value;
  }

  return { migrated, changed };
}
