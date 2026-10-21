import { defineConfig, devices } from "@playwright/test";
const baseURL = `http://127.0.0.1:4173${process.env.VITE_BASE_PATH || "/"}`;
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  use: {
    ...devices["iPhone 13"],
    defaultBrowserType: "chromium",
    isMobile: true,
    baseURL,
    launchOptions: {
      executablePath:
        process.env.CHROME_PATH ||
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
    },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173",
    url: baseURL,
    reuseExistingServer: true,
  },
  reporter: "list",
});
