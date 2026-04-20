import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(__dirname, 'e2e', '.auth', 'tenant-admin.json');

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    // 1단계: 로그인 세션 저장 (1회만)
    {
      name: 'setup',
      testMatch: /setup\.ts/,
    },
    // 2단계: 인증 불필요 테스트
    {
      name: 'no-auth',
      testMatch: /auth\.spec\.ts/,
      use: { browserName: 'chromium' },
    },
    // 3단계: 인증 필요 테스트 (저장된 세션 재사용)
    {
      name: 'authenticated',
      testMatch: /(evaluation(|-flow)|features)\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        browserName: 'chromium',
        storageState: authFile,
      },
    },
    // 4단계: platform_admin 테스트 (각 테스트 내에서 직접 로그인)
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts/,
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'cd ../backend && node dist/packages/backend/src/main.js',
      port: 3000,
      reuseExistingServer: true,
    },
    {
      command: 'npx vite',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
