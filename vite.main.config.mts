import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "vite";
// Load .env so that local dev picks up Supabase credentials.
// In CI the same vars come from GitHub Secrets / env.
dotenv.config();
// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Inject Supabase credentials at build time so they are available in
  // the packaged (production) app without shipping a .env file.
  // The anon key is a *public* client key — safe to embed.
  define: {
    "process.env.ANYON_SUPABASE_URL": JSON.stringify(
      process.env.ANYON_SUPABASE_URL ?? "",
    ),
    "process.env.ANYON_SUPABASE_ANON_KEY": JSON.stringify(
      process.env.ANYON_SUPABASE_ANON_KEY ?? "",
    ),
  },
  build: {
    rollupOptions: {
      external: ["better-sqlite3"],
    },
  },
  plugins: [
    {
      name: "restart",
      closeBundle() {
        process.stdin.emit("data", "rs");
      },
    },
  ],
});
