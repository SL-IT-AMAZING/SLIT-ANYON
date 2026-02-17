import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    if (process.env.NODE_ENV === "development") {
      config.module.rules.push({
        test: /\.(jsx|tsx)$/,
        exclude: /node_modules/,
        enforce: "pre",
        use: require.resolve("./plugins/anyon-component-tagger.mjs"),
      });
    }
    return config;
  },
};

export default nextConfig;
