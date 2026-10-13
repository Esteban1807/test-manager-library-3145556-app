import { defineConfig } from '@playwright/test';

// End-to-end tests (tasks T-22). They need the API running and an admin account:
//   VITE_API_URL   API base URL (default http://localhost:8000/api/v1)
//   E2E_USERNAME   admin username
//   E2E_PASSWORD   admin password
// Uses the Edge already installed on Windows, so no browser download is needed.
export default defineConfig({
  testDir: './tests',
  reporter: 'list',
  timeout: 90_000,
  use: {
    baseURL: 'http://localhost:5173',
    channel: process.env.PW_CHANNEL ?? 'msedge',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
