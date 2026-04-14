import { Table, Tag, Button } from 'antd';
import type { Score } from '@tallia/shared';
import { useResults } from '../hooks/useScores';
import { getScoreStatusTag } from '../models/score';
import { formatNumber } from '../../../shared/lib/format';
import { useState } from 'react';

interface Props {
  evaluationId: string;
  onSelectExaminee?: (examineeNo: string) => void;
}

export function ScoreTable({ evaluationId, onSelectExaminee }: Props) {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, isLoading } = useResults(evaluationId, page, pageSize);

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
      render: (v: number | null) => formatNumber(v),
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
      dataSource={data?.data}
      rowKey="id"
      loading={isLoading}
      size="small"
      pagination={{
        current: page,
        pageSize,
        total: data?.meta.total,
        onChange: setPage,
        showSizeChanger: false,
      }}
    />
  );
}
