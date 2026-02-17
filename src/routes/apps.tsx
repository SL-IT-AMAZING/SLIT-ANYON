import { createRoute } from "@tanstack/react-router";
import AppsListPage from "../pages/apps-list";
import { rootRoute } from "./root";

export const appsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/apps",
  component: AppsListPage,
});
