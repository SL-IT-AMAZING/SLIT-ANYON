import { Box, Button, Stack } from "@chakra-ui/react";
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
    <Box minH="100vh" bg="gray.50" p={6}>
      <Stack direction="row" spacing={2} mb={6} flexWrap="wrap">
        {componentRegistry.map((c) => (
          <Button
            key={c.id}
            onClick={() => setActiveComponent(c.id)}
            size="sm"
            colorScheme={activeComponent === c.id ? "brand" : "gray"}
            variant={activeComponent === c.id ? "solid" : "outline"}
          >
            {c.name}
          </Button>
        ))}
      </Stack>
      <Box as="main">{ActivePreview && <ActivePreview />}</Box>
    </Box>
  );
}

export default App;
