import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/media/resolve": ["./runtime-tools/**/*"],
  },
};

export default nextConfig;
