import { SupabaseHubConnector } from "@/components/SupabaseHubConnector";
import { VercelHubConnector } from "@/components/VercelHubConnector";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type React from "react";
import { useTranslation } from "react-i18next";

const ConnectPage: React.FC = () => {
  const router = useRouter();
  const { t } = useTranslation(["app", "common"]);

  return (
    <div className="min-h-screen px-8 py-4">
      <div className="max-w-5xl mx-auto pb-12">
        <Button
          onClick={() => router.history.back()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 mb-4 bg-(--background-lightest) py-5"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("buttons.back", { ns: "common" })}
        </Button>

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
