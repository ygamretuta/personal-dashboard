import { defineConfig } from "@playwright/test";

// Point at a Vercel preview URL in CI by setting E2E_BASE_URL.
// Locally a dedicated port avoids reusing an unrelated dev server on 3000.
const LOCAL_PORT = 3100;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${LOCAL_PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `pnpm dev --port ${LOCAL_PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { AUTH_SECRET: "e2e-only-secret" }, // keeps Auth.js quiet; no real sign-in happens
      },
});
