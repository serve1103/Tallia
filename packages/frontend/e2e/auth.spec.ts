import { test, expect, type Page } from '@playwright/test';

// 공용 로그인 헬퍼
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: '이메일' }).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

test.describe('인증', () => {
  test('로그인 페이지 렌더링', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: '이메일' })).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });

  test('미인증 상태로 대시보드 접근 → 로그인 리다이렉트', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('로그인 성공 → 대시보드 이동 + 유저 정보 표시', async ({ page }) => {
    await login(page, 'admin@korea.ac.kr', 'Tenant1234!');
    await expect(page.getByRole('heading', { name: '평가 관리' })).toBeVisible({ timeout: 10000 });
  });

  test('로그인 상태에서 /login 접근 → 대시보드로 리다이렉트', async ({ page }) => {
    await login(page, 'admin@korea.ac.kr', 'Tenant1234!');
    await page.goto('/login');
    // 이미 로그인됐으면 /login에 머물면 안 됨
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('잘못된 비밀번호 → 로그인 페이지에 머무름', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: '이메일' }).fill('wrong@wrong.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: '로그인' }).click();
    // 로그인 실패 시 /login에 머물러야 함
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/login/);
  });

  test('회원가입 페이지 렌더링', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
  });

  test('404 페이지', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.getByText('찾을 수 없습니다')).toBeVisible();
  });

  test('platform_admin vs tenant_admin — 사이드바 메뉴 차이', async ({ page }) => {
    // tenant_admin 로그인 → admin 메뉴 안 보임
    await login(page, 'admin@korea.ac.kr', 'Tenant1234!');
    await expect(page.getByText('대학 관리')).not.toBeVisible();

    // TODO: platform_admin 로그인은 별도 테스트 (rate limiting 고려)
  });
});
