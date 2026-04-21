import { Descriptions, Typography, Alert } from 'antd';
import type { BlockDefinition, Score } from '@tallia/shared';
import { formatNumber } from '../../../shared/lib/format';
import { IntermediateStepsView, type IntermediateStep } from '../../../shared/components/IntermediateSteps';
import { StatusTag } from '../../../shared/components/StatusTag';
import { getScoreStatusTag } from '../models/score';

interface Props {
  score: Score;
  definitions?: BlockDefinition[];
}

export function IntermediateDetail({ score, definitions }: Props) {
  const statusTag = getScoreStatusTag(score);
  const steps: IntermediateStep[] = Array.isArray(score.intermediateResults)
    ? (score.intermediateResults as IntermediateStep[])
    : [];

  return (
    <div>
      {score.errorFlag && score.errorMessage && (
        <Alert type="error" message={score.errorMessage} style={{ marginBottom: 16 }} />
      )}

      <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="수험번호">{score.examineeNo}</Descriptions.Item>
        <Descriptions.Item label="수험자명">{score.examineeName}</Descriptions.Item>
        <Descriptions.Item label="원점수">{formatNumber(score.rawScore)}</Descriptions.Item>
        <Descriptions.Item label="환산점수">
          <strong style={{ fontSize: 15 }}>{formatNumber(score.convertedScore)}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="상태">
          <StatusTag variant={statusTag.color}>{statusTag.label}</StatusTag>
        </Descriptions.Item>
      </Descriptions>

      {Array.isArray(score.failReasons) && score.failReasons.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Typography.Title level={5}>과락 사유</Typography.Title>
          {score.failReasons.map((f, i) => (
            <StatusTag key={i} variant="warning" style={{ marginBottom: 4 }}>
              {f.name}: {f.value} (기준: {f.threshold})
            </StatusTag>
          ))}
        </div>
      )}

      <Typography.Title level={5} style={{ marginTop: 16, marginBottom: 12 }}>
        계산 과정
      </Typography.Title>
      <IntermediateStepsView steps={steps} definitions={definitions} />
    </div>
  );
}
