import { expect } from "@playwright/test";
import { test } from "./helpers/test_helper";

test("should navigate to /themes when clicking Library tab", async ({ po }) => {
  await po.page.getByRole("link", { name: "Library" }).click();
  await expect(po.page).toHaveURL(/\/themes$/);
  await expect(po.page.getByRole("heading", { name: "Themes" })).toBeVisible();
  await expect(po.page.getByTestId("design-system-gallery")).toBeVisible();

  const themePreviewFrame = po.page
    .locator('[data-testid^="tweakcn-theme-card-"] iframe')
    .first();
  await themePreviewFrame.scrollIntoViewIfNeeded();
  await expect(themePreviewFrame).toBeVisible();
});
