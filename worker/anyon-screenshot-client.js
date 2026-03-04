(() => {
  async function captureScreenshot() {
    try {
      // Use html-to-image if available
      if (typeof htmlToImage !== "undefined") {
        return await htmlToImage.toPng(document.body, {
          width: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
          // Provide a transparent placeholder for cross-origin images that
          // fail to fetch, preventing tainted canvas export errors.
          imagePlaceholder:
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        });
      }
      throw new Error("html-to-image library not found");
    } catch (error) {
      console.error("[anyon-screenshot] Failed to capture screenshot:", error);
      throw error;
    }
  }
  async function handleScreenshotRequest(purpose) {
    try {
      console.debug("[anyon-screenshot] Capturing screenshot...");

      const dataUrl = await captureScreenshot();

      console.debug("[anyon-screenshot] Screenshot captured successfully");

      // Send success response to parent (pass through purpose field)
      window.parent.postMessage(
        {
          type: "anyon-screenshot-response",
          success: true,
          dataUrl: dataUrl,
          purpose: purpose,
        },
        "*",
      );
    } catch (error) {
      console.error("[anyon-screenshot] Screenshot capture failed:", error);

      // Send error response to parent
      window.parent.postMessage(
        {
          type: "anyon-screenshot-response",
          success: false,
          error: error.message,
          purpose: purpose,
        },
        "*",
      );
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent) return;

    if (event.data.type === "anyon-take-screenshot") {
      handleScreenshotRequest(event.data.purpose);
    }
  });
})();
