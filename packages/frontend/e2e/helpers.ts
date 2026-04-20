import type { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: '이메일' }).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  const { expect } = await import('@playwright/test');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}
