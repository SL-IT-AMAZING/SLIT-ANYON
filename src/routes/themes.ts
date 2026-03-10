import { createRoute } from "@tanstack/react-router";
import ThemesPage from "../pages/themes";
import { rootRoute } from "./root";

export const themesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/themes",
  component: ThemesPage,
});
