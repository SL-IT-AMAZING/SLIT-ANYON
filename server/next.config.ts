import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Server code is linted separately via biome
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
