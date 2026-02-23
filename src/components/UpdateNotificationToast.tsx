import { ArrowDownToLine, X } from "lucide-react";
import { toast } from "sonner";
import { ipc } from "../ipc/types";
import { Button } from "./ui/button";

interface UpdateNotificationToastProps {
  toastId: string | number;
  version?: string;
}

export function UpdateNotificationToast({
  toastId,
  version,
}: UpdateNotificationToastProps) {
  const handleUpdate = () => {
    ipc.system.installUpdate();
    toast.dismiss(toastId);
  };

  const handleDismiss = () => {
    toast.dismiss(toastId);
  };

  return (
    <div className="relative bg-blue-50/95 dark:bg-slate-800/95 backdrop-blur-sm border border-blue-200 dark:border-slate-600 rounded-xl shadow-lg min-w-[320px] max-w-[420px] overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full flex items-center justify-center shadow-sm">
              <ArrowDownToLine className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                업데이트 준비 완료
              </h3>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 text-blue-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-slate-200 transition-colors rounded-md"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-blue-700/80 dark:text-blue-200/70 mt-1">
              {version
                ? `새 버전 ${version}이(가) 다운로드되었습니다.`
                : "새 버전이 다운로드되었습니다."}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button onClick={handleUpdate} size="sm" className="px-4 text-xs">
                지금 업데이트
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="px-3 text-xs"
              >
                나중에
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
