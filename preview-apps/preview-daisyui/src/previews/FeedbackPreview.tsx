import { AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

export function FeedbackPreview() {
  const [toasts, setToasts] = useState<
    { id: number; message: string; type: string }[]
  >([]);
  let toastId = 0;

  const showToast = (message: string, type: string) => {
    const id = toastId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Feedback Components</h2>

      <div>
        <h3 className="text-lg font-semibold mb-3">Alerts</h3>
        <div className="space-y-3">
          <div className="alert alert-info shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>This is an info alert with helpful information.</span>
          </div>

          <div className="alert alert-success shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Operation completed successfully!</span>
          </div>

          <div className="alert alert-warning shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4v2m0 5v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Warning: Please review before proceeding.</span>
          </div>

          <div className="alert alert-error shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m6-8a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>An error occurred. Please try again.</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Badges</h3>
        <div className="flex flex-wrap gap-3">
          <div className="badge">Default</div>
          <div className="badge badge-primary">Primary</div>
          <div className="badge badge-secondary">Secondary</div>
          <div className="badge badge-accent">Accent</div>
          <div className="badge badge-ghost">Ghost</div>
          <div className="badge badge-success">Success</div>
          <div className="badge badge-warning">Warning</div>
          <div className="badge badge-error">Error</div>
          <div className="badge badge-info">Info</div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Progress</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">
              Default Progress
            </label>
            <progress className="progress w-full" value="45" max="100" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Primary Progress
            </label>
            <progress
              className="progress progress-primary w-full"
              value="60"
              max="100"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Success Progress
            </label>
            <progress
              className="progress progress-success w-full"
              value="100"
              max="100"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              Warning Progress
            </label>
            <progress
              className="progress progress-warning w-full"
              value="30"
              max="100"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Toast Notifications</h3>
        <div className="space-y-2">
          <button
            className="btn btn-sm btn-primary"
            onClick={() =>
              showToast("Success! Operation completed.", "success")
            }
          >
            Show Success Toast
          </button>
          <button
            className="btn btn-sm btn-warning"
            onClick={() =>
              showToast("Warning: Please check your input.", "warning")
            }
          >
            Show Warning Toast
          </button>
          <button
            className="btn btn-sm btn-error"
            onClick={() => showToast("Error: Something went wrong.", "error")}
          >
            Show Error Toast
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Loading Spinner</h3>
        <div className="flex flex-wrap gap-6">
          <span className="loading loading-spinner loading-xs" />
          <span className="loading loading-spinner loading-sm" />
          <span className="loading loading-spinner loading-md" />
          <span className="loading loading-spinner loading-lg" />
        </div>
      </div>

      <div className="fixed bottom-4 right-4 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`alert shadow-lg pointer-events-auto ${
              toast.type === "success"
                ? "alert-success"
                : toast.type === "warning"
                  ? "alert-warning"
                  : "alert-error"
            }`}
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
            {toast.type === "warning" && <AlertCircle className="w-5 h-5" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
