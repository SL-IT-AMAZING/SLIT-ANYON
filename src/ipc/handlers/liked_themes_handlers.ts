import { eq } from "drizzle-orm";
import { db } from "../../db";
import { likedThemes } from "../../db/schema";
import { likedThemesContracts } from "../types/liked_themes";
import { createTypedHandler } from "./base";

export function registerLikedThemesHandlers() {
  createTypedHandler(likedThemesContracts.getLikedThemes, async () => {
    const rows = await db.select({ themeId: likedThemes.themeId }).from(likedThemes);
    return { themeIds: rows.map((row) => row.themeId) };
  });

  createTypedHandler(
    likedThemesContracts.toggleThemeLike,
    async (_, { themeId }) => {
      const normalizedThemeId = themeId.trim();
      if (!normalizedThemeId) {
        throw new Error("Theme ID is required");
      }

      const existing = await db
        .select({ id: likedThemes.id })
        .from(likedThemes)
        .where(eq(likedThemes.themeId, normalizedThemeId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .delete(likedThemes)
          .where(eq(likedThemes.themeId, normalizedThemeId));
        return { liked: false };
      }

      await db.insert(likedThemes).values({ themeId: normalizedThemeId });
      return { liked: true };
    },
  );
}
