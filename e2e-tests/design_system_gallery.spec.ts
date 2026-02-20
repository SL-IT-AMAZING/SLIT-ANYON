import { expect } from "@playwright/test";
import { test } from "./helpers/test_helper";

test("design system gallery - browse, preview, and create app flow", async ({
  po,
}) => {
  // Dismiss telemetry dialog if present
  const laterButton = po.page.getByTestId("telemetry-later-button");
  if (await laterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await laterButton.click();
  }

  // Navigate to Themes page via Library sidebar
  await po.goToLibraryTab();
  await po.page.getByRole("link", { name: "Themes" }).click();
  await expect(
    po.page.getByRole("heading", { name: "Themes", exact: true }),
  ).toBeVisible();

  // Verify Design Systems gallery section renders
  const gallery = po.page.getByTestId("design-system-gallery");
  await expect(gallery).toBeVisible();
  await expect(
    gallery.getByRole("heading", { name: "Design Systems" }),
  ).toBeVisible();

  // Verify all 6 design system cards render
  await expect(po.page.getByTestId("design-system-card-shadcn")).toBeVisible();
  await expect(po.page.getByTestId("design-system-card-mui")).toBeVisible();
  await expect(po.page.getByTestId("design-system-card-antd")).toBeVisible();
  await expect(po.page.getByTestId("design-system-card-mantine")).toBeVisible();
  await expect(po.page.getByTestId("design-system-card-chakra")).toBeVisible();
  await expect(po.page.getByTestId("design-system-card-daisyui")).toBeVisible();

  // === CATEGORY FILTER ===
  // Click "Minimal" category — should show only shadcn
  await gallery.getByRole("button", { name: "Minimal" }).click();
  await expect(po.page.getByTestId("design-system-card-shadcn")).toBeVisible();
  await expect(po.page.getByTestId("design-system-card-mui")).not.toBeVisible();

  // Click "All" to reset
  await gallery.getByRole("button", { name: "All" }).click();
  await expect(po.page.getByTestId("design-system-card-mui")).toBeVisible();

  // === SEARCH ===
  const searchInput = gallery.getByPlaceholder("Search design systems...");
  await searchInput.fill("Material");
  await expect(po.page.getByTestId("design-system-card-mui")).toBeVisible();
  await expect(
    po.page.getByTestId("design-system-card-shadcn"),
  ).not.toBeVisible();

  // Clear search
  await searchInput.clear();
  await expect(po.page.getByTestId("design-system-card-shadcn")).toBeVisible();

  // === PREVIEW DIALOG ===
  // Click "Preview" on shadcn card
  const shadcnCard = po.page.getByTestId("design-system-card-shadcn");
  await shadcnCard.getByRole("button", { name: "Preview" }).click();

  // Verify preview dialog opens with correct title
  const dialog = po.page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("shadcn/ui")).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Use This Design System" }),
  ).toBeVisible();

  // Click "Use This Design System" — should close preview and open CreateAppDialog
  await dialog.getByRole("button", { name: "Use This Design System" }).click();

  // Preview dialog should close, CreateAppDialog should open
  await expect(
    po.page.getByRole("dialog").getByRole("heading", { name: /create/i }),
  ).toBeVisible();

  // Verify shadcn is pre-selected in the design system picker
  const createDialog = po.page.getByRole("dialog");
  await expect(createDialog.getByText("shadcn/ui")).toBeVisible();

  // Close the CreateAppDialog
  await createDialog.getByRole("button", { name: /cancel/i }).click();
  await expect(po.page.getByRole("dialog")).not.toBeVisible();

  // === USE THIS (direct from card) ===
  const muiCard = po.page.getByTestId("design-system-card-mui");
  await muiCard.getByRole("button", { name: "Use This" }).click();

  // CreateAppDialog should open with MUI pre-selected
  const createDialog2 = po.page.getByRole("dialog");
  await expect(createDialog2).toBeVisible();
  await expect(createDialog2.getByText("Material UI")).toBeVisible();

  // Close
  await createDialog2.getByRole("button", { name: /cancel/i }).click();
  await expect(po.page.getByRole("dialog")).not.toBeVisible();
});
