/**
 * Config Error Reporter — collects configuration validation issues.
 */

export interface ConfigError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export class ConfigErrorReporter {
  private errors: ConfigError[] = [];

  addError(path: string, message: string): void {
    this.errors.push({ path, message, severity: "error" });
  }

  addWarning(path: string, message: string): void {
    this.errors.push({ path, message, severity: "warning" });
  }

  getErrors(): ConfigError[] {
    return [...this.errors];
  }

  getWarnings(): ConfigError[] {
    return this.errors.filter((e) => e.severity === "warning");
  }

  hasErrors(): boolean {
    return this.errors.some((e) => e.severity === "error");
  }

  hasWarnings(): boolean {
    return this.errors.some((e) => e.severity === "warning");
  }

  format(): string {
    if (this.errors.length === 0) return "No configuration issues.";
    return this.errors
      .map((e) => `[${e.severity.toUpperCase()}] ${e.path}: ${e.message}`)
      .join("\n");
  }

  clear(): void {
    this.errors = [];
  }
}
