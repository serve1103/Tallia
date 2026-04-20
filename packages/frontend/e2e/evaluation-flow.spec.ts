import { test, expect } from '@playwright/test';

// storageState로 이미 인증됨 (authenticated 프로젝트)
// 각 테스트는 독립적으로 새 평가를 생성함

test.describe('평가 유형별 흐름', () => {
  test('유형 A: 위원 점수 집계 — 설정 → 파이프라인 → 미리보기', async ({ page }) => {
    const evalName = `A유형 E2E ${Date.now()}`;

    // 1. 평가 생성 페이지 이동
    await page.goto('/evaluations/create', { timeout: 10000 });
    await expect(page.getByText('평가 유형 선택')).toBeVisible({ timeout: 10000 });

    // 2. 유형 카드 클릭
    await page.getByText('A. 위원 점수 집계', { exact: true }).click();

    // 3. 평가명 입력 후 다음 버튼
    await page.getByPlaceholder('예: 2026학년도 수시 면접평가').fill(evalName);
    await page.getByRole('button', { name: '다음: 세부 설정' }).click();

    // 4. Config 페이지 진입 확인
    await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });

    // 5. 유형 A 최소 설정: 항목 추가 후 항목명 입력
    await page.getByRole('button', { name: '항목 추가' }).click();
    await page.getByPlaceholder('항목명').first().fill('면접');

    // 6. 설정 저장
    await page.getByRole('button', { name: '설정 저장' }).click();
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });

    // 7. 계산 과정 탭 이동
    await page.getByRole('tab', { name: '계산 과정' }).click();
    await expect(page).toHaveURL(/\/pipeline/, { timeout: 10000 });

    // 8. 파이프라인 영역 확인 (빈 상태 안내 또는 블록 팔레트)
    await expect(
      page.locator('.ant-card').first()
    ).toBeVisible({ timeout: 10000 });

    // 9. 샘플 미리보기 버튼 클릭
    await page.getByRole('button', { name: '샘플 미리보기 실행' }).click();

    // 미리보기 카드 제목 확인
    await expect(
      page.locator('.ant-card-head-title').filter({ hasText: '샘플 미리보기' })
    ).toBeVisible({ timeout: 10000 });
  });

  test('유형 B: 자동 채점 — 설정 → 파이프라인 → 미리보기', async ({ page }) => {
    const evalName = `B유형 E2E ${Date.now()}`;

    await page.goto('/evaluations/create', { timeout: 10000 });
    await expect(page.getByText('평가 유형 선택')).toBeVisible({ timeout: 10000 });

    await page.getByText('B. 자동 채점', { exact: true }).click();
    await page.getByPlaceholder('예: 2026학년도 수시 면접평가').fill(evalName);
    await page.getByRole('button', { name: '다음: 세부 설정' }).click();
    await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });

    // 유형 B 최소 설정: 과목 추가 후 과목명 + 문항수 + 만점
    await page.getByRole('button', { name: '과목 추가' }).click();
    await page.getByPlaceholder('과목명').first().fill('국어');
    // InputNumber 필드는 placeholder 없음 — 문항 수와 만점은 이미 기본값(0, 100)이 있어 생략 가능
    // 과목명만 채워도 설정 저장 가능

    await page.getByRole('button', { name: '설정 저장' }).click();
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });

    await page.getByRole('tab', { name: '계산 과정' }).click();
    await expect(page).toHaveURL(/\/pipeline/, { timeout: 10000 });

    await expect(
      page.locator('.ant-card').first()
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: '샘플 미리보기 실행' }).click();

    await expect(
      page.locator('.ant-card-head-title').filter({ hasText: '샘플 미리보기' })
    ).toBeVisible({ timeout: 10000 });
  });

  test('유형 C: 문항 점수 계산 — 설정 → 파이프라인 → 미리보기', async ({ page }) => {
    const evalName = `C유형 E2E ${Date.now()}`;

    await page.goto('/evaluations/create', { timeout: 10000 });
    await expect(page.getByText('평가 유형 선택')).toBeVisible({ timeout: 10000 });

    await page.getByText('C. 문항 점수 계산', { exact: true }).click();
    await page.getByPlaceholder('예: 2026학년도 수시 면접평가').fill(evalName);
    await page.getByRole('button', { name: '다음: 세부 설정' }).click();
    await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });

    // 유형 C 최소 설정: 문항 추가 후 문항명 입력
    await page.getByRole('button', { name: '문항 추가' }).click();
    await page.getByPlaceholder('문항명').first().fill('1번 문항');

    await page.getByRole('button', { name: '설정 저장' }).click();
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });

    await page.getByRole('tab', { name: '계산 과정' }).click();
    await expect(page).toHaveURL(/\/pipeline/, { timeout: 10000 });

    await expect(
      page.locator('.ant-card').first()
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: '샘플 미리보기 실행' }).click();

    await expect(
      page.locator('.ant-card-head-title').filter({ hasText: '샘플 미리보기' })
    ).toBeVisible({ timeout: 10000 });
  });

  test('유형 D: 점수 변환표 — 설정 → 파이프라인 → 미리보기', async ({ page }) => {
    const evalName = `D유형 E2E ${Date.now()}`;

    await page.goto('/evaluations/create', { timeout: 10000 });
    await expect(page.getByText('평가 유형 선택')).toBeVisible({ timeout: 10000 });

    await page.getByText('D. 점수 변환표', { exact: true }).click();
    await page.getByPlaceholder('예: 2026학년도 수시 면접평가').fill(evalName);
    await page.getByRole('button', { name: '다음: 세부 설정' }).click();
    await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });

    // 유형 D 최소 설정: 컬럼 추가 후 키 + 라벨 입력
    await page.getByRole('button', { name: '컬럼 추가' }).click();
    await page.getByPlaceholder('score').first().fill('total');
    await page.getByPlaceholder('점수').first().fill('총점');

    await page.getByRole('button', { name: '설정 저장' }).click();
    await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });

    await page.getByRole('tab', { name: '계산 과정' }).click();
    await expect(page).toHaveURL(/\/pipeline/, { timeout: 10000 });

    await expect(
      page.locator('.ant-card').first()
    ).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: '샘플 미리보기 실행' }).click();

    await expect(
      page.locator('.ant-card-head-title').filter({ hasText: '샘플 미리보기' })
    ).toBeVisible({ timeout: 10000 });
  });
});
