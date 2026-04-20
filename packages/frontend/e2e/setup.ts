import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_PATH = path.join(__dirname, '.auth', 'tenant-admin.json');

setup('tenant_admin 로그인 세션 저장', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('textbox', { name: '이메일' }).fill('admin@korea.ac.kr');
  await page.locator('input[type="password"]').fill('Tenant1234!');
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  await page.context().storageState({ path: STORAGE_PATH });
});
