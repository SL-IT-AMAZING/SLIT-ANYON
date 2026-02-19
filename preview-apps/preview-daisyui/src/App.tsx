import { useEffect, useRef, useState } from "react";
import { componentRegistry } from "./previews";

const urlParams = new URLSearchParams(window.location.search);
const SESSION_NONCE = urlParams.get("nonce") ?? "";
const ALLOWED_PARENT_ORIGIN = urlParams.get("parentOrigin") ?? "";

function App() {
  const [activeComponent, setActiveComponent] = useState("overview");
  const handshakeCompleted = useRef(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (ALLOWED_PARENT_ORIGIN && event.origin !== ALLOWED_PARENT_ORIGIN)
        return;
      if (event.data?.nonce !== SESSION_NONCE) return;
      if (event.data?.type === "NAVIGATE_COMPONENT") {
        setActiveComponent(event.data.componentId);
      }
      if (event.data?.type === "HANDSHAKE_ACK") {
        handshakeCompleted.current = true;
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    if (window.parent !== window && ALLOWED_PARENT_ORIGIN) {
      window.parent.postMessage(
        {
          type: "PREVIEW_READY",
          nonce: SESSION_NONCE,
          components: componentRegistry.map((c) => ({
            id: c.id,
            name: c.name,
            category: c.category,
          })),
        },
        ALLOWED_PARENT_ORIGIN,
      );
    }
  }, []);

  const ActivePreview =
    componentRegistry.find((c) => c.id === activeComponent)?.component ??
    componentRegistry[0]?.component;

  return (
    <div className="min-h-screen bg-base-100 text-base-content p-6">
      <nav className="mb-6 flex flex-wrap gap-2">
        {componentRegistry.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveComponent(c.id)}
            className={`btn btn-sm ${
              activeComponent === c.id ? "btn-primary" : "btn-ghost"
            }`}
          >
            {c.name}
          </button>
        ))}
      </nav>
      <main>{ActivePreview && <ActivePreview />}</main>
    </div>
  );
}

export default App;
