import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { existsSync } from "node:fs";

dotenv.config({
  override: true,
  path: existsSync("test/env/.env.local") ? "test/env/.env.local" : "apps/web/test/env/.env.local"
});

const browserProjects = {
  chromium: { ...devices["Desktop Chrome"] },
  firefox: { ...devices["Desktop Firefox"] },
  webkit: { ...devices["Desktop Safari"] }
};

type BrowserName = keyof typeof browserProjects;

const browserNames = Object.keys(browserProjects) as BrowserName[];
const randomBrowserNames = browserNames;

function selectBrowser(): BrowserName {
  const configuredBrowser = process.env.PLAYWRIGHT_BROWSER;

  if (configuredBrowser && (browserNames as readonly string[]).includes(configuredBrowser)) {
    return configuredBrowser as BrowserName;
  }

  const selectedBrowser = process.env.PLAYWRIGHT_RESOLVED_BROWSER;

  if (selectedBrowser && (browserNames as readonly string[]).includes(selectedBrowser)) {
    return selectedBrowser as BrowserName;
  }

  return randomBrowserNames[Math.floor(Math.random() * randomBrowserNames.length)];
}

const selectedBrowser = selectBrowser();
process.env.PLAYWRIGHT_RESOLVED_BROWSER = selectedBrowser;
console.log(`Playwright browser: ${selectedBrowser}`);

export default defineConfig({
  testDir: "./test/specs",
  fullyParallel: false,
  forbidOnly: process.env.CI === "true",
  retries: process.env.CI === "true" ? 2 : 0,
  workers: process.env.CI === "true" ? 1 : 10,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "test/reports/playwright-report" }],
    ["allure-playwright", { resultsDir: "test/reports/allure-results" }]
  ],
  outputDir: "test/reports/test-results",
  webServer: [
    {
      command: "npm run dev -w @flyff-idle/api",
      url: "http://127.0.0.1:4000/health",
      reuseExistingServer: process.env.CI === "false",
      timeout: process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT) * 1000 : 60_000
    },
    {
      command: "npm run dev",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: process.env.CI === "false",
      timeout: process.env.TEST_TIMEOUT ? parseInt(process.env.TEST_TIMEOUT) * 1000 : 60_000
    }
  ],
  use: {
    headless: process.env.PLAYWRIGHT_HEADED !== "true",
    baseURL: process.env.BASE_URL || "http://127.0.0.1:3000",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "on-first-retry",
    actionTimeout: process.env.ACTION_TIMEOUT ? parseInt(process.env.ACTION_TIMEOUT) * 1000 : 10_000,
    navigationTimeout: process.env.NAVIGATION_TIMEOUT
      ? parseInt(process.env.NAVIGATION_TIMEOUT) * 1000
      : 30_000
  },
  projects: [
    {
      name: selectedBrowser,
      use: browserProjects[selectedBrowser]
    }
  ]
});
