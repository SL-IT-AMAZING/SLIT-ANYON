import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";

export default function AppDetailsPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/app-details" as const });

  // Redirect legacy /app-details?appId=X route to new /apps/:appId route
  useEffect(() => {
    if (search.appId) {
      navigate({
        to: "/apps/$appId",
        params: { appId: String(search.appId) },
        replace: true,
      });
    } else {
      // No appId provided, redirect to apps list
      navigate({ to: "/apps", replace: true });
    }
  }, [search.appId, navigate]);
  return null;
}
