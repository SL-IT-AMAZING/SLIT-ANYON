import crypto from "node:crypto";
import { DESIGN_SYSTEM_IDS } from "@/shared/designSystems";

let activeDesignSystemId: string | null = null;

export async function getPreviewUrl(
  designSystemId: string,
  senderOrigin?: string,
): Promise<{ url: string; nonce: string }> {
  if (!DESIGN_SYSTEM_IDS.includes(designSystemId)) {
    throw new Error(`Unknown design system: ${designSystemId}`);
  }

  const nonce = crypto.randomUUID();

  if (activeDesignSystemId && activeDesignSystemId !== designSystemId) {
    await stopActivePreview();
  }

  activeDesignSystemId = designSystemId;

  const parentOrigin = senderOrigin || "*";
  const url = `anyon-preview://${designSystemId}/index.html?nonce=${nonce}&parentOrigin=${encodeURIComponent(parentOrigin)}`;
  return { url, nonce };
}

export async function stopActivePreview(): Promise<void> {
  activeDesignSystemId = null;
}
