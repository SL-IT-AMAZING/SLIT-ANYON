import { ConfigProvider } from "antd";
import { useEffect, useRef, useState } from "react";
import { componentRegistry } from "./previews";
import { themeConfig } from "./theme";

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
    <ConfigProvider theme={themeConfig}>
      <div
        style={{ minHeight: "100vh", background: "#fafafa", padding: "24px" }}
      >
        <nav
          style={{
            marginBottom: "24px",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {componentRegistry.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveComponent(c.id)}
              style={{
                padding: "8px 16px",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 500,
                border: "1px solid #d9d9d9",
                background: activeComponent === c.id ? "#1890ff" : "#fff",
                color: activeComponent === c.id ? "#fff" : "#000000d9",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
            >
              {c.name}
            </button>
          ))}
        </nav>
        <main>{ActivePreview && <ActivePreview />}</main>
      </div>
    </ConfigProvider>
  );
}

export default App;
