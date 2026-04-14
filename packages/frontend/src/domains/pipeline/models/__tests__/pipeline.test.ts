import { describe, it, expect } from 'vitest';
import { getCategoryLabel, getCategoryColor, createEmptyBlock } from '../pipeline';

describe('pipeline models', () => {
  it('getCategoryLabel — 카테고리 라벨', () => {
    expect(getCategoryLabel('preprocess')).toBe('전처리');
    expect(getCategoryLabel('path1')).toBe('위원 총점');
    expect(getCategoryLabel('path2')).toBe('항목별 계산');
    expect(getCategoryLabel('aggregate')).toBe('집계');
    expect(getCategoryLabel('postprocess')).toBe('후처리');
    expect(getCategoryLabel('grading')).toBe('채점');
    expect(getCategoryLabel('mapping')).toBe('매핑');
  });

  it('getCategoryColor', () => {
    expect(getCategoryColor('preprocess')).toBe('blue');
    expect(getCategoryColor('postprocess')).toBe('green');
  });

  it('createEmptyBlock', () => {
    const block = createEmptyBlock('normalize_to_max');
    expect(block.type).toBe('normalize_to_max');
    expect(block.params).toEqual({});
    expect(block.decimal).toBeNull();
  });
});
