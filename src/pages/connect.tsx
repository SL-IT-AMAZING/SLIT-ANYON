import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { NeonConnector } from "@/components/NeonConnector";
import { SupabaseHubConnector } from "@/components/SupabaseHubConnector";
import { VercelHubConnector } from "@/components/VercelHubConnector";

const ConnectPage: React.FC = () => {
  const router = useRouter();

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
          Go Back
        </Button>

        <header className="mb-8 text-left">
          <h1 className="text-3xl font-bold text-foreground mb-2">Connect</h1>
          <p className="text-md text-muted-foreground">
            Connect to backend services for your projects.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <NeonConnector />
          <SupabaseHubConnector />
          <VercelHubConnector />
        </div>
      </div>
    </div>
  );
};

export default ConnectPage;
