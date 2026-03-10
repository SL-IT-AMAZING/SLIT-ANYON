import fs from "node:fs";
import path from "node:path";
import { expect } from "@playwright/test";
import { Timeout, test } from "./helpers/test_helper";

test("plan mode - accept plan redirects to new chat and saves to disk", async ({
  po,
}) => {
  test.setTimeout(180000);
  await po.setUpAnyonPro({ localAgent: true });
  await expect(po.page.getByTestId("home-import-app-button")).toBeVisible({
    timeout: Timeout.MEDIUM,
  });
  await po.importApp("minimal");

  // Get app path before accepting (needed to check saved plan)
  const appPath = await po.getCurrentAppPath();

  // Trigger write_plan fixture
  await po.sendPrompt("tc=local-agent/accept-plan");

  // Capture current chat ID from URL
  const initialUrl = po.page.url();
  const initialChatIdMatch = initialUrl.match(/[?&]id=(\d+)/);
  expect(initialChatIdMatch).not.toBeNull();
  const initialChatId = initialChatIdMatch![1];

  // Wait for plan panel to appear
  const acceptButton = po.page.getByRole("button", { name: "Accept Plan" });
  await expect(acceptButton).toBeVisible({ timeout: Timeout.MEDIUM });

  // Accept the plan (plans are now always saved to .anyon/plans/)
  await acceptButton.click();

  // Wait for navigation to a different chat
  await expect(async () => {
    const currentUrl = po.page.url();
    const match = currentUrl.match(/[?&]id=(\d+)/);
    expect(match).not.toBeNull();
    expect(match![1]).not.toEqual(initialChatId);
  }).toPass({ timeout: Timeout.MEDIUM });

  // Verify plan was saved to .anyon/plans/
  const planDir = path.join(appPath!, ".anyon", "plans");
  let mdFiles: string[] = [];
  await expect(async () => {
    const files = fs.readdirSync(planDir);
    mdFiles = files.filter((f) => f.endsWith(".md"));
    expect(mdFiles.length).toBeGreaterThan(0);
  }).toPass({ timeout: Timeout.MEDIUM });

  // Verify plan content
  const planContent = fs.readFileSync(path.join(planDir, mdFiles[0]), "utf-8");
  expect(planContent).toContain("Test Plan");
});

test("plan mode - questionnaire flow", async ({ po }) => {
  test.setTimeout(180000);
  await po.setUpAnyonPro({ localAgent: true });
  await expect(po.page.getByTestId("home-import-app-button")).toBeVisible({
    timeout: Timeout.MEDIUM,
  });
  await po.importApp("minimal");

  // Trigger questionnaire fixture
  await po.sendPrompt("tc=local-agent/questionnaire");

  // Wait for questionnaire UI to appear
  await expect(po.page.getByText("Project Requirements")).toBeVisible({
    timeout: Timeout.MEDIUM,
  });

  // Select "Vue" radio option by clicking the label text (Base UI Radio components)
  await po.page.getByText("Vue", { exact: true }).click();

  // Click Submit (single question → Submit button shown)
  await po.page.getByRole("button", { name: /Submit/ }).click();

  // Wait for the LLM response to the submitted answers
  await po.waitForChatCompletion();

  // Snapshot the messages
  await po.snapshotMessages();
});

test("builder founder journey persists draft, brief, flows, spec, and wave plan", async ({
  po,
}) => {
  test.setTimeout(180000);
  await po.setUpAnyonPro({ localAgent: true });
  await expect(po.page.getByTestId("home-import-app-button")).toBeVisible({
    timeout: Timeout.MEDIUM,
  });
  await po.importApp("minimal");

  const appPath = await po.getCurrentAppPath();

  await po.sendPrompt("tc=local-agent/questionnaire");
  await expect(po.page.getByText("Project Requirements")).toBeVisible({
    timeout: Timeout.MEDIUM,
  });
  await po.page.getByText("Vue", { exact: true }).click();
  await po.page.getByRole("button", { name: /Submit/ }).click();
  await po.waitForChatCompletion();

  const draftDir = path.join(appPath!, ".anyon", "drafts");
  await expect(async () => {
    const files = fs.readdirSync(draftDir).filter((f) => f.endsWith(".md"));
    expect(files.length).toBeGreaterThan(0);
  }).toPass({ timeout: Timeout.MEDIUM });

  await po.sendPrompt("tc=local-agent/accept-plan");
  await expect(po.page.getByText("Builder Artifacts")).toBeVisible({
    timeout: Timeout.MEDIUM,
  });
  await expect(po.page.getByRole("button", { name: "Founder Brief" })).toBeVisible({
    timeout: Timeout.MEDIUM,
  });
  await expect(po.page.getByRole("button", { name: "User Flows" })).toBeVisible({
    timeout: Timeout.MEDIUM,
  });

  const briefDir = path.join(appPath!, ".anyon", "briefs");
  const flowDir = path.join(appPath!, ".anyon", "flows");
  const specDir = path.join(appPath!, ".anyon", "specs");

  await expect(async () => {
    expect(fs.readdirSync(briefDir).some((f) => f.endsWith(".md"))).toBe(true);
    expect(fs.readdirSync(flowDir).some((f) => f.endsWith(".md"))).toBe(true);
    expect(fs.readdirSync(specDir).some((f) => f.endsWith(".md"))).toBe(true);
  }).toPass({ timeout: Timeout.MEDIUM });

  await po.page.getByRole("button", { name: "Accept Plan" }).click();

  const planDir = path.join(appPath!, ".anyon", "plans");
  await expect(async () => {
    const files = fs.readdirSync(planDir).filter((f) => f.includes("wave-1"));
    expect(files.length).toBeGreaterThan(0);
  }).toPass({ timeout: Timeout.MEDIUM });
});
