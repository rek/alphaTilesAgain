import path from 'node:path';
import { defineConfig } from '@playwright/test';

// Playwright config for apps/alphaTiles-agent-e2e: the yue web build, checked
// through its dev-only WebMCP tools (agentTools.ts) rather than screenshots.
// Webserver = `nx run alphaTiles:start-web-yue` (Metro dev, so __DEV__ tools are
// registered), reused when one is already up on :8081.
//
// Installed Chrome (channel 'chrome'), or CHROME_PATH to point at any
// Chromium-family binary. Headless works; autoplay needs no gesture here but
// the app's own tap-to-begin gate is still driven by a real click.

const executablePath = process.env['CHROME_PATH'];

export default defineConfig({
  testDir: './specs',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  // A cold Metro bundle of the app is ~60s on first request.
  timeout: 180_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:8081',
    ...(executablePath
      ? { launchOptions: { executablePath, args: ['--autoplay-policy=no-user-gesture-required'] } }
      : { channel: 'chrome' as const, launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] } }),
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx nx run alphaTiles:start-web-yue',
    cwd: path.resolve(__dirname, '../../'),
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 600_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
