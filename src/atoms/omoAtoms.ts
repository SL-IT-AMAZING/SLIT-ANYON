import { atom } from "jotai";

/**
 * The currently selected OMO agent ID for the chat session.
 * When null, the default agent (usually "sisyphus") is used.
 */
export const selectedOmoAgentIdAtom = atom<string | null>(null);

/**
 * Whether the OMO command palette is open.
 */
export const omoCommandPaletteOpenAtom = atom<boolean>(false);
