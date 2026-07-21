import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:3218";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "line",
  use: { baseURL, trace: "retain-on-failure" },
  webServer: {
    command: "npm run build:web && tsx tests/e2e/server.ts",
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
