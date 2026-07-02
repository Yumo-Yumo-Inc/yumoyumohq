import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "lib/**/__tests__/**/*.test.ts",
      "lib/**/*.test.ts",
      "scripts/**/__tests__/**/*.test.ts",
    ],
    exclude: ["node_modules/**", ".next/**", "tmp/**"],
    // Slow integration tests can mark themselves with `.slow.test.ts`
    testTimeout: 15_000,
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
