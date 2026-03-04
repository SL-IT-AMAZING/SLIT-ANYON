import { SupabaseHubConnector } from "@/components/SupabaseHubConnector";
import { VercelHubConnector } from "@/components/VercelHubConnector";
import type React from "react";
import { useTranslation } from "react-i18next";

const ConnectPage: React.FC = () => {
  const { t } = useTranslation(["app", "common"]);

  return (
    <div className="min-h-screen px-8 py-4">
      <div className="max-w-5xl mx-auto pb-12">
        <header className="mb-8 text-left">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("connect.title")}
          </h1>
          <p className="text-md text-muted-foreground">
            {t("connect.description")}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <SupabaseHubConnector />
          <VercelHubConnector />
        </div>
      </div>
    </div>
  );
};

export default ConnectPage;
