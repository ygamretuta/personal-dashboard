import { defineConfig } from "@playwright/test";

const PORT = 3100;

/** Regenerates the README / landing-page screenshots: `pnpm screenshots`. */
export default defineConfig({
  testDir: "./tests/screenshots",
  use: { baseURL: `http://localhost:${PORT}`, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { AUTH_SECRET: "screenshots-only-secret" },
  },
});
