import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      // Only pure, testable modules participate in coverage; the Next.js
      // app shell and framework config are the untestable boundary.
      include: ["src/domain/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
