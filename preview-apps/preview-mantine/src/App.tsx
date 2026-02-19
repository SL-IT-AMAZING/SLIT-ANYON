import { Button, Container, Group, Stack } from "@mantine/core";
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
    <Container py="xl">
      <Stack gap="lg">
        <Group wrap="wrap" gap="xs">
          {componentRegistry.map((c) => (
            <Button
              key={c.id}
              onClick={() => setActiveComponent(c.id)}
              variant={activeComponent === c.id ? "filled" : "light"}
              size="sm"
            >
              {c.name}
            </Button>
          ))}
        </Group>
        <main>{ActivePreview && <ActivePreview />}</main>
      </Stack>
    </Container>
  );
}

export default App;
