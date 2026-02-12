# @dyad-sh/nextjs-webpack-component-tagger

> **Note**: This package is maintained under the `@dyad-sh` npm scope for backward compatibility.

A webpack loader for Next.js that automatically adds `data-anyon-id` and `data-anyon-name` attributes to your React components.

## Usage

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    if (process.env.NODE_ENV === "development") {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: "@dyad-sh/nextjs-webpack-component-tagger",
      });
    }
    return config;
  },
};

export default nextConfig;
```

## Publishing

```sh
cd packages/@dyad-sh/nextjs-webpack-component-tagger/ && npm run prepublishOnly && npm publish
```
