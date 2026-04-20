import { Table, Tag, Button, Descriptions } from 'antd';
import type { Score } from '@tallia/shared';
import { useResults } from '../hooks/useScores';
import { getScoreStatusTag } from '../models/score';
import { formatNumber } from '../../../shared/lib/format';
import { useState } from 'react';
import { useBreakpoints } from '../../../shared/hooks/useBreakpoint';
import { ScoreCardList } from './ScoreCardList';

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

function InlineIntermediate({ record }: { record: Score }) {
  if (record.errorFlag) {
    return (
      <div style={{ color: '#cf1322', fontSize: 13 }}>
        오류: {record.errorMessage ?? '알 수 없는 오류'}
      </div>
    );
  }
  const results = (record.intermediateResults as IntermediateResult[] | undefined) ?? [];
  if (results.length === 0) {
    return <div style={{ fontSize: 13, color: '#888' }}>중간 결과 없음</div>;
  }
  return (
    <Descriptions
      size="small"
      column={1}
      bordered
      style={{ background: '#fafafa' }}
      labelStyle={{ width: 200, fontWeight: 600 }}
    >
      {results.map((r, idx) => (
        <Descriptions.Item key={idx} label={`[${r.label ?? r.blockType ?? idx}]`}>
          {typeof r.output === 'number'
            ? formatNumber(r.output)
            : typeof r.output === 'string'
              ? r.output
              : JSON.stringify(r.output)}
        </Descriptions.Item>
      ))}
    </Descriptions>
  );
}

export function ScoreTable({ evaluationId, onSelectExaminee, failOnly, searchText }: Props) {
  const { isMobile } = useBreakpoints();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, isLoading } = useResults(evaluationId, page, pageSize, failOnly);

  if (isMobile) {
    return (
      <ScoreCardList
        evaluationId={evaluationId}
        onSelectExaminee={onSelectExaminee}
        failOnly={failOnly}
        searchText={searchText}
      />
    );
  }

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

  const columns = [
    {
      title: '수험번호',
      dataIndex: 'examineeNo',
      key: 'examineeNo',
      render: (no: string) =>
        onSelectExaminee ? <Button type="link" style={{ padding: 0 }} onClick={() => onSelectExaminee(no)}>{no}</Button> : no,
    },
    { title: '수험자명', dataIndex: 'examineeName', key: 'examineeName' },
    {
      title: '원점수',
      dataIndex: 'rawScore',
      key: 'rawScore',
      render: (v: number | null) => formatNumber(v),
    },
    {
      title: '환산점수',
      dataIndex: 'convertedScore',
      key: 'convertedScore',
      render: (v: number | null) => <strong>{formatNumber(v)}</strong>,
    },
    {
      title: '상태',
      key: 'status',
      render: (_: unknown, record: Score) => {
        const tag = getScoreStatusTag(record);
        return <Tag color={tag.color}>{tag.label}</Tag>;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={filteredData}
      rowKey="id"
      loading={isLoading}
      size="small"
      expandable={{
        expandedRowRender: (record) => <InlineIntermediate record={record} />,
        rowExpandable: (record) =>
          record.errorFlag ||
          ((record.intermediateResults as unknown[] | undefined)?.length ?? 0) > 0,
      }}
      onRow={(record) => ({
        style: record.failFlag || record.errorFlag ? { background: '#fff5f5' } : undefined,
      })}
      pagination={{
        current: page,
        pageSize,
        total: data?.meta?.total,
        onChange: setPage,
        showSizeChanger: false,
      }}
    />
  );
}
