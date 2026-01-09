import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Exclude the example shadcn folder from the build
  pageExtensions: ["tsx", "ts", "jsx", "js"],
};

export default nextConfig;

