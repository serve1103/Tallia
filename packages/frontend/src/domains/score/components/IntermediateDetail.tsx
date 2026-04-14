import { Descriptions, Table, Tag, Typography, Alert } from 'antd';
import type { Score } from '@tallia/shared';
import { formatNumber } from '../../../shared/lib/format';
import { getScoreStatusTag } from '../models/score';

interface Props {
  score: Score;
}

export function IntermediateDetail({ score }: Props) {
  const statusTag = getScoreStatusTag(score);

  const intermediateColumns = [
    { title: '#', dataIndex: 'blockIndex', key: 'blockIndex', width: 50 },
    { title: '블록', dataIndex: 'label', key: 'label' },
    { title: '타입', dataIndex: 'blockType', key: 'blockType' },
    {
      title: '결과',
      dataIndex: 'output',
      key: 'output',
      render: (v: unknown) => (typeof v === 'number' ? formatNumber(v) : JSON.stringify(v)),
    },
  ];

  return (
    <div>
      {score.errorFlag && score.errorMessage && (
        <Alert type="error" message={score.errorMessage} style={{ marginBottom: 16 }} />
      )}

      <Descriptions bordered size="small" column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="수험번호">{score.examineeNo}</Descriptions.Item>
        <Descriptions.Item label="수험자명">{score.examineeName}</Descriptions.Item>
        <Descriptions.Item label="원점수">{formatNumber(score.rawScore)}</Descriptions.Item>
        <Descriptions.Item label="환산점수">{formatNumber(score.convertedScore)}</Descriptions.Item>
        <Descriptions.Item label="상태">
          <Tag color={statusTag.color}>{statusTag.label}</Tag>
        </Descriptions.Item>
      </Descriptions>

      {score.failReasons.length > 0 && (
        <>
          <Typography.Title level={5}>과락 사유</Typography.Title>
          {score.failReasons.map((f, i) => (
            <Tag key={i} color="warning">
              {f.name}: {f.value} (기준: {f.threshold})
            </Tag>
          ))}
        </>
      )}

      <Typography.Title level={5} style={{ marginTop: 16 }}>중간 계산 결과</Typography.Title>
      <Table
        columns={intermediateColumns}
        dataSource={score.intermediateResults.map((r, i) => ({ ...r, key: i }))}
        size="small"
        pagination={false}
      />
    </div>
  );
}
