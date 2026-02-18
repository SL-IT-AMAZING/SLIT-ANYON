import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import ignore from "ignore";

export interface CollectedFile {
  filePath: string;
  sha1: string;
  size: number;
  content: Buffer;
}

export interface FileCollectionResult {
  files: CollectedFile[];
  totalSize: number;
  fileCount: number;
}

export interface FileCollectionProgress {
  phase: "scanning" | "hashing";
  filesScanned: number;
  filesHashed: number;
  totalFiles: number;
}

const SECURITY_DENY_PATTERNS = [
  ".env",
  ".env.*",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.test",
  "*.pem",
  "*.key",
  "*.p12",
  "*.pfx",
  "credentials.json",
  "service-account*.json",
  "secrets.json",
  ".npmrc",
  ".yarnrc.yml",
];

const ALWAYS_EXCLUDED_DIRS = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".vercel",
  ".turbo",
  ".cache",
  "__pycache__",
];

export async function collectDeployFiles(
  appPath: string,
  onProgress?: (progress: FileCollectionProgress) => void,
): Promise<FileCollectionResult> {
  const ig = ignore();

  ig.add(SECURITY_DENY_PATTERNS);
  ig.add(ALWAYS_EXCLUDED_DIRS.map((d) => `${d}/`));

  const gitignorePath = path.join(appPath, ".gitignore");
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");
    ig.add(gitignoreContent);
  }

  const vercelignorePath = path.join(appPath, ".vercelignore");
  if (fs.existsSync(vercelignorePath)) {
    const vercelignoreContent = fs.readFileSync(vercelignorePath, "utf-8");
    ig.add(vercelignoreContent);
  }

  const allFiles: string[] = [];
  scanDirectory(appPath, "", ig, allFiles);

  onProgress?.({
    phase: "scanning",
    filesScanned: allFiles.length,
    filesHashed: 0,
    totalFiles: allFiles.length,
  });

  const collectedFiles: CollectedFile[] = [];
  let totalSize = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const relativePath = allFiles[i];
    const absolutePath = path.join(appPath, relativePath);
    const content = fs.readFileSync(absolutePath);
    const sha1 = crypto.createHash("sha1").update(content).digest("hex");

    collectedFiles.push({
      filePath: relativePath,
      sha1,
      size: content.length,
      content,
    });

    totalSize += content.length;

    if (i % 50 === 0 || i === allFiles.length - 1) {
      onProgress?.({
        phase: "hashing",
        filesScanned: allFiles.length,
        filesHashed: i + 1,
        totalFiles: allFiles.length,
      });
    }
  }

  return {
    files: collectedFiles,
    totalSize,
    fileCount: collectedFiles.length,
  };
}

function scanDirectory(
  basePath: string,
  currentRelative: string,
  ig: ReturnType<typeof ignore>,
  results: string[],
): void {
  const fullPath = path.join(basePath, currentRelative);
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const relativePath = currentRelative
      ? `${currentRelative}/${entry.name}`
      : entry.name;

    const checkPath = entry.isDirectory() ? `${relativePath}/` : relativePath;
    if (ig.ignores(checkPath)) continue;

    if (entry.isDirectory()) {
      scanDirectory(basePath, relativePath, ig, results);
    } else if (entry.isFile()) {
      results.push(relativePath);
    }
  }
}
