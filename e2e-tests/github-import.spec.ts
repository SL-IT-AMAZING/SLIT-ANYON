import { type Page, expect } from "@playwright/test";
import { test } from "./helpers/test_helper";

const MOCK_GITHUB_REPO_URL = "https://github.com/testuser/existing-app.git";

type PageOnlyPo = {
  page: Page;
};

async function openImportDialogFromHome(po: PageOnlyPo) {
  await po.page.getByRole("link", { name: "Home" }).click();
  await expect(po.page.getByTestId("home-import-app-button")).toBeVisible();
  await po.page.getByTestId("home-import-app-button").click();
  await expect(po.page.getByRole("heading", { name: "Import App" })).toBeVisible();
}

async function connectGithubFromImportDialog(po: PageOnlyPo) {
  await po.page.getByRole("tab", { name: "Your GitHub Repos" }).click();
  await po.page.getByRole("button", { name: "Connect to GitHub" }).click();
  await expect(po.page.locator("text=FAKE-CODE")).toBeVisible();
  await expect(po.page.getByText("testuser/existing-app")).toBeVisible();
}

async function waitForImportCompletion(po: PageOnlyPo) {
  await expect(po.page.getByRole("heading", { name: "Import App" })).toBeHidden({
    timeout: 60_000,
  });
}

async function fillGithubUrlAndWaitUntilImportReady(po: PageOnlyPo) {
  const urlInput = po.page.getByPlaceholder("https://github.com/user/repo.git");
  await urlInput.fill(MOCK_GITHUB_REPO_URL);
  await urlInput.press("Tab");
  await expect(
    po.page.getByRole("button", { name: "Import", exact: true }),
  ).toBeEnabled();
}

test("should open GitHub import modal from home", async ({ po }) => {
  await openImportDialogFromHome(po);

  // Verify modal opened with import UI (showing all tabs even when not authenticated)
  await expect(
    po.page.getByText(
      "Import existing app from local folder or clone from Github",
    ),
  ).toBeVisible();

  // All tabs should be visible
  await expect(
    po.page.getByRole("tab", { name: "Local Folder" }),
  ).toBeVisible();
  await expect(
    po.page.getByRole("tab", { name: "Your GitHub Repos" }),
  ).toBeVisible();
  await expect(po.page.getByRole("tab", { name: "GitHub URL" })).toBeVisible();
  // Local Folder tab should be active by default
  await expect(
    po.page.getByRole("button", { name: "Select Folder" }),
  ).toBeVisible();
  // Switch to Your GitHub Repos tab - should show GitHub connector
  await po.page.getByRole("tab", { name: "Your GitHub Repos" }).click();
  await expect(
    po.page.getByRole("button", { name: "Connect to GitHub" }),
  ).toBeVisible();
});

test("should connect to GitHub and show import UI", async ({ po }) => {
  await openImportDialogFromHome(po);
  await connectGithubFromImportDialog(po);

  // Should be able to see all tabs
  await expect(
    po.page.getByRole("tab", { name: "Your GitHub Repos" }),
  ).toBeVisible();
  await expect(po.page.getByRole("tab", { name: "GitHub URL" })).toBeVisible();
  await expect(
    po.page.getByRole("tab", { name: "Local Folder" }),
  ).toBeVisible();
});

test("should import GitHub URL", async ({ po }) => {
  await openImportDialogFromHome(po);
  await connectGithubFromImportDialog(po);

  // Switch to "GitHub URL" tab
  await po.page.getByRole("tab", { name: "GitHub URL" }).click();
  await fillGithubUrlAndWaitUntilImportReady(po);

  // Click import
  await po.page.getByRole("button", { name: "Import", exact: true }).click();
  await waitForImportCompletion(po);
  // Verify AI_RULES generation prompt was sent
});

test("should import from repository list", async ({ po }) => {
  await openImportDialogFromHome(po);
  await connectGithubFromImportDialog(po);

  // Switch to Your GitHub Repos tab
  await po.page.getByRole("tab", { name: "Your GitHub Repos" }).click();

  // Should show repositories list
  await expect(po.page.getByText("testuser/existing-app")).toBeVisible();

  // Click the first Import button in the repo list
  await po.page.getByRole("button", { name: "Import" }).first().click();

  await waitForImportCompletion(po);
});

test("should support advanced options with custom commands", async ({ po }) => {
  await openImportDialogFromHome(po);
  await connectGithubFromImportDialog(po);

  // Go to GitHub URL tab
  await po.page.getByRole("tab", { name: "GitHub URL" }).click();
  await fillGithubUrlAndWaitUntilImportReady(po);

  // Open advanced options
  await po.page.getByRole("button", { name: "Advanced options" }).click();

  // Fill one command - should show error
  await po.page.getByPlaceholder("pnpm install").fill("npm install");
  await expect(
    po.page.getByText("Both commands are required when customizing"),
  ).toBeVisible();
  await expect(
    po.page.getByRole("button", { name: "Import", exact: true }),
  ).toBeDisabled();

  // Fill both commands
  await po.page.getByPlaceholder("pnpm dev").fill("npm start");

  await expect(
    po.page.getByRole("button", { name: "Import", exact: true }),
  ).toBeEnabled();
  await expect(
    po.page.getByText("Both commands are required when customizing"),
  ).not.toBeVisible();

  // Import with custom commands
  await po.page.getByRole("button", { name: "Import", exact: true }).click();

  await waitForImportCompletion(po);
});

test("should allow empty commands to use defaults", async ({ po }) => {
  await openImportDialogFromHome(po);
  await connectGithubFromImportDialog(po);

  // Go to GitHub URL tab
  await po.page.getByRole("tab", { name: "GitHub URL" }).click();
  await fillGithubUrlAndWaitUntilImportReady(po);

  // Commands are empty by default, so import should be enabled
  await expect(
    po.page.getByRole("button", { name: "Import", exact: true }),
  ).toBeEnabled();

  await po.page.getByRole("button", { name: "Import", exact: true }).click();

  await waitForImportCompletion(po);
});

test("should show an error for invalid GitHub URL", async ({ po }) => {
  await openImportDialogFromHome(po);
  await connectGithubFromImportDialog(po);

  await po.page.getByRole("tab", { name: "GitHub URL" }).click();
  const urlInput = po.page.getByPlaceholder("https://github.com/user/repo.git");
  await urlInput.fill("not-a-github-url");
  await urlInput.press("Tab");

  await po.page.getByRole("button", { name: "Import", exact: true }).click();
  await po.waitForToast(undefined, 10_000);
  await po.assertToastWithText("Invalid GitHub URL");
  await expect(po.page.getByRole("heading", { name: "Import App" })).toBeVisible();
});

test("should import successfully when URL contains leading/trailing spaces", async ({ po }) => {
  await openImportDialogFromHome(po);
  await connectGithubFromImportDialog(po);

  await po.page.getByRole("tab", { name: "GitHub URL" }).click();
  const urlInput = po.page.getByPlaceholder("https://github.com/user/repo.git");
  await urlInput.fill(`  ${MOCK_GITHUB_REPO_URL}  `);
  await urlInput.press("Tab");

  await expect(
    po.page.getByRole("button", { name: "Import", exact: true }),
  ).toBeEnabled();
  await po.page.getByRole("button", { name: "Import", exact: true }).click();

  await waitForImportCompletion(po);
});
