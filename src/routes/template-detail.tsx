import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import TemplateDetailPage from "../pages/template-detail";

export const templateDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/hub/$templateId",
  component: function TemplateDetailRouteComponent() {
    const { templateId } = templateDetailRoute.useParams();
    return <TemplateDetailPage templateId={templateId} />;
  },
});
