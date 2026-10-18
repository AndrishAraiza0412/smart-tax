import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 45_000 }, // el primer bundle web es lento en CI
  use: { baseURL: "http://localhost:8081" },
  webServer: {
    command: "pnpm exec expo start --web --port 8081",
    url: "http://localhost:8081",
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
    reuseExistingServer: !process.env['CI'],
  },
});
