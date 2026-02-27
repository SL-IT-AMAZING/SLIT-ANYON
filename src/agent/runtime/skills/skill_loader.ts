import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import log from "electron-log";
import { BUILTIN_SKILLS } from "./builtin_skills";
import type { Skill, SkillDescriptor, SkillMcpConfig } from "./types";

const logger = log.scope("skill-loader");

export class SkillLoader {
  private skills = new Map<string, Skill>();
  private discoveryPaths: string[];

  constructor(projectDir: string) {
    this.discoveryPaths = [
      path.join(os.homedir(), ".claude", "skills"), // User skills
      path.join(projectDir, ".claude", "skills"), // Project skills
      path.join(os.homedir(), ".config", "opencode", "skills"), // Global
    ];
  }

  async discover(): Promise<void> {
    // 1. Load builtins first (lowest priority — can be overridden)
    for (const skill of BUILTIN_SKILLS) {
      this.skills.set(skill.name.toLowerCase(), skill);
    }

    // 2. Scan discovery paths (later paths override earlier ones)
    for (const basePath of this.discoveryPaths) {
      await this.scanDirectory(basePath);
    }

    logger.info(`Discovered ${this.skills.size} skills`);
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name.toLowerCase());
  }

  list(): SkillDescriptor[] {
    return [...this.skills.values()].map((s) => ({
      name: s.name,
      description: s.description,
      scope: s.scope,
      hasMcp: !!s.mcp,
    }));
  }

  getAll(): Skill[] {
    return [...this.skills.values()];
  }

  private async scanDirectory(basePath: string): Promise<void> {
    if (!fs.existsSync(basePath)) return;

    try {
      const entries = fs.readdirSync(basePath, { withFileTypes: true });
      for (const entry of entries) {
        try {
          if (entry.isDirectory()) {
            // Directory skill: index.md is the content, optional mcp.json
            await this.loadDirectorySkill(
              path.join(basePath, entry.name),
              this.getScopeForPath(basePath),
            );
          } else if (entry.name.endsWith(".md")) {
            // File skill: the .md file IS the content
            await this.loadFileSkill(
              path.join(basePath, entry.name),
              this.getScopeForPath(basePath),
            );
          }
        } catch (err) {
          logger.warn(
            `Failed to load skill from ${entry.name}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    } catch (err) {
      logger.debug(
        `Cannot scan ${basePath}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  private async loadDirectorySkill(
    dirPath: string,
    scope: Skill["scope"],
  ): Promise<void> {
    const indexPath = path.join(dirPath, "index.md");
    if (!fs.existsSync(indexPath)) return;

    const rawContent = fs.readFileSync(indexPath, "utf-8");
    const { metadata, content } = this.parseMetadata(rawContent);
    const name = path.basename(dirPath);

    // Check for MCP config
    let mcp: SkillMcpConfig | undefined;
    const mcpPath = path.join(dirPath, "mcp.json");
    if (fs.existsSync(mcpPath)) {
      try {
        const mcpRaw = fs.readFileSync(mcpPath, "utf-8");
        mcp = JSON.parse(mcpRaw) as SkillMcpConfig;
      } catch {
        logger.warn(`Invalid mcp.json in skill ${name}`);
      }
    }

    this.skills.set(name.toLowerCase(), {
      name,
      description: metadata.description ?? name,
      content,
      scope,
      path: dirPath,
      mcp,
      metadata,
    });
  }

  private async loadFileSkill(
    filePath: string,
    scope: Skill["scope"],
  ): Promise<void> {
    const rawContent = fs.readFileSync(filePath, "utf-8");
    const { metadata, content } = this.parseMetadata(rawContent);
    const name = path.basename(filePath, ".md");

    this.skills.set(name.toLowerCase(), {
      name,
      description: metadata.description ?? name,
      content,
      scope,
      path: filePath,
      metadata,
    });
  }

  private parseMetadata(content: string): {
    metadata: Record<string, string>;
    content: string;
  } {
    // Parse YAML frontmatter (---\nkey: value\n---)
    const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) return { metadata: {}, content };

    const metadata: Record<string, string> = {};
    const frontmatter = match[1];
    if (frontmatter) {
      for (const line of frontmatter.split("\n")) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          const value = line.slice(colonIdx + 1).trim();
          metadata[key] = value;
        }
      }
    }

    return { metadata, content: match[2] ?? "" };
  }

  private getScopeForPath(basePath: string): Skill["scope"] {
    if (
      basePath.includes(".claude/skills") &&
      basePath.includes(os.homedir()) &&
      !basePath.includes(".config")
    ) {
      return "user";
    }
    if (basePath.includes(".config/opencode")) return "global";
    return "project";
  }
}
