import type { EvaluationType, EvalConfig } from './evaluation.js';

// --- DataShape (04-pipeline-engine.md §4.1) ---

export const DATA_SHAPES = [
  'MATRIX',
  'GRADE_MATRIX',
  'ARRAY',
  'SCALAR',
  'QUESTION_ANSWERS',
  'QUESTION_SCORES',
  'SUBJECT_SCORES',
  'QUESTION_ITEM_SCORES',
  'MAPPING_INPUT',
] as const;

export type DataShape = (typeof DATA_SHAPES)[number];

// --- 소수점 ---

export interface DecimalConfig {
  method: 'round' | 'floor' | 'ceil';
  places: 0 | 1 | 2 | 3 | 4;
}

// --- 블록 정의 (04-pipeline-engine.md §4.2) ---

export const BLOCK_CATEGORIES = [
  'preprocess',
  'path1',
  'path2',
  'aggregate',
  'postprocess',
  'grading',
  'mapping',
] as const;

export type BlockCategory = (typeof BLOCK_CATEGORIES)[number];

export interface ParamDefinition {
  key: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  required: boolean;
  defaultValue?: unknown;
  options?: { label: string; value: string | number }[];
}

export interface BlockDefinition {
  type: string;
  name: string;
  category: BlockCategory;
  applicableTypes: EvaluationType[];
  inputShape: DataShape;
  outputShape: DataShape;
  params: ParamDefinition[];
}

export interface PipelineBlock {
  type: string;
  params: Record<string, unknown>;
  decimal: DecimalConfig | null;
}

// --- 실행 컨텍스트 ---

export interface FailFlag {
  type: 'item' | 'total';
  name: string;
  value: number;
  threshold: number;
}

export interface IntermediateResult {
  blockIndex: number;
  blockType: string;
  label: string;
  output: unknown;
}

export interface BlockInput {
  data: unknown;
  context: ExecutionContext;
}

export interface BlockOutput {
  data: unknown;
  failFlags?: FailFlag[];
}

export interface ExecutionContext {
  evaluationType: EvaluationType;
  config: EvalConfig;
  defaultDecimal: DecimalConfig;
  mappingTable?: unknown;
}

// --- 파이프라인 설정 (02-db-schema.md §2.4) ---

export interface PipelineCondition {
  committeeCount: number;
  blocks: PipelineBlock[];
}

export interface TypeAPipelineConfig {
  conditions: PipelineCondition[];
}

export interface StandardPipelineConfig {
  blocks: PipelineBlock[];
}

export type PipelineConfig = TypeAPipelineConfig | StandardPipelineConfig;
