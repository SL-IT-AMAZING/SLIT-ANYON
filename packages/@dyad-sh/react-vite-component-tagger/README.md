# @dyad-sh/react-vite-component-tagger

> **Note**: This package is maintained under the `@dyad-sh` npm scope for backward compatibility. New Anyon apps use an inline plugin instead.

A Vite plugin that automatically adds `data-anyon-id` and `data-anyon-name` attributes to your React components.

## Usage

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import anyonTagger from "@dyad-sh/react-vite-component-tagger";

export default defineConfig({
  plugins: [react(), anyonTagger()],
});
```

## Publishing

```sh
cd packages/@dyad-sh/react-vite-component-tagger/ && npm run prepublishOnly && npm publish
```
