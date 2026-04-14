import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: '이메일' }).fill('admin@korea.ac.kr');
  await page.locator('input[type="password"]').fill('Tenant1234!');
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  await expect(page.getByRole('heading', { name: '평가 관리' })).toBeVisible({ timeout: 10000 });
}

test.describe('평가 관리 흐름', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('대시보드 — 평가 목록 표시', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '평가 관리' })).toBeVisible();
    await expect(page.getByRole('button', { name: '평가 생성' })).toBeVisible();
  });

  test('평가 생성 페이지 이동', async ({ page }) => {
    await page.getByRole('button', { name: '평가 생성' }).click();
    await expect(page).toHaveURL(/\/evaluations\/create/);
    await expect(page.getByText('평가명')).toBeVisible();
    await expect(page.getByText('평가 유형')).toBeVisible();
  });

  test.fixme('평가 생성 폼 작성 (Ant Select 드롭다운 타이밍)', async ({ page }) => {
    await page.goto('/evaluations/create');
    await page.getByPlaceholder('예: 2026학년도 수시 면접평가').fill('E2E 테스트 평가');

    // Select 열고 선택 후 닫기
    await page.locator('.ant-select-selector').click();
    await page.locator('.ant-select-item-option-content').filter({ hasText: 'A. 위원 평가' }).click();

    // Select 닫힌 후 나머지 필드 채우기
    await expect(page.getByPlaceholder('예: 2026')).toBeVisible({ timeout: 3000 });
    await page.getByPlaceholder('예: 2026').fill('2026');
    await page.getByPlaceholder('예: 수시, 정시').fill('수시');
  });

  test.fixme('사이드바 네비게이션 (rate limiting으로 login 실패)', async ({ page }) => {
    // 결과 조회로 이동
    await page.locator('.ant-menu-item').filter({ hasText: '결과 조회' }).click();
    await expect(page).toHaveURL(/\/results/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: '결과 조회' })).toBeVisible({ timeout: 5000 });
  });
});
