import { test, expect } from '@playwright/test';
import { login } from './helpers';

// platform_admin 전용 테스트
// rate limit 주의: 두 시나리오를 하나의 테스트로 묶어 로그인 1회만 수행

test('platform_admin 로그인 → 대학 관리 메뉴 노출 + 테넌트 생성 모달 열기', async ({ page }) => {
  await login(page, 'admin@tallia.kr', 'Admin1234!');

  // 대학 관리 메뉴가 사이드바에 표시되어야 함
  await expect(page.getByText('대학 관리')).toBeVisible({ timeout: 10000 });

  // /admin/tenants 접근
  await page.goto('/admin/tenants', { timeout: 10000 });

  // 테넌트 목록 페이지 렌더링 확인 (대학 공간 생성 버튼 또는 테이블)
  await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });

  // "+ 대학 공간 생성" 버튼 클릭
  await page.getByRole('button', { name: '대학 공간 생성' }).click();

  // 모달 노출 확인
  await expect(page.locator('.ant-modal')).toBeVisible({ timeout: 5000 });
  await expect(
    page.locator('.ant-modal-title').filter({ hasText: '대학 공간 생성' })
  ).toBeVisible({ timeout: 5000 });

  // 모달 안에 대학명 입력 필드 확인
  await expect(
    page.locator('.ant-modal').getByPlaceholder('예: 서울대학교')
  ).toBeVisible({ timeout: 5000 });

  // 취소 버튼으로 닫기 (DB 오염 없이)
  await page.locator('.ant-modal').getByRole('button', { name: '취소' }).click();
  await expect(page.locator('.ant-modal')).not.toBeVisible({ timeout: 5000 });
});
