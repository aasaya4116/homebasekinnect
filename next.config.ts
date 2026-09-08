import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This repo sits below another package-lock.json on the development machine.
  // Pin Turbopack to Homebase so builds never scan the parent user directory.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
