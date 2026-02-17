import path from "path";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import anyonComponentTagger from "./plugins/anyon-component-tagger";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [anyonComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
