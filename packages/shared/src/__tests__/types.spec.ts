import {
  ROLES, EVALUATION_TYPES, EVALUATION_STATUSES, DATA_SHAPES, BLOCK_CATEGORIES, AUDIT_ACTIONS,
  PLATFORM_ADMIN, TENANT_ADMIN,
} from '../index';
import * as blockTypes from '../constants/block-types';

describe('타입 상수 내보내기', () => {
  it('ROLES', () => {
    expect(ROLES).toEqual(['platform_admin', 'tenant_admin']);
  });

  it('EVALUATION_TYPES', () => {
    expect(EVALUATION_TYPES).toEqual(['A', 'B', 'C', 'D']);
  });

  it('EVALUATION_STATUSES', () => {
    expect(EVALUATION_STATUSES).toEqual(['draft', 'configured', 'calculated']);
  });

  it('DATA_SHAPES는 9개', () => {
    expect(DATA_SHAPES).toHaveLength(9);
    expect(DATA_SHAPES).toContain('MATRIX');
    expect(DATA_SHAPES).toContain('SCALAR');
    expect(DATA_SHAPES).toContain('MAPPING_INPUT');
  });

  it('BLOCK_CATEGORIES는 7개', () => {
    expect(BLOCK_CATEGORIES).toHaveLength(7);
  });

  it('AUDIT_ACTIONS는 8개', () => {
    expect(AUDIT_ACTIONS).toHaveLength(8);
    expect(AUDIT_ACTIONS).toContain('data_view');
    expect(AUDIT_ACTIONS).toContain('grade_verify');
  });

  it('PLATFORM_ADMIN / TENANT_ADMIN', () => {
    expect(PLATFORM_ADMIN).toBe('platform_admin');
    expect(TENANT_ADMIN).toBe('tenant_admin');
  });
});

describe('블록 타입 상수', () => {
  it('A유형 블록 18개 존재', () => {
    const aBlocks = [
      blockTypes.BLOCK_GRADE_TO_SCORE,
      blockTypes.BLOCK_SUM_BY_COMMITTEE, blockTypes.BLOCK_WEIGHTED_SUM_BY_COMMITTEE,
      blockTypes.BLOCK_ADD_VIRTUAL_COMMITTEE, blockTypes.BLOCK_EXCLUDE_MAX_COMMITTEE,
      blockTypes.BLOCK_EXCLUDE_MIN_COMMITTEE, blockTypes.BLOCK_COMMITTEE_AVERAGE,
      blockTypes.BLOCK_COMMITTEE_SUM, blockTypes.BLOCK_ADD_VIRTUAL_PER_ITEM,
      blockTypes.BLOCK_EXCLUDE_MAX_PER_ITEM, blockTypes.BLOCK_EXCLUDE_MIN_PER_ITEM,
      blockTypes.BLOCK_AVERAGE_PER_ITEM, blockTypes.BLOCK_SUM_PER_ITEM,
      blockTypes.BLOCK_APPLY_WEIGHT, blockTypes.BLOCK_SUB_TO_PARENT_SUM,
      blockTypes.BLOCK_SUB_TO_PARENT_WEIGHTED, blockTypes.BLOCK_ITEM_SUM, blockTypes.BLOCK_ITEM_AVERAGE,
    ];
    expect(aBlocks).toHaveLength(18);
    aBlocks.forEach((b) => expect(typeof b).toBe('string'));
  });

  it('B유형 블록 5개', () => {
    const bBlocks = [
      blockTypes.BLOCK_AUTO_GRADE, blockTypes.BLOCK_SUM_BY_SUBJECT,
      blockTypes.BLOCK_SUBJECT_FAIL_CHECK, blockTypes.BLOCK_SUBJECT_SUM, blockTypes.BLOCK_SUBJECT_WEIGHTED_SUM,
    ];
    expect(bBlocks).toHaveLength(5);
  });

  it('C유형 블록 7개', () => {
    const cBlocks = [
      blockTypes.BLOCK_SUB_QUESTION_SUM, blockTypes.BLOCK_SUB_QUESTION_WEIGHTED_SUM,
      blockTypes.BLOCK_QUESTION_WEIGHT, blockTypes.BLOCK_QUESTION_SUM, blockTypes.BLOCK_QUESTION_WEIGHTED_SUM,
      blockTypes.BLOCK_SUB_QUESTION_FAIL_CHECK, blockTypes.BLOCK_QUESTION_FAIL_CHECK,
    ];
    expect(cBlocks).toHaveLength(7);
  });

  it('공통 후처리 4개 + 사용자 정의 5개', () => {
    const common = [blockTypes.BLOCK_ITEM_FAIL_CHECK, blockTypes.BLOCK_TOTAL_FAIL_CHECK, blockTypes.BLOCK_NORMALIZE_TO_MAX, blockTypes.BLOCK_APPLY_CONVERTED_MAX];
    const custom = [blockTypes.BLOCK_CUSTOM_BONUS, blockTypes.BLOCK_CUSTOM_RATIO, blockTypes.BLOCK_CUSTOM_RANGE_MAP, blockTypes.BLOCK_CUSTOM_CLAMP, blockTypes.BLOCK_CUSTOM_FORMULA];
    expect(common).toHaveLength(4);
    expect(custom).toHaveLength(5);
  });
});
