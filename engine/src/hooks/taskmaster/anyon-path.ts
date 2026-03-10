/**
 * Cross-platform check if a path is inside .anyon/ directory.
 * Handles both forward slashes (Unix) and backslashes (Windows).
 * Uses path segment matching (not substring) to avoid false positives like "not-conductor/file.txt"
 */
export function isAnyonPath(filePath: string): boolean {
  return /\.anyon[/\\]/.test(filePath);
}
