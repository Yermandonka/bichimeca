import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3210",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } },
    },
  ],
  webServer: {
    command: "npx next dev -p 3210",
    url: "http://localhost:3210",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
