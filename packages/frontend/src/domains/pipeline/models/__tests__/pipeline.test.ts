import { describe, it, expect } from 'vitest';
import { getCategoryLabel, getCategoryColor, createEmptyBlock } from '../pipeline';

describe('pipeline models', () => {
  it('getCategoryLabel — 3그룹(전처리/중간 과정/후처리) 라벨 매핑', () => {
    // 전처리 그룹: preprocess, grading, mapping
    expect(getCategoryLabel('preprocess')).toBe('전처리');
    expect(getCategoryLabel('grading')).toBe('전처리');
    expect(getCategoryLabel('mapping')).toBe('전처리');
    // 중간 과정 그룹: path1, path2, aggregate
    expect(getCategoryLabel('path1')).toBe('중간 과정');
    expect(getCategoryLabel('path2')).toBe('중간 과정');
    expect(getCategoryLabel('aggregate')).toBe('중간 과정');
    // 후처리 그룹
    expect(getCategoryLabel('postprocess')).toBe('후처리');
  });

  it('getCategoryLabel — 과락 판정 블록은 type 기반으로 중간 과정에 매핑', () => {
    expect(getCategoryLabel('postprocess', 'total_fail_check')).toBe('중간 과정');
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
