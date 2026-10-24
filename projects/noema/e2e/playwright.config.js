import { defineConfig } from '@playwright/test';

const ci = !!process.env.CI;

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',
  timeout: 30000,
  retries: ci ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:8765/site/',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: 'python3 -m http.server 8765 --bind 127.0.0.1',
    cwd: '..',
    url: 'http://127.0.0.1:8765/site/index.html',
    reuseExistingServer: !ci,
    timeout: 15000,
  },
});
