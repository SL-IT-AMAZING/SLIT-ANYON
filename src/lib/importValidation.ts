export function extractRepoNameFromUrl(url: string): string | null {
  const trimmedUrl = url.trim();
  const match = trimmedUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  return match ? match[2] : null;
}

export function areImportCommandsValid(
  installCommand: string,
  startCommand: string,
): boolean {
  const hasInstallCommand = installCommand.trim().length > 0;
  const hasStartCommand = startCommand.trim().length > 0;
  return hasInstallCommand === hasStartCommand;
}
