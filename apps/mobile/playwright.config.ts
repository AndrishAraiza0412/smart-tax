import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:8081" },
  webServer: {
    command: "pnpm exec expo start --web --port 8081",
    url: "http://localhost:8081",
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
