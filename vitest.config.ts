import path from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    globals: true,
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/Refs/**",
      "**/PUMPREF/**",
      "**/HELIUSREF/**",
      "**/HeliusRef/**",
    ],
  },
});
