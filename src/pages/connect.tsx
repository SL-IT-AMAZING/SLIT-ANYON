import { SupabaseHubConnector } from "@/components/SupabaseHubConnector";
import { VercelHubConnector } from "@/components/VercelHubConnector";
import type React from "react";
import { useTranslation } from "react-i18next";

const ConnectPage: React.FC = () => {
  const { t } = useTranslation(["app", "common"]);

  return (
    <div className="flex-1 min-w-0 px-8 py-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("connect.title")}
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        {t("connect.description")}
      </p>

      <div className="grid grid-cols-1 gap-6">
        <SupabaseHubConnector />
        <VercelHubConnector />
      </div>
    </div>
  );
};

export default ConnectPage;
