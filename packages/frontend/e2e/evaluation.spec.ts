import { test, expect } from '@playwright/test';

// storageState로 이미 인증됨 (setup.ts에서 세션 저장)
// 매번 로그인하지 않음

test.describe('평가 CRUD', () => {
  test('대시보드에 평가 목록이 표시된다', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: '평가 관리' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.ant-table')).toBeVisible();
  });

  test('평가 생성 → 설정 페이지 이동', async ({ page }) => {
    await page.goto('/evaluations/create');
    await expect(page.getByText('평가명')).toBeVisible();

    // 폼 작성
    await page.getByPlaceholder('예: 2026학년도 수시 면접평가').fill('E2E 테스트 평가');
    await page.locator('.ant-select-selector').click();
    await page.locator('.ant-select-item-option').filter({ hasText: 'A. 위원 평가' }).click();

    // 생성 버튼
    await page.getByRole('button', { name: '생성' }).click();

    // 설정 페이지로 이동
    await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });
  });

  test('평가 설정 저장 후 성공 메시지', async ({ page }) => {
    await page.goto('/evaluations/create');
    await page.getByPlaceholder('예: 2026학년도 수시 면접평가').fill('설정 저장 테스트');
    await page.locator('.ant-select-selector').click();
    await page.locator('.ant-select-item-option').filter({ hasText: 'A. 위원 평가' }).click();
    await page.getByRole('button', { name: '생성' }).click();
    await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });

    // 설정 저장
    await page.getByRole('button', { name: '설정 저장' }).click();
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 5000 });
  });

  test('대시보드에서 평가 복사', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });

    const copyBtn = page.getByRole('button', { name: '복사' }).first();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      await expect(page.locator('.ant-message')).toBeVisible({ timeout: 5000 });
    }
  });

  test('대시보드에서 평가 삭제', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });

    const deleteBtn = page.getByRole('button', { name: '삭제' }).first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      // Popconfirm — "확인" 또는 OK 버튼
      await page.locator('.ant-popover .ant-btn-primary, .ant-popconfirm-buttons .ant-btn-primary').click();
      await expect(page.locator('.ant-message')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('네비게이션', () => {
  test('사이드바 — 결과 조회 이동', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: '평가 관리' })).toBeVisible({ timeout: 10000 });

    await page.locator('.ant-menu-item').filter({ hasText: '결과 조회' }).click();
    await expect(page).toHaveURL(/\/results/, { timeout: 5000 });
  });

  test('사이드바 — 대시보드 이동', async ({ page }) => {
    await page.goto('/results');
    await page.locator('.ant-menu-item').filter({ hasText: '대시보드' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('평가 생성 후 뒤로가기 → 대시보드', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: '평가 관리' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: '평가 생성' }).click();
    await expect(page).toHaveURL(/\/create/);
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
