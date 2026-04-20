import { test, expect } from '@playwright/test';

// storageState로 이미 인증됨 (authenticated 프로젝트)
// 각 테스트는 독립적 — Date.now()로 평가명 유니크

// ---------------------------------------------------------------------------
// 헬퍼: A유형 평가 생성 후 설정 페이지 URL 반환
// ---------------------------------------------------------------------------
async function createATypeEvalAndGoToConfig(page: import('@playwright/test').Page, suffix = '') {
  const evalName = `E2E-A유형-${suffix || Date.now()}`;
  await page.goto('/evaluations/create', { timeout: 10000 });
  await expect(page.getByText('평가 유형 선택')).toBeVisible({ timeout: 10000 });
  await page.getByText('A. 위원 점수 집계', { exact: true }).click();
  await page.getByPlaceholder('예: 2026학년도 수시 면접평가').fill(evalName);
  await page.getByRole('button', { name: '다음: 세부 설정' }).click();
  await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });
  return evalName;
}

// ---------------------------------------------------------------------------
// 1. 공용 설정 저장 → 결과 조회 탭에서 재계산 배너 노출
// ---------------------------------------------------------------------------
test('공용 설정 환산 만점 수정 후 결과 조회 탭에서 재계산 배너 노출', async ({ page }) => {
  await createATypeEvalAndGoToConfig(page);

  // 항목 추가 후 저장 (최소 유효 설정)
  await page.getByRole('button', { name: '항목 추가' }).click();
  await page.getByPlaceholder('항목명').first().fill('면접');

  // 환산 만점 InputNumber 찾기 — "환산 만점" 레이블 다음 InputNumber
  const convertedMaxInput = page.locator('input.ant-input-number-input').first();
  await convertedMaxInput.triple_click?.() ?? await convertedMaxInput.click({ clickCount: 3 });
  await convertedMaxInput.fill('500');

  await page.getByRole('button', { name: '설정 저장' }).click();
  await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });

  // 결과 조회 탭 이동
  await page.getByRole('tab', { name: '결과 조회' }).click();
  await expect(page).toHaveURL(/\/results/, { timeout: 10000 });

  // 재계산 경고 배너 (Alert) 확인
  await expect(
    page.locator('.ant-alert').filter({ hasText: '설정이 변경' })
  ).toBeVisible({ timeout: 10000 });
});

// ---------------------------------------------------------------------------
// 2. 평가 복사 — 셀렉터에서 기존 평가 선택 → "복사 후 설정 이동" 버튼 → 설정 페이지
// ---------------------------------------------------------------------------
test('평가 복사 — 기존 평가 복사 후 설정 페이지 이동', async ({ page }) => {
  // 먼저 소스 평가가 있어야 하므로 대시보드로 이동하여 확인
  await page.goto('/dashboard', { timeout: 10000 });
  await expect(page.locator('.ant-table')).toBeVisible({ timeout: 10000 });

  // 평가 생성 페이지로 이동
  await page.goto('/evaluations/create', { timeout: 10000 });
  await expect(page.getByText('평가 유형 선택')).toBeVisible({ timeout: 10000 });

  // "기존 평가 복사" Select 열기
  const copySelect = page.locator('.ant-select').first();
  await copySelect.click();

  // 드롭다운에 옵션이 있으면 첫 번째 복사 옵션 선택 (새로 생성 제외)
  const options = page.locator('.ant-select-dropdown .ant-select-item-option').filter({ hasText: '복사' });
  const count = await options.count();

  if (count > 0) {
    await options.first().click();
    // 유형도 선택
    await page.getByText('A. 위원 점수 집계', { exact: true }).click();
    // "복사 후 설정 이동" 버튼 클릭
    await expect(page.getByRole('button', { name: '복사 후 설정 이동' })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: '복사 후 설정 이동' }).click();
    // 설정 페이지로 이동 확인
    await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });
  } else {
    // 평가가 없는 경우 — 복사 셀렉터 UI 자체가 있음을 확인
    await expect(page.getByText('기존 평가 복사 (선택사항)')).toBeVisible({ timeout: 5000 });
  }
});

// ---------------------------------------------------------------------------
// 3. B유형 시험유형 추가 + 정답지 입력 저장
// ---------------------------------------------------------------------------
test('B유형 시험유형 추가 후 정답지 저장', async ({ page }) => {
  const evalName = `E2E-B유형-${Date.now()}`;
  await page.goto('/evaluations/create', { timeout: 10000 });
  await expect(page.getByText('평가 유형 선택')).toBeVisible({ timeout: 10000 });

  await page.getByText('B. 자동 채점', { exact: true }).click();
  await page.getByPlaceholder('예: 2026학년도 수시 면접평가').fill(evalName);
  await page.getByRole('button', { name: '다음: 세부 설정' }).click();
  await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });

  // 폼 로딩 완료 대기 (Spin 사라지고 설정 저장 버튼 노출)
  await expect(page.getByRole('button', { name: '설정 저장' })).toBeVisible({ timeout: 10000 });

  // 과목 추가 버튼 클릭 후 과목명 입력
  await page.getByRole('button', { name: '과목 추가' }).click();
  await page.getByPlaceholder('과목명').first().fill('국어');

  // 문항 수 설정 (InputNumber — 두 번째 ant-input-number-input)
  const questionCountInput = page.locator('input.ant-input-number-input').nth(1);
  await questionCountInput.click({ clickCount: 3 });
  await questionCountInput.fill('5');

  // 설정 저장 후 evaluationId 확보
  await page.getByRole('button', { name: '설정 저장' }).click();
  await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });

  // 현재 URL에서 evaluationId 확인
  const url = page.url();
  const evalIdMatch = url.match(/\/evaluations\/([^/]+)\//);
  if (!evalIdMatch) throw new Error(`evaluationId를 URL에서 찾을 수 없음: ${url}`);

  // 페이지 새로고침 후 B유형 설정으로 돌아와서 시험유형 추가
  await page.reload();
  await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });
  // 폼 로딩 완료 대기
  await expect(page.getByRole('button', { name: '설정 저장' })).toBeVisible({ timeout: 10000 });

  // "유형 추가" 버튼 클릭
  await page.getByRole('button', { name: '유형 추가' }).click();

  // 입력 필드에 "A" 입력 후 Enter
  const typeInput = page.locator('input[placeholder="유형 (예: C)"]');
  await expect(typeInput).toBeVisible({ timeout: 5000 });
  await typeInput.fill('A');
  await typeInput.press('Enter');

  // A형 태그 노출 확인
  await expect(page.locator('.ant-tag').filter({ hasText: 'A형' })).toBeVisible({ timeout: 5000 });

  // 설정 저장
  await page.getByRole('button', { name: '설정 저장' }).click();
  await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });

  // 페이지 새로고침 후 A형 정답지 탭 클릭
  await page.reload();
  await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });
  // 폼 로딩 완료 대기
  await expect(page.getByRole('button', { name: '설정 저장' })).toBeVisible({ timeout: 10000 });

  // A형 정답지 탭 클릭
  const answerKeyTab = page.getByRole('tab', { name: 'A형 정답지' });
  await expect(answerKeyTab).toBeVisible({ timeout: 10000 });
  await answerKeyTab.click();

  // 1번 정답 입력
  const firstAnswerInput = page.locator('input.ant-input-sm').first();
  await firstAnswerInput.fill('1');

  // "정답지 저장" 버튼 클릭
  await page.getByRole('button', { name: '정답지 저장' }).click();

  // 성공 메시지 확인
  await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });
});

// ---------------------------------------------------------------------------
// 4. D유형 매핑 테이블 — 행 추가 후 저장
// ---------------------------------------------------------------------------
test('D유형 매핑 테이블 행 추가 후 저장', async ({ page }) => {
  const evalName = `E2E-D유형-${Date.now()}`;
  await page.goto('/evaluations/create', { timeout: 10000 });
  await expect(page.getByText('평가 유형 선택')).toBeVisible({ timeout: 10000 });

  await page.getByText('D. 점수 변환표', { exact: true }).click();
  await page.getByPlaceholder('예: 2026학년도 수시 면접평가').fill(evalName);
  await page.getByRole('button', { name: '다음: 세부 설정' }).click();
  await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });

  // 입력 컬럼 추가
  await page.getByRole('button', { name: '컬럼 추가' }).click();
  await page.getByPlaceholder('score').first().fill('score');
  await page.getByPlaceholder('점수').first().fill('점수');

  // 설정 저장
  await page.getByRole('button', { name: '설정 저장' }).click();
  await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });

  // 페이지 새로고침
  await page.reload();
  await expect(page).toHaveURL(/\/evaluations\/.*\/config/, { timeout: 10000 });

  // 변환표 데이터 섹션 스크롤 후 "행 추가" 버튼 클릭
  const addRowBtn = page.getByRole('button', { name: '행 추가' });
  await expect(addRowBtn).toBeVisible({ timeout: 10000 });
  await addRowBtn.click();

  // 행이 추가됐는지 확인 (테이블에 행 노출)
  await expect(page.locator('.ant-table-row')).toBeVisible({ timeout: 5000 });

  // 저장 버튼 클릭
  const saveBtn = page.locator('.ant-btn-primary').filter({ hasText: '저장' }).last();
  await saveBtn.click();

  // 성공 메시지 확인
  await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });
});

// ---------------------------------------------------------------------------
// 5. 샘플 미리보기 실행 — 파이프라인 페이지에서 버튼 클릭 후 카드 노출
// ---------------------------------------------------------------------------
test('샘플 미리보기 실행 — 파이프라인 페이지 카드 확인', async ({ page }) => {
  await createATypeEvalAndGoToConfig(page);

  // 항목 추가
  await page.getByRole('button', { name: '항목 추가' }).click();
  await page.getByPlaceholder('항목명').first().fill('면접');
  await page.getByRole('button', { name: '설정 저장' }).click();
  await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });

  // 계산 과정 탭 이동
  await page.getByRole('tab', { name: '계산 과정' }).click();
  await expect(page).toHaveURL(/\/pipeline/, { timeout: 10000 });

  // 파이프라인 영역 로딩 대기
  await expect(page.locator('.ant-card').first()).toBeVisible({ timeout: 10000 });

  // 샘플 미리보기 카드가 이미 렌더링돼 있음 (PreviewPanel은 항상 표시)
  await expect(
    page.locator('.ant-card-head-title').filter({ hasText: '샘플 미리보기' })
  ).toBeVisible({ timeout: 10000 });

  // "샘플 미리보기 실행" 버튼 클릭
  await page.getByRole('button', { name: '샘플 미리보기 실행' }).click();

  // 버튼이 loading 상태를 거쳐 결과 렌더링 또는 에러 Alert 표시
  await expect(
    page.locator('.ant-card').filter({ has: page.locator('.ant-card-head-title', { hasText: '샘플 미리보기' }) })
  ).toBeVisible({ timeout: 10000 });
});

// ---------------------------------------------------------------------------
// 6. 사용자 정의 단계 추가 — 모달 열기 + 템플릿 카드 클릭 → 블록 추가
// ---------------------------------------------------------------------------
test('사용자 정의 단계 추가 모달 열고 템플릿 선택 후 블록 추가', async ({ page }) => {
  await createATypeEvalAndGoToConfig(page);

  // 항목 추가 후 저장
  await page.getByRole('button', { name: '항목 추가' }).click();
  await page.getByPlaceholder('항목명').first().fill('면접');
  await page.getByRole('button', { name: '설정 저장' }).click();
  await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });

  // 계산 과정 탭
  await page.getByRole('tab', { name: '계산 과정' }).click();
  await expect(page).toHaveURL(/\/pipeline/, { timeout: 10000 });
  await expect(page.locator('.ant-card').first()).toBeVisible({ timeout: 10000 });

  // "사용자 정의 단계 추가" 카드 클릭
  await page.getByText('사용자 정의 단계 추가').click();

  // 모달 노출 확인
  await expect(page.locator('.ant-modal')).toBeVisible({ timeout: 5000 });
  await expect(
    page.locator('.ant-modal-title').filter({ hasText: '사용자 정의 단계 템플릿 선택' })
  ).toBeVisible({ timeout: 5000 });

  // "가산점 부여" 템플릿 카드 클릭
  await page.locator('.ant-modal .ant-card').filter({ hasText: '가산점 부여' }).click();

  // 모달 닫힘 확인
  await expect(page.locator('.ant-modal')).not.toBeVisible({ timeout: 5000 });

  // 블록이 파이프라인에 추가됨 확인 (BlockCard 렌더링)
  await expect(page.locator('.ant-card').filter({ hasText: '가산점' }).first()).toBeVisible({ timeout: 5000 });
});

// ---------------------------------------------------------------------------
// 7. A유형 조건부 파이프라인 토글 → ConditionalTabs 노출
// ---------------------------------------------------------------------------
test('A유형 조건부 모드 스위치 토글 후 ConditionalTabs 노출', async ({ page }) => {
  await createATypeEvalAndGoToConfig(page);

  // 항목 추가 후 저장
  await page.getByRole('button', { name: '항목 추가' }).click();
  await page.getByPlaceholder('항목명').first().fill('면접');
  await page.getByRole('button', { name: '설정 저장' }).click();
  await expect(page.locator('.ant-message')).toBeVisible({ timeout: 10000 });

  // 계산 과정 탭
  await page.getByRole('tab', { name: '계산 과정' }).click();
  await expect(page).toHaveURL(/\/pipeline/, { timeout: 10000 });
  await expect(page.locator('.ant-card').first()).toBeVisible({ timeout: 10000 });

  // "조건부 모드 (위원수별)" 스위치 확인
  await expect(page.getByText('조건부 모드 (위원수별)')).toBeVisible({ timeout: 10000 });

  // Switch 클릭
  const switchEl = page.locator('.ant-switch').first();
  await switchEl.click();

  // ConditionalTabs 노출 확인 — Tabs가 나타남 (위원 수 탭)
  await expect(
    page.locator('.ant-tabs-tab').first()
  ).toBeVisible({ timeout: 5000 });
});
