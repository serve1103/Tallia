# 4. 파이프라인 엔진

### 4.1 데이터 형태 (DataShape)

파이프라인을 흐르는 데이터는 다음 형태 중 하나:

| DataShape | 구조 | 설명 |
|-----------|------|------|
| `MATRIX` | `{ items: string[], data: number[][] }` | [항목 × 위원] 2차원 배열. A유형 기본 |
| `GRADE_MATRIX` | `{ items: string[], data: string[][] }` | [항목 × 위원] 등급 문자열. A유형 등급 입력 |
| `ARRAY` | `{ labels: string[], data: number[] }` | 1차원 라벨 배열 (위원 총점, 항목별 점수 등) |
| `SCALAR` | `{ value: number }` | 단일 점수 |
| `QUESTION_ANSWERS` | `{ answers: { qNo: number, answer: string }[] }` | B유형 답안 |
| `QUESTION_SCORES` | `{ scores: { qNo: number, correct: boolean, score: number }[] }` | B유형 채점 결과 |
| `SUBJECT_SCORES` | `{ subjects: { id: string, name: string, score: number }[] }` | B유형 과목별 점수 |
| `QUESTION_ITEM_SCORES` | `{ items: string[], data: number[] }` | C유형 문항별 점수 |
| `MAPPING_INPUT` | `{ conditions: Record<string, string \| number> }` | D유형 매핑 입력 |

모든 형태는 선택적 `failFlags: { type, name, value, threshold }[]` 를 포함할 수 있다.

### 4.2 블록 인터페이스

```typescript
// packages/shared/src/types/pipeline.ts

interface BlockDefinition {
  type: string;                          // 고유 식별자
  name: string;                          // 한글 표시명
  category: 'preprocess' | 'path1' | 'path2' | 'aggregate' | 'postprocess' | 'grading' | 'mapping';
  applicableTypes: ('A' | 'B' | 'C' | 'D')[];
  inputShape: DataShape;                 // 허용 입력 형태
  outputShape: DataShape;                // 산출 형태
  params: ParamDefinition[];             // 설정 가능 파라미터
}

interface PipelineBlock {
  type: string;                          // BlockDefinition.type 참조
  params: Record<string, unknown>;       // 블록별 파라미터 값
  decimal: DecimalConfig | null;         // 블록별 소수점 설정 (null이면 평가 기본값)
}

interface DecimalConfig {
  method: 'round' | 'floor' | 'ceil';
  places: 0 | 1 | 2 | 3;
}

interface BlockInput {
  data: unknown;                         // DataShape에 따른 데이터
  context: ExecutionContext;              // 평가 설정, 점수 변환표 등 참조
}

interface BlockOutput {
  data: unknown;
  failFlags?: FailFlag[];
}
```

### 4.3 블록 레지스트리

```typescript
// packages/backend/src/pipeline/block-registry.ts

class BlockRegistry {
  private blocks = new Map<string, BlockHandler>();

  register(type: string, handler: BlockHandler): void;
  get(type: string): BlockHandler;
  getByType(evalType: 'A' | 'B' | 'C' | 'D'): BlockDefinition[];
  getDefinition(type: string): BlockDefinition;
}
```

모든 블록은 애플리케이션 시작 시 레지스트리에 자동 등록된다.

### 4.4 파이프라인 실행기

```typescript
class PipelineExecutor {
  execute(
    pipeline: PipelineBlock[],
    initialData: unknown,
    context: ExecutionContext
  ): PipelineResult {
    const intermediateResults: IntermediateResult[] = [];
    let currentData = initialData;
    let failFlags: FailFlag[] = [];

    for (let i = 0; i < pipeline.length; i++) {
      const block = pipeline[i];
      const handler = this.registry.get(block.type);
      const output = handler.execute({ data: currentData, context }, block.params);

      // 소수점 처리: 블록별 설정 > 평가 기본값
      const decimal = block.decimal ?? context.defaultDecimal;
      currentData = this.applyDecimal(output.data, decimal);

      if (output.failFlags) failFlags.push(...output.failFlags);
      intermediateResults.push({
        blockIndex: i,
        blockType: block.type,
        label: handler.definition.name,
        output: currentData
      });
    }

    return { finalData: currentData, intermediateResults, failFlags };
  }
}
```

**위원 수별 조건부 실행 (A유형):**

```typescript
// A유형 계산 시
function executeTypeA(row: RowData, config: PipelineConfig, context: ExecutionContext) {
  const committeeCount = detectCommitteeCount(row);  // 빈칸이 아닌 셀 수로 감지
  const pipeline = config.conditions.find(c => c.committeeCount === committeeCount);

  if (!pipeline) throw new Error(`위원 ${committeeCount}명에 대한 파이프라인이 설정되지 않았습니다`);

  return executor.execute(pipeline.blocks, row.matrix, context);
}
```

### 4.5 A유형 블록 상세

FSD에 정의됨. 여기서는 type 식별자를 확정한다.

**전처리:**

| type | 이름 | 입력 | 출력 |
|------|------|------|------|
| `grade_to_score` | 등급→점수 변환 | GRADE_MATRIX | MATRIX |

**위원 총점 방식:**

| type | 이름 | 입력 | 출력 |
|------|------|------|------|
| `sum_by_committee` | 위원별 항목 합산 | MATRIX | ARRAY (위원 총점) |
| `weighted_sum_by_committee` | 위원별 항목 가중합산 | MATRIX | ARRAY (위원 총점) |
| `add_virtual_committee` | 가상 위원 추가 | ARRAY | ARRAY (+1) |
| `exclude_max_committee` | 최고 위원 제외 | ARRAY | ARRAY (-1) |
| `exclude_min_committee` | 최저 위원 제외 | ARRAY | ARRAY (-1) |
| `committee_average` | 위원 평균 | ARRAY | SCALAR |
| `committee_sum` | 위원 합산 | ARRAY | SCALAR |

**항목별 계산 방식:**

| type | 이름 | 입력 | 출력 |
|------|------|------|------|
| `add_virtual_per_item` | 항목별 가상 위원 추가 | MATRIX | MATRIX (+1열) |
| `exclude_max_per_item` | 항목별 최고점 제외 | MATRIX | MATRIX (-1열) |
| `exclude_min_per_item` | 항목별 최저점 제외 | MATRIX | MATRIX (-1열) |
| `average_per_item` | 항목별 위원 평균 | MATRIX | ARRAY (항목별 점수) |
| `sum_per_item` | 항목별 위원 합산 | MATRIX | ARRAY (항목별 점수) |
| `apply_weight` | 가중치 적용 | ARRAY | ARRAY |
| `sub_to_parent_sum` | 소항목 합산→대항목 | ARRAY | ARRAY (축소) |
| `sub_to_parent_weighted` | 소항목 가중합산→대항목 | ARRAY | ARRAY (축소) |
| `item_sum` | 항목 합산 | ARRAY | SCALAR |
| `item_average` | 항목 평균 | ARRAY | SCALAR |

### 4.6 B유형 블록 상세

| type | 이름 | 입력 | 출력 | 설명 |
|------|------|------|------|------|
| `auto_grade` | 자동 채점 | QUESTION_ANSWERS | QUESTION_SCORES | 정답지 대조, 문항별 배점 적용. 복수정답·전원정답·배점제외 처리 포함 |
| `sum_by_subject` | 과목별 합산 | QUESTION_SCORES | SUBJECT_SCORES | 과목 내 정답 문항 점수 합산 |
| `subject_fail_check` | 과목별 과락 판정 | SUBJECT_SCORES | SUBJECT_SCORES + failFlags | 과목별 과락 기준 체크 |
| `subject_sum` | 과목 합산 | SUBJECT_SCORES | SCALAR | 과목 점수 합산 |
| `subject_weighted_sum` | 과목 가중합산 | SUBJECT_SCORES | SCALAR | 과목별 가중치 적용 후 합산 |

B유형 파이프라인 예시:
```
[auto_grade] → [sum_by_subject] → [subject_fail_check] → [subject_sum]
→ [total_fail_check] → [normalize_to_max] → [apply_converted_max]
```

**auto_grade 상세 동작:**
1. 수험생 답안과 정답지(examType별) 대조
2. questionErrors 확인:
   - `all_correct`: 해당 문항은 모든 수험생 정답 처리
   - `exclude`: 해당 문항 배점을 제외하고, 나머지 문항 기준으로 만점 재산출
3. 복수정답: answers 배열 중 하나라도 일치하면 정답
4. 결과: 문항별 `{ questionNo, correct, score }` 배열
5. 감사 로그: 채점 결과 검증용 로그 자동 기록

### 4.7 C유형 블록 상세

C유형은 A유형의 위원 집계 블록을 재활용하며, 문항 집계용 블록을 추가한다.

**위원 집계 (채점위원이 있을 때) — A유형 항목별 계산 방식 블록 재활용:**

| type | 이름 | 입력 | 출력 |
|------|------|------|------|
| `exclude_max_per_item` | 문항별 최고점 제외 | MATRIX | MATRIX (-1열) |
| `exclude_min_per_item` | 문항별 최저점 제외 | MATRIX | MATRIX (-1열) |
| `average_per_item` | 문항별 위원 평균 | MATRIX | QUESTION_ITEM_SCORES |
| `sum_per_item` | 문항별 위원 합산 | MATRIX | QUESTION_ITEM_SCORES |

**문항 집계:**

| type | 이름 | 입력 | 출력 | 설명 |
|------|------|------|------|------|
| `sub_question_sum` | 소문항 합산→대문항 | QUESTION_ITEM_SCORES | QUESTION_ITEM_SCORES (축소) | 소문항 합산 |
| `sub_question_weighted_sum` | 소문항 가중합산→대문항 | QUESTION_ITEM_SCORES | QUESTION_ITEM_SCORES (축소) | 소문항 가중합산 |
| `question_weight` | 문항 가중치 적용 | QUESTION_ITEM_SCORES | QUESTION_ITEM_SCORES | 문항별 가중치 반영 |
| `question_sum` | 문항 합산 | QUESTION_ITEM_SCORES | SCALAR | 전체 문항 합산 |
| `question_weighted_sum` | 문항 가중합산 | QUESTION_ITEM_SCORES | SCALAR | 전체 문항 가중합산 |
| `sub_question_fail_check` | 소문항별 과락 판정 | QUESTION_ITEM_SCORES | 동일 + failFlags | |
| `question_fail_check` | 대문항별 과락 판정 | QUESTION_ITEM_SCORES | 동일 + failFlags | |

C유형 파이프라인 예시 (복수 채점위원):
```
[average_per_item] → [sub_question_sum] → [question_fail_check] → [question_sum]
→ [total_fail_check] → [normalize_to_max] → [apply_converted_max]
```

C유형 파이프라인 예시 (단일 채점):
```
[sub_question_sum] → [question_weight] → [question_sum]
→ [total_fail_check] → [normalize_to_max] → [apply_converted_max]
```

### 4.8 D유형 블록 상세

| type | 이름 | 입력 | 출력 | 설명 |
|------|------|------|------|------|
| `mapping_lookup` | 점수 변환표 조회 | MAPPING_INPUT | SCALAR | 조건 값으로 점수 변환표에서 점수 조회. 매칭 실패 시 error_flag 설정 |

D유형 파이프라인 예시:
```
[mapping_lookup] → [total_fail_check] → [normalize_to_max] → [apply_converted_max]
```

**mapping_lookup 상세 동작:**
1. 매핑 유형별 매칭 로직:
   - `certificate`: (자격유형, 급수) 정확 매칭
   - `language_test`: (어학유형) 정확 매칭 + 점수 구간(score_min ≤ x ≤ score_max)
   - `transfer_gpa`: 평점/백분위 구간 매칭
   - `achievement`: (실적유형, 등급) 정확 매칭
   - `custom`: 범용 조건 매칭
2. 매칭 실패: 해당 수험생에 `error_flag = true`, `error_message` 설정

### 4.9 공통 후처리 블록

| type | 이름 | 입력 | 출력 | 설명 |
|------|------|------|------|------|
| `item_fail_check` | 항목별 과락 판정 | ARRAY / MATRIX | 동일 + failFlags | 항목별 과락 기준 체크 |
| `total_fail_check` | 전체 과락 판정 | SCALAR | SCALAR + failFlags | 전체 점수 기준 과락 체크 |
| `normalize_to_max` | 만점 기준 환산 | SCALAR | SCALAR | `score / maxScore × 100` → 원점수 |
| `apply_converted_max` | 환산 만점 적용 | SCALAR | SCALAR | `rawScore × (convertedMax / 100)` → 환산점수 |

### 4.10 사용자 정의 단계

두 가지 방식:

**1) 템플릿 블록:**

| type | 이름 | 파라미터 | 동작 |
|------|------|----------|------|
| `custom_bonus` | 가산점 부여 | condition, bonusScore | 조건 충족 시 가산 |
| `custom_ratio` | 비율 조정 | ratio | `score × ratio` |
| `custom_range_map` | 구간 변환 | ranges[] | 점수 구간별 값 매핑 |
| `custom_clamp` | 상한/하한 제한 | min, max | `clamp(score, min, max)` |

입력/출력: SCALAR → SCALAR (단일 점수에 대한 후처리)

**2) 직접 수식 (고급):**

| type | 파라미터 |
|------|----------|
| `custom_formula` | `{ expression: "score * 0.6 + bonus" }` |

**보안 — 수식 샌드박스:**
- 라이브러리: `mathjs` (restricted scope)
- 허용 변수: `score`, `maxScore`, `count`, `bonus`, `weight`, `min`, `max`, `avg`, `sum`
- 허용 함수: `abs`, `round`, `floor`, `ceil`, `pow`, `sqrt`, `min`, `max`
- 금지: 함수 정의, 프로퍼티 접근, 외부 참조
- 검증 절차:
  1. `mathjs.parse(expression)`으로 AST 생성
  2. AST 노드를 순회하며 허용되지 않은 식별자/함수 검출 → 거부
  3. 실행 타임아웃: 100ms
- 저장 전 테스트 값으로 결과 검증 필수 (API: `POST /evaluations/:id/pipeline/preview`)

### 4.11 블록 유효성 검증

```typescript
// packages/shared/src/validators/pipeline.ts
// 프론트엔드(실시간)와 백엔드(저장 시) 모두에서 사용

function validatePipeline(
  blocks: PipelineBlock[],
  evalType: 'A' | 'B' | 'C' | 'D',
  config: EvalConfig
): ValidationResult {
  const errors: ValidationError[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const def = registry.getDefinition(blocks[i].type);

    // 1. 블록이 해당 유형에서 사용 가능한지
    if (!def.applicableTypes.includes(evalType)) {
      errors.push({ blockIndex: i, message: `${def.name}은(는) ${evalType}유형에서 사용할 수 없습니다` });
    }

    // 2. 입출력 형태 호환성
    if (i > 0) {
      const prevDef = registry.getDefinition(blocks[i - 1].type);
      if (!isCompatible(prevDef.outputShape, def.inputShape)) {
        errors.push({ blockIndex: i, message: `이전 블록 출력(${prevDef.outputShape})과 호환되지 않습니다` });
      }
    }
  }

  // 3. 위원 총점 방식/항목별 계산 방식 혼용 검사 (A유형)
  // 4. 필수 블록 누락 검사 (normalize_to_max)
  // 5. 등급 데이터인데 grade_to_score 누락 검사
  // 6. 최종 출력이 SCALAR인지 검사

  return { valid: errors.length === 0, errors };
}
```

### 4.12 소수점 처리

```typescript
function applyDecimal(value: number, config: DecimalConfig): number {
  const factor = Math.pow(10, config.places);
  switch (config.method) {
    case 'round': return Math.round(value * factor) / factor;
    case 'floor': return Math.floor(value * factor) / factor;
    case 'ceil':  return Math.ceil(value * factor) / factor;
  }
}
```

적용 시점: **각 블록 실행 직후** (파이프라인 실행기에서)
- 블록별 `decimal`이 설정되어 있으면 해당 설정 사용
- 없으면 평가의 `defaultDecimal` 사용
- 이는 중간 결과에도 반영되어 단계별 정확한 값 확인 가능
