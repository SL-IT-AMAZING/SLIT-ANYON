import { test } from "./helpers/test_helper";
import { expect } from "@playwright/test";

test.describe("Node Install Auto-Detection on Home Page", () => {
  test("auto-opens install dialog when node is missing", async ({ po }) => {
    // Mock Node.js as not installed
    await po.setNodeMock(false);
    await po.page.reload();

    // Install dialog should auto-open (no banner — direct auto-install)
    await expect(po.page.getByText("Installing Node.js")).toBeVisible();
    await po.page.keyboard.press("Escape");
    await po.setNodeMock(true);
    await po.page.reload();

    // Dialog should not auto-open when node is present
    await expect(po.page.getByText("Installing Node.js")).not.toBeVisible();

    // Verify the home page is functional (chat input visible)
    await expect(po.page.locator('[data-lexical-editor="true"]')).toBeVisible();
    // Clean up mock
    await po.setNodeMock(null);
  });
});
