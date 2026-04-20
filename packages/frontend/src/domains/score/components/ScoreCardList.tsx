import { Card, Tag, Pagination, Spin, Descriptions, Typography } from 'antd';
import type { Score } from '@tallia/shared';
import { useResults } from '../hooks/useScores';
import { getScoreStatusTag } from '../models/score';
import { formatNumber } from '../../../shared/lib/format';
import { useState } from 'react';

const { Text } = Typography;

interface Props {
  evaluationId: string;
  onSelectExaminee?: (examineeNo: string) => void;
  failOnly?: boolean;
  searchText?: string;
}

interface IntermediateResult {
  blockIndex?: number;
  blockType?: string;
  label?: string;
  output?: unknown;
}

interface CardItemProps {
  record: Score;
  onSelectExaminee?: (examineeNo: string) => void;
}

function ScoreCard({ record, onSelectExaminee }: CardItemProps) {
  const [expanded, setExpanded] = useState(false);
  const tag = getScoreStatusTag(record);
  const intermediates = (record.intermediateResults as IntermediateResult[] | undefined) ?? [];
  const hasDetail = record.errorFlag || intermediates.length > 0;

  const cardStyle: React.CSSProperties = {
    marginBottom: 8,
    background: record.failFlag || record.errorFlag ? '#fff5f5' : undefined,
    borderColor: record.failFlag || record.errorFlag ? '#ffccc7' : undefined,
  };

  return (
    <Card
      size="small"
      style={cardStyle}
      styles={{ body: { padding: '10px 12px' } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div>
            <Text
              strong
              style={
                onSelectExaminee
                  ? { cursor: 'pointer', color: '#1677ff' }
                  : undefined
              }
              onClick={onSelectExaminee ? () => onSelectExaminee(record.examineeNo) : undefined}
            >
              {record.examineeNo}
            </Text>
            {record.examineeName && (
              <Text style={{ marginLeft: 8, color: '#555' }}>{record.examineeName}</Text>
            )}
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: '#444' }}>
            원점수: <strong>{formatNumber(record.rawScore)}</strong>
            <span style={{ margin: '0 8px', color: '#ccc' }}>|</span>
            환산점수: <strong>{formatNumber(record.convertedScore)}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <Tag color={tag.color}>{tag.label}</Tag>
          {hasDetail && (
            <Text
              style={{ fontSize: 12, color: '#1677ff', cursor: 'pointer' }}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? '접기' : '중간결과'}
            </Text>
          )}
        </div>
      </div>

      {expanded && hasDetail && (
        <div style={{ marginTop: 8 }}>
          {record.errorFlag ? (
            <div style={{ color: '#cf1322', fontSize: 13 }}>
              오류: {record.errorMessage ?? '알 수 없는 오류'}
            </div>
          ) : (
            <Descriptions size="small" column={1} bordered style={{ background: '#fafafa' }}>
              {intermediates.map((r, idx) => (
                <Descriptions.Item
                  key={idx}
                  label={`[${r.label ?? r.blockType ?? idx}]`}
                  labelStyle={{ width: 140, fontWeight: 600, fontSize: 12 }}
                >
                  <span style={{ fontSize: 12 }}>
                    {typeof r.output === 'number'
                      ? formatNumber(r.output)
                      : typeof r.output === 'string'
                        ? r.output
                        : JSON.stringify(r.output)}
                  </span>
                </Descriptions.Item>
              ))}
            </Descriptions>
          )}
        </div>
      )}
    </Card>
  );
}

export function ScoreCardList({ evaluationId, onSelectExaminee, failOnly, searchText }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, isLoading } = useResults(evaluationId, page, pageSize, failOnly);

  const filteredData = (() => {
    const rows = data?.data ?? [];
    if (!searchText?.trim()) return rows;
    const q = searchText.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.examineeNo.toLowerCase().includes(q) ||
        (r.examineeName ?? '').toLowerCase().includes(q),
    );
  })();

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 32 }}>
        <Spin />
      </div>
    );
  }

  return (
    <div>
      {filteredData.map((record) => (
        <ScoreCard key={record.id} record={record} onSelectExaminee={onSelectExaminee} />
      ))}

      {(data?.meta?.total ?? 0) > pageSize && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={data?.meta?.total}
            onChange={setPage}
            showSizeChanger={false}
            size="small"
          />
        </div>
      )}
    </div>
  );
}
