import type { EvalConfig, TypeAConfig } from '../types/evaluation.js';
import type { BlockDefinition, PipelineBlock } from '../types/pipeline.js';
import { BLOCK_NORMALIZE_TO_MAX, BLOCK_GRADE_TO_SCORE } from '../constants/block-types.js';

export interface ValidationError {
  blockIndex: number;
  blockType: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * 파이프라인 유효성 검증 (프론트/백 공유)
 * 04-pipeline-engine.md §4.11 기준
 *
 * 검증 규칙:
 * 1. 블록이 해당 평가 유형에 적용 가능한지
 * 2. 연속된 블록의 outputShape → inputShape 호환성
 * 3. 위원 총점 방식(path1)과 항목별 계산 방식(path2) 혼용 불가
 * 4. 필수 블록 누락 (normalize_to_max)
 * 5. 등급 데이터인데 grade_to_score 누락
 * 6. 최종 출력이 SCALAR인지
 */
export function validatePipeline(
  blocks: PipelineBlock[],
  evalType: 'A' | 'B' | 'C' | 'D',
  config: EvalConfig,
  definitions: BlockDefinition[],
): ValidationResult {
  const errors: ValidationError[] = [];
  const defMap = new Map(definitions.map((d) => [d.type, d]));

  if (blocks.length === 0) {
    return { valid: false, errors: [{ blockIndex: -1, blockType: '', message: '블록이 없습니다' }] };
  }

  let hasPath1 = false;
  let hasPath2 = false;
  let hasNormalize = false;
  let hasGradeToScore = false;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const def = defMap.get(block.type);

    if (!def) {
      errors.push({ blockIndex: i, blockType: block.type, message: `알 수 없는 블록: ${block.type}` });
      continue;
    }

    // 규칙 1: 적용 가능한 유형 확인
    if (!def.applicableTypes.includes(evalType)) {
      errors.push({
        blockIndex: i,
        blockType: block.type,
        message: `${def.name}은(는) ${evalType}유형에 사용할 수 없습니다`,
      });
    }

    // 규칙 2: 입출력 호환성
    if (i > 0) {
      const prevDef = defMap.get(blocks[i - 1].type);
      if (prevDef && prevDef.outputShape !== def.inputShape) {
        errors.push({
          blockIndex: i,
          blockType: block.type,
          message: `입력 불일치: ${prevDef.name}의 출력(${prevDef.outputShape})과 ${def.name}의 입력(${def.inputShape})이 호환되지 않습니다`,
        });
      }
    }

    // 규칙 3: path1/path2 혼용 검사
    if (def.category === 'path1') hasPath1 = true;
    if (def.category === 'path2') hasPath2 = true;

    // 규칙 4, 5 추적
    if (block.type === BLOCK_NORMALIZE_TO_MAX) hasNormalize = true;
    if (block.type === BLOCK_GRADE_TO_SCORE) hasGradeToScore = true;
  }

  // 규칙 3 결과
  if (hasPath1 && hasPath2) {
    errors.push({
      blockIndex: -1,
      blockType: '',
      message: '위원 총점 방식과 항목별 계산 방식을 동시에 사용할 수 없습니다',
    });
  }

  // 규칙 4: 필수 블록 누락 (normalize_to_max) — D유형(점수변환표)은 정규화 불필요
  if (!hasNormalize && evalType !== 'D') {
    errors.push({
      blockIndex: -1,
      blockType: BLOCK_NORMALIZE_TO_MAX,
      message: '만점 기준 환산(normalize_to_max) 블록이 필요합니다',
    });
  }

  // 규칙 5: 등급 데이터인데 grade_to_score 누락
  if (evalType === 'A' && config.type === 'A' && (config as TypeAConfig).dataType === 'grade' && !hasGradeToScore) {
    errors.push({
      blockIndex: -1,
      blockType: BLOCK_GRADE_TO_SCORE,
      message: '등급 입력 방식에서는 등급→점수 변환(grade_to_score) 블록이 필요합니다',
    });
  }

  // 규칙 6: 최종 출력 SCALAR 확인
  const lastBlock = blocks[blocks.length - 1];
  const lastDef = defMap.get(lastBlock.type);
  if (lastDef && lastDef.outputShape !== 'SCALAR') {
    errors.push({
      blockIndex: blocks.length - 1,
      blockType: lastBlock.type,
      message: `최종 블록의 출력이 SCALAR여야 합니다 (현재: ${lastDef.outputShape})`,
    });
  }

  return { valid: errors.length === 0, errors };
}
