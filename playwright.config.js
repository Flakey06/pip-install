import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "src/__tests__",
  testMatch: "**/*.spec.js",
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5173",
  },
});
