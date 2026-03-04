import { useEffect, useRef, useState } from "react";
import { componentRegistry } from "./previews";

const urlParams = new URLSearchParams(window.location.search);
const SESSION_NONCE = urlParams.get("nonce") ?? "";
const ALLOWED_PARENT_ORIGIN = urlParams.get("parentOrigin") ?? "";
const DARK_THEME_STYLE_ID = "preview-themes-dark-vars";

type ThemeVars = Record<string, string>;

function normalizeVarName(name: string) {
  return name.startsWith("--") ? name : `--${name}`;
}

function applyLightVars(vars: ThemeVars) {
  const rootStyle = document.documentElement.style;
  Object.entries(vars).forEach(([name, value]) => {
    rootStyle.setProperty(normalizeVarName(name), value);
  });
}

function applyDarkVars(vars: ThemeVars) {
  let styleNode = document.getElementById(
    DARK_THEME_STYLE_ID,
  ) as HTMLStyleElement | null;
  if (!styleNode) {
    styleNode = document.createElement("style");
    styleNode.id = DARK_THEME_STYLE_ID;
    document.head.appendChild(styleNode);
  }

  const darkCss = Object.entries(vars)
    .map(([name, value]) => `  ${normalizeVarName(name)}: ${value};`)
    .join("\n");

  styleNode.textContent = `.dark {\n${darkCss}\n}`;
}

function App() {
  const [activeComponent, setActiveComponent] = useState("cards");
  const handshakeCompleted = useRef(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (ALLOWED_PARENT_ORIGIN && event.origin !== ALLOWED_PARENT_ORIGIN)
        return;
      if (event.data?.nonce !== SESSION_NONCE) return;

      if (event.data?.type === "NAVIGATE_COMPONENT") {
        setActiveComponent(event.data.componentId);
      }

      if (event.data?.type === "APPLY_THEME") {
        const cssVars = event.data.cssVars ?? {};
        if (cssVars.light && typeof cssVars.light === "object") {
          applyLightVars(cssVars.light);
        }
        if (cssVars.dark && typeof cssVars.dark === "object") {
          applyDarkVars(cssVars.dark);
        }
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
    <div className="min-h-screen bg-background text-foreground p-5 sm:p-6">
      <nav className="mb-6 flex flex-wrap gap-2">
        {componentRegistry.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveComponent(c.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeComponent === c.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
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
