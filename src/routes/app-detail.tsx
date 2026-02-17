import { createRoute } from "@tanstack/react-router";
import AppDetailPage from "../pages/app-detail";
import { rootRoute } from "./root";

export const appDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apps/$appId",
  component: AppDetailPage,
});
