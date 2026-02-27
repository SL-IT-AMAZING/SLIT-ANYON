/**
 * Dynamic Agent Registry — replaces the hardcoded NATIVE_AGENTS array.
 *
 * Supports:
 *  - Registering agents from config / code
 *  - Model override from oh-my-opencode.json `agents` section
 *  - Category-based model selection for Sisyphus-Junior
 *  - Agent variant (low / medium / high / max) resolution
 */
import log from "electron-log";

import type { AgentConfig } from "./types";

const logger = log.scope("agent-registry");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AgentDescriptor {
  name: string;
  description: string;
  mode: "primary" | "subagent" | "all";
  native: boolean;
  hidden?: boolean;
  color?: string;
  variant?: string;
  category?: string;
  cost?: "free" | "cheap" | "moderate" | "expensive";
  model?: {
    providerID: string;
    modelID: string;
  };
}

export interface AgentModelOverride {
  model?: string;
  variant?: string;
  category?: string;
  temperature?: number;
  topP?: number;
  prompt?: string;
  promptAppend?: string;
  tools?: Record<string, boolean>;
  disable?: boolean;
  description?: string;
  mode?: "subagent" | "primary" | "all";
  color?: string;
  skills?: string[];
}

export type AgentFactory = (
  overrides?: AgentModelOverride,
) => AgentConfig & { descriptor: AgentDescriptor };

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export class AgentRegistry {
  private agents = new Map<string, AgentConfig>();
  private descriptors = new Map<string, AgentDescriptor>();
  private overrides = new Map<string, AgentModelOverride>();
  private factories = new Map<string, AgentFactory>();

  // ---- Registration -------------------------------------------------------

  /**
   * Register an agent directly with a full config + descriptor.
   * If a factory was previously registered for this name, it is replaced.
   */
  register(config: AgentConfig, descriptor: AgentDescriptor): void {
    const key = config.name.toLowerCase();
    this.agents.set(key, config);
    this.descriptors.set(key, descriptor);
    logger.log(`Registered agent: ${config.name}`);
  }

  /** Register a factory that produces an agent config (used for dynamic agents like Sisyphus). */
  registerFactory(name: string, factory: AgentFactory): void {
    this.factories.set(name.toLowerCase(), factory);
    logger.log(`Registered agent factory: ${name}`);
  }

  /** Apply model/config overrides from oh-my-opencode.json `agents` section. */
  applyOverrides(overridesMap: Record<string, AgentModelOverride>): void {
    for (const [name, override] of Object.entries(overridesMap)) {
      this.overrides.set(name.toLowerCase(), override);
    }
    // Re-resolve any factory-based agents that have overrides
    this.resolveFactoryAgents();
  }

  // ---- Lookup -------------------------------------------------------------

  /** Get agent config by name (case-insensitive). */
  get(name: string): AgentConfig | undefined {
    const key = name.toLowerCase();

    // Check if there's a factory that hasn't been resolved yet
    if (!this.agents.has(key) && this.factories.has(key)) {
      this.resolveFactory(key);
    }

    const config = this.agents.get(key);
    if (!config) return undefined;

    // Apply runtime overrides if present
    const override = this.overrides.get(key);
    if (override?.disable) return undefined;

    return this.applyOverrideToConfig(config, override);
  }

  /** Get the descriptor metadata for an agent. */
  getDescriptor(name: string): AgentDescriptor | undefined {
    const key = name.toLowerCase();
    if (!this.descriptors.has(key) && this.factories.has(key)) {
      this.resolveFactory(key);
    }
    return this.descriptors.get(key);
  }

  /** Get the default primary agent (Sisyphus, or first registered primary). */
  getDefault(): AgentConfig {
    // Prefer Sisyphus
    const sisyphus = this.get("sisyphus");
    if (sisyphus) return sisyphus;

    // Fallback: first primary agent
    for (const [, config] of this.agents) {
      if (config.mode === "primary") return config;
    }

    // Absolute fallback: first agent
    const first = this.agents.values().next();
    if (!first.done) return first.value;

    throw new Error("No agents registered in AgentRegistry");
  }

  /** List all agent descriptors that match the given mode filter. */
  list(filter?: { mode?: "primary" | "subagent" | "all" }): AgentDescriptor[] {
    // Resolve all pending factories
    this.resolveAllFactories();

    const results: AgentDescriptor[] = [];
    for (const [key, desc] of this.descriptors) {
      const override = this.overrides.get(key);
      if (override?.disable) continue;
      if (desc.hidden) continue;
      if (filter?.mode && desc.mode !== filter.mode && desc.mode !== "all")
        continue;
      results.push(desc);
    }
    return results;
  }

  /** Check if an agent name is registered. */
  has(name: string): boolean {
    const key = name.toLowerCase();
    return this.agents.has(key) || this.factories.has(key);
  }

  /** Total number of registered agents. */
  get size(): number {
    this.resolveAllFactories();
    return this.agents.size;
  }

  // ---- Model resolution ---------------------------------------------------

  /**
   * Resolve the model for an agent, considering overrides.
   * Returns { providerID, modelID } or undefined if no model info available.
   */
  resolveModel(
    name: string,
  ): { providerID: string; modelID: string } | undefined {
    const key = name.toLowerCase();
    const override = this.overrides.get(key);
    const descriptor = this.descriptors.get(key);

    // Override model takes priority
    if (override?.model) {
      return this.parseModelString(override.model);
    }

    // Then descriptor's model
    if (descriptor?.model) {
      return descriptor.model;
    }

    return undefined;
  }

  // ---- Internal -----------------------------------------------------------

  private resolveFactory(key: string): void {
    const factory = this.factories.get(key);
    if (!factory) return;
    const override = this.overrides.get(key);
    const { descriptor, ...config } = factory(override);
    this.agents.set(key, config);
    this.descriptors.set(key, descriptor);
  }

  private resolveFactoryAgents(): void {
    for (const key of this.factories.keys()) {
      this.resolveFactory(key);
    }
  }

  private resolveAllFactories(): void {
    for (const key of this.factories.keys()) {
      if (!this.agents.has(key)) {
        this.resolveFactory(key);
      }
    }
  }

  private applyOverrideToConfig(
    config: AgentConfig,
    override?: AgentModelOverride,
  ): AgentConfig {
    if (!override) return config;

    return {
      ...config,
      temperature:
        override.temperature !== undefined
          ? override.temperature
          : config.temperature,
      topP: override.topP !== undefined ? override.topP : config.topP,
      mode: override.mode ?? config.mode,
      color: override.color ?? config.color,
      prompt: override.prompt ?? config.prompt,
    };
  }

  /**
   * Parse "provider/model" string into components.
   * Handles formats like "anthropic/claude-opus-4-6", "openai/gpt-5.2", etc.
   */
  private parseModelString(
    model: string,
  ): { providerID: string; modelID: string } | undefined {
    const slashIdx = model.indexOf("/");
    if (slashIdx === -1) {
      // No provider prefix — assume anthropic
      return { providerID: "anthropic", modelID: model };
    }
    return {
      providerID: model.slice(0, slashIdx),
      modelID: model.slice(slashIdx + 1),
    };
  }

  /** Clear all registrations (for testing). */
  clear(): void {
    this.agents.clear();
    this.descriptors.clear();
    this.overrides.clear();
    this.factories.clear();
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _globalRegistry: AgentRegistry | null = null;

export function getGlobalAgentRegistry(): AgentRegistry {
  if (!_globalRegistry) {
    _globalRegistry = new AgentRegistry();
  }
  return _globalRegistry;
}

/** Reset singleton (for testing). */
export function resetGlobalAgentRegistry(): void {
  _globalRegistry?.clear();
  _globalRegistry = null;
}

// ---------------------------------------------------------------------------
// Seed helpers — register the 3 hardcoded agents from agent_config.ts
// ---------------------------------------------------------------------------

import { NATIVE_AGENTS } from "./agent_config";

/**
 * Seed the registry with the existing hardcoded agents.
 * Called once at app startup. Later phases will add the 11 OMO agents.
 */
export function seedNativeAgents(registry: AgentRegistry): void {
  for (const agent of NATIVE_AGENTS) {
    registry.register(agent, {
      name: agent.name,
      description: agent.description,
      mode: agent.mode,
      native: true,
      color: agent.color,
    });
  }
}
