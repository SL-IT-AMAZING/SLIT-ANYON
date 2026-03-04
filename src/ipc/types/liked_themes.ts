import { z } from "zod";
import { createClient, defineContract } from "../contracts/core";

export const GetLikedThemesOutputSchema = z.object({
  themeIds: z.array(z.string()),
});

export const ToggleThemeLikeInputSchema = z.object({
  themeId: z.string().min(1),
});

export const ToggleThemeLikeOutputSchema = z.object({
  liked: z.boolean(),
});

export const likedThemesContracts = {
  getLikedThemes: defineContract({
    channel: "get-liked-themes",
    input: z.void(),
    output: GetLikedThemesOutputSchema,
  }),
  toggleThemeLike: defineContract({
    channel: "toggle-theme-like",
    input: ToggleThemeLikeInputSchema,
    output: ToggleThemeLikeOutputSchema,
  }),
} as const;

export const likedThemesClient = createClient(likedThemesContracts);

export type GetLikedThemesOutput = z.infer<typeof GetLikedThemesOutputSchema>;
export type ToggleThemeLikeInput = z.infer<typeof ToggleThemeLikeInputSchema>;
export type ToggleThemeLikeOutput = z.infer<typeof ToggleThemeLikeOutputSchema>;
