import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import { apps } from "@/db/schema";
import { eq } from "drizzle-orm";
import log from "electron-log";

type PackageManager = "bun" | "yarn" | "pnpm" | "npm";
type FrameworkInfo = { name: string; portFlag: string };

const logger = log.scope("profileLearning");

function detectPackageManager(appPath: string): PackageManager {
  const bunLock = path.join(appPath, "bun.lock");
  const bunLockb = path.join(appPath, "bun.lockb");
  if (fs.existsSync(bunLock) || fs.existsSync(bunLockb)) {
    return "bun";
  }

  if (fs.existsSync(path.join(appPath, "yarn.lock"))) {
    return "yarn";
  }

  if (fs.existsSync(path.join(appPath, "pnpm-lock.yaml"))) {
    return "pnpm";
  }

  if (fs.existsSync(path.join(appPath, "package-lock.json"))) {
    return "npm";
  }

  return "npm";
}

function readPackageJson(appPath: string): Record<string, any> {
  const packageJsonPath = path.join(appPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(
      "This project is missing necessary configuration files. Make sure package.json exists in the project folder.",
    );
  }

  try {
    const packageJsonRaw = fs.readFileSync(packageJsonPath, "utf8");
    return JSON.parse(packageJsonRaw) as Record<string, any>;
  } catch {
    throw new Error(
      "The project configuration file is damaged and couldn't be read. Try re-creating the project.",
    );
  }
}

function detectFramework(
  packageJson: Record<string, any>,
): FrameworkInfo | null {
  const dependencies = (packageJson.dependencies ?? {}) as Record<
    string,
    string
  >;
  const devDependencies = (packageJson.devDependencies ?? {}) as Record<
    string,
    string
  >;
  const scripts = (packageJson.scripts ?? {}) as Record<string, string>;

  if (dependencies.next) {
    return { name: "nextjs", portFlag: "-p {port}" };
  }

  if (devDependencies.vite || scripts.dev?.includes("vite")) {
    return { name: "vite", portFlag: "--port {port}" };
  }

  if (dependencies.nuxt) {
    return { name: "nuxt", portFlag: "--port {port}" };
  }

  if (dependencies.astro) {
    return { name: "astro", portFlag: "--port {port}" };
  }

  if (dependencies["@remix-run/dev"]) {
    return { name: "remix", portFlag: "--port {port}" };
  }

  if (dependencies["react-scripts"]) {
    return { name: "cra", portFlag: "PORT={port}" };
  }

  return null;
}

function composeInstallCommand(pm: PackageManager): string {
  if (pm === "bun") {
    return "bun install";
  }

  if (pm === "yarn") {
    return "(yarn --version || corepack enable yarn) && yarn install";
  }

  if (pm === "pnpm") {
    return "pnpm install";
  }

  return "npm install --legacy-peer-deps";
}

function composeStartCommand(
  pm: PackageManager,
  framework: FrameworkInfo | null,
  scripts: Record<string, string> | undefined,
): string {
  const runCmd = pm === "bun" ? "bun run" : `${pm} run`;

  if (framework) {
    if (framework.name === "cra") {
      return `${framework.portFlag} ${runCmd} start`;
    }

    if (framework.name === "nextjs") {
      return `${runCmd} dev -- --webpack ${framework.portFlag}`;
    }

    if (
      framework.name === "vite" ||
      framework.name === "nuxt" ||
      framework.name === "astro" ||
      framework.name === "remix"
    ) {
      return `${runCmd} dev -- ${framework.portFlag}`;
    }
  }

  if (scripts?.dev) {
    return `${runCmd} dev -- --port {port}`;
  }

  if (scripts?.start) {
    return `${runCmd} start -- --port {port}`;
  }

  throw new Error(
    "Couldn't figure out how to start this project. Make sure it has a 'dev' or 'start' script in package.json.",
  );
}

export async function learnAppProfile(
  appPath: string,
  appId: number,
): Promise<{ installCommand: string; startCommand: string }> {
  const packageJson = readPackageJson(appPath);
  const packageManager = detectPackageManager(appPath);
  const framework = detectFramework(packageJson);
  const installCommand = composeInstallCommand(packageManager);
  const startCommand = composeStartCommand(
    packageManager,
    framework,
    packageJson.scripts as Record<string, string> | undefined,
  );

  logger.info("Detected package manager", { packageManager, appId, appPath });
  logger.info("Detected framework", {
    framework: framework?.name ?? null,
    appId,
  });
  logger.info("Composed profile commands", {
    installCommand,
    startCommand,
    appId,
  });

  await db
    .update(apps)
    .set({
      installCommand,
      startCommand,
      profileLearned: true,
      profileSource: "detected",
    })
    .where(eq(apps.id, appId));

  return { installCommand, startCommand };
}
