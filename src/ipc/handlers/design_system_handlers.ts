import { DESIGN_SYSTEMS } from "@/shared/designSystems";
import { designSystemContracts } from "../types/design_systems";
import {
  getPreviewUrl,
  stopActivePreview,
} from "../utils/preview_server_manager";
import { createTypedHandler } from "./base";

export function registerDesignSystemHandlers() {
  createTypedHandler(designSystemContracts.getDesignSystems, async () => {
    return DESIGN_SYSTEMS;
  });

  createTypedHandler(
    designSystemContracts.getPreviewUrl,
    async (event, { designSystemId }) => {
      const senderUrl = event.sender.getURL();
      const senderOrigin = senderUrl ? new URL(senderUrl).origin : undefined;
      return getPreviewUrl(designSystemId, senderOrigin);
    },
  );

  createTypedHandler(designSystemContracts.stopActivePreview, async () => {
    await stopActivePreview();
  });
}
