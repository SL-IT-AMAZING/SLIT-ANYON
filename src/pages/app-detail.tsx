import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { PreviewPanel } from "@/components/preview_panel/PreviewPanel";
import { useParams } from "@tanstack/react-router";
import { useSetAtom } from "jotai";
import { useEffect } from "react";

export default function AppDetailPage() {
  const { appId } = useParams({ from: "/apps/$appId" });
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);
  const numericAppId = Number(appId);

  useEffect(() => {
    if (!Number.isNaN(numericAppId)) {
      setSelectedAppId(numericAppId);
    }
  }, [numericAppId, setSelectedAppId]);

  return (
    <div className="flex flex-col h-full w-full">
      <PreviewPanel minimal />
    </div>
  );
}
