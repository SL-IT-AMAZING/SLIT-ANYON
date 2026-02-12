/**
 * anyon-sw-register.js – Service Worker registration script
 * This script is injected into the HTML to register the Service Worker
 * and forward messages to the parent window
 */

(function () {
  // Check if Service Workers are supported
  if (!("serviceWorker" in navigator)) {
    console.warn("[Anyon] Service Workers are not supported in this browser");
    return;
  }

  // Register the Service Worker
  navigator.serviceWorker
    .register("/anyon-sw.js", { scope: "/" })
    .then((registration) => {
      console.log("[Anyon] Service Worker registered:", registration.scope);

      // Handle updates
      registration.addEventListener("updatefound", () => {
        console.log("[Anyon] Service Worker update found");
      });
    })
    .catch((error) => {
      console.error("[Anyon] Service Worker registration failed:", error);
    });

  // Listen for messages from the Service Worker
  navigator.serviceWorker.addEventListener("message", (event) => {
    // Forward all messages to the parent window
    try {
      window.parent.postMessage(event.data, "*");
    } catch (e) {
      console.error("[Anyon] Failed to forward message to parent:", e);
    }
  });

  // Also listen for messages from the active Service Worker controller
  if (navigator.serviceWorker.controller) {
    console.log("[Anyon] Service Worker controller already active");
  }
})();
