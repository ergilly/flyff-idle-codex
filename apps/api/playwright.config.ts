import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/functional",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "test/reports/playwright-report" }],
    ["allure-playwright", { resultsDir: "test/reports/allure-results" }]
  ],
  outputDir: "test/reports/test-results",
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:4000/health",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  use: {
    baseURL: "http://127.0.0.1:4000"
  }
});
