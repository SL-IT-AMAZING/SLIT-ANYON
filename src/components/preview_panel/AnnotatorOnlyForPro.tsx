import { Button } from "@/components/ui/button";
import { ipc } from "@/ipc/types";
import { ArrowLeft, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AnnotatorOnlyForProProps {
  onGoBack: () => void;
}

export const AnnotatorOnlyForPro = ({ onGoBack }: AnnotatorOnlyForProProps) => {
  const { t } = useTranslation(["app", "common"]);
  const handleGetPro = () => {
    ipc.system.openExternalUrl("https://any-on.dev/pro");
  };

  return (
    <div className="w-full h-full bg-background relative">
      {/* Go Back Button */}
      <button
        onClick={onGoBack}
        className="absolute top-4 left-4 p-2 hover:bg-accent rounded-md transition-all z-10 group"
        aria-label={t("aria.goBack", { ns: "common" })}
      >
        <ArrowLeft
          size={20}
          className="text-foreground/70 group-hover:text-foreground transition-colors"
        />
      </button>

      {/* Centered Content */}
      <div className="flex flex-col items-center justify-center h-full px-8">
        {/* Lock Icon */}
        <Lock size={72} className="text-primary/60 dark:text-primary/70 mb-8" />

        {/* Message */}
        <h2 className="text-3xl font-semibold text-foreground mb-4 text-center">
          {t("preview.annotatorProFeature", { ns: "app" })}
        </h2>
        <p className="text-muted-foreground mb-10 text-center max-w-md text-base leading-relaxed">
          {t("preview.annotatorDescription", { ns: "app" })}
        </p>

        {/* Get Pro Button */}
        <Button
          onClick={handleGetPro}
          size="lg"
          className="px-8 shadow-md hover:shadow-lg transition-all"
        >
          {t("preview.getAnyonPro", { ns: "app" })}
        </Button>
      </div>
    </div>
  );
};
