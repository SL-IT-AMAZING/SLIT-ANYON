import { Box, Button, Container, Paper } from "@mui/material";
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: "flex", flexWrap: "wrap", gap: 1 }}>
        {componentRegistry.map((c) => (
          <Button
            key={c.id}
            onClick={() => setActiveComponent(c.id)}
            variant={activeComponent === c.id ? "contained" : "outlined"}
            size="small"
            sx={{
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            {c.name}
          </Button>
        ))}
      </Box>
      <Paper sx={{ p: 4, backgroundColor: "#fafafa" }}>
        {ActivePreview && <ActivePreview />}
      </Paper>
    </Container>
  );
}

export default App;
