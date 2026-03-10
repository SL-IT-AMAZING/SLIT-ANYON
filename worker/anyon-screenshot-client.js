(() => {
  const IMAGE_PLACEHOLDER =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  function isTaintedCanvasError(error) {
    const message = String(error?.message || error || "").toLowerCase();
    return (
      message.includes("tainted canvases may not be exported") ||
      message.includes("securityerror") ||
      message.includes("tainted")
    );
  }

  function shouldSkipUnsafeNode(node) {
    if (!(node instanceof Element)) {
      return true;
    }

    const tagName = node.tagName.toUpperCase();
    return !["VIDEO", "IFRAME", "CANVAS"].includes(tagName);
  }

  function buildCaptureOptions(skipUnsafeNodes) {
    return {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      imagePlaceholder: IMAGE_PLACEHOLDER,
      cacheBust: true,
      skipFonts: true,
      ...(skipUnsafeNodes
        ? {
            filter(node) {
              return shouldSkipUnsafeNode(node);
            },
          }
        : {}),
    };
  }

  async function captureScreenshot() {
    try {
      // Use html-to-image if available
      if (typeof htmlToImage !== "undefined") {
        try {
          return await htmlToImage.toPng(document.body, buildCaptureOptions(false));
        } catch (error) {
          if (!isTaintedCanvasError(error)) {
            throw error;
          }

          console.warn(
            "[anyon-screenshot] Retrying screenshot without cross-origin video/iframe/canvas nodes.",
            error,
          );

          return await htmlToImage.toPng(document.body, buildCaptureOptions(true));
        }
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
      const message = isTaintedCanvasError(error)
        ? "This page includes cross-origin media that blocks screenshot export. Try pausing the media, reloading the page, or annotating a different view."
        : error.message;

      // Send error response to parent
      window.parent.postMessage(
        {
          type: "anyon-screenshot-response",
          success: false,
          error: message,
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
