import type { DecimalConfig, PipelineConfig } from './pipeline.js';

export const EVALUATION_TYPES = ['A', 'B', 'C', 'D'] as const;
export type EvaluationType = (typeof EVALUATION_TYPES)[number];

export const EVALUATION_STATUSES = ['draft', 'configured', 'calculated'] as const;
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];

// --- A유형: 위원 평가 (02-db-schema.md §2.3) ---

export interface SubItemDefinition {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  failThreshold: number | null;
  gradeMapping?: Record<string, number>;
}

export interface ItemDefinition {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  failThreshold: number | null;
  subItems?: SubItemDefinition[];
  gradeMapping?: Record<string, number>;
}

export interface TypeAConfig {
  type: 'A';
  maxCommitteeCount: number;
  dataType: 'score' | 'grade';
  items: ItemDefinition[];
}

// --- B유형: 자동 채점 (02-db-schema.md §2.3) ---

export interface AnswerKeyEntry {
  questionNo: number;
  answers: string[];
  score: number;
}

export interface ScoreRange {
  start: number;
  end: number;
  score: number;
}

export interface ExamType {
  id: string;
  name: string;
  questionCount: number;
  answerKey?: AnswerKeyEntry[];
  scoreRanges?: ScoreRange[];
}

export interface QuestionError {
  questionNo: number;
  handling: 'all_correct' | 'exclude';
}

export interface SubjectDef {
  id: string;
  name: string;
  questionCount: number;
  maxScore: number;
  failThreshold: number | null;
  examTypes: ExamType[];
  questionErrors: QuestionError[];
}

export interface TypeBConfig {
  type: 'B';
  subjects: SubjectDef[];
  totalFailThreshold: number | null;
}

// --- C유형: 문항별 채점 (02-db-schema.md §2.3) ---

export interface SubQuestionDef {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  failThreshold: number | null;
}

export interface QuestionDef {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  failThreshold: number | null;
  subQuestions?: SubQuestionDef[];
}

export interface TypeCConfig {
  type: 'C';
  committeeCount: number;
  questions: QuestionDef[];
  totalFailThreshold: number | null;
  parentScoreMethod?: 'sum' | 'weighted_sum';
  totalCalcMethod?: 'sum' | 'weighted_sum';
}

// --- D유형: 점수 변환표 (02-db-schema.md §2.3) ---

export interface ColumnDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'range';
}

export interface TypeDConfig {
  type: 'D';
  mappingType: 'certificate' | 'language_test' | 'transfer_gpa' | 'achievement' | 'custom';
  inputColumns: ColumnDef[];
  maxScore: number;
  totalFailThreshold: number | null;
}

// --- 유니온 ---

export type EvalConfig = TypeAConfig | TypeBConfig | TypeCConfig | TypeDConfig;

export interface Evaluation {
  id: string;
  tenantId: string;
  name: string;
  type: EvaluationType;
  academicYear?: string;
  admissionType?: string;
  config: EvalConfig;
  pipelineConfig: PipelineConfig | null;
  defaultDecimal?: DecimalConfig;
  convertedMax?: number;
  status: EvaluationStatus;
  needsRecalculation: boolean;
  copiedFromId?: string;
  createdAt: string;
  updatedAt: string;
}
