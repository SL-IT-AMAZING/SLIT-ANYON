import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import ConnectPage from "../pages/connect";

export const connectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/connect",
  component: ConnectPage,
});
