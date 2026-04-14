import { test, expect } from '@playwright/test';

test.describe('인증 흐름', () => {
  test('로그인 페이지 렌더링', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '이메일' })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('미인증 → 로그인 리다이렉트', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('로그인 성공 → 대시보드 이동', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: '이메일' }).fill('admin@korea.ac.kr');
    await page.locator('input[type="password"]').fill('Tenant1234!');
    await page.getByRole('button', { name: '로그인' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '평가 관리' })).toBeVisible({ timeout: 10000 });
  });

  test.fixme('잘못된 비밀번호 → 에러 메시지 (rate limiting 환경 이슈)', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: '이메일' }).fill('admin@korea.ac.kr');
    await page.locator('input[type="password"]').fill('wrong');
    await page.getByRole('button', { name: '로그인' }).click();

    // Ant Design message.error는 .ant-message 컨테이너에 표시
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });
  });

  test('회원가입 페이지 렌더링', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
  });

  test('404 페이지', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.getByText('찾을 수 없습니다')).toBeVisible();
  });
});
