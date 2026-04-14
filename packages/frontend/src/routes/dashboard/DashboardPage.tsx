import { Typography, Table, Button, Tag, Space, Select, message, Popconfirm } from 'antd';
import { PlusOutlined, CopyOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Evaluation, EvaluationType } from '@tallia/shared';
import { useEvaluations, useDeleteEvaluation, useCopyEvaluation } from '../../domains/evaluation/hooks/useEvaluations';
import { getEvalTypeLabel, getStatusLabel, getStatusColor } from '../../domains/evaluation/models/evaluation';
import { formatDate } from '../../shared/lib/format';

export function DashboardPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<EvaluationType | undefined>();
  const pageSize = 20;

  const { data, isLoading } = useEvaluations({ page, limit: pageSize, type: typeFilter });
  const deleteMutation = useDeleteEvaluation();
  const copyMutation = useCopyEvaluation();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => message.success('삭제되었습니다'),
    });
  };

  const handleCopy = (id: string) => {
    copyMutation.mutate(id, {
      onSuccess: () => message.success('복사되었습니다'),
    });
  };

  const columns = [
    {
      title: '평가명',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Evaluation) => (
        <a onClick={() => navigate(`/evaluations/${record.id}/config`)}>{name}</a>
      ),
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      render: (type: EvaluationType) => <Tag>{getEvalTypeLabel(type)}</Tag>,
    },
    {
      title: '학년도',
      dataIndex: 'academicYear',
      key: 'academicYear',
    },
    {
      title: '전형',
      dataIndex: 'admissionType',
      key: 'admissionType',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: Evaluation['status']) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: formatDate,
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: Evaluation) => (
        <Space>
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(record.id)}>
            복사
          </Button>
          <Popconfirm title="정말 삭제하시겠습니까?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger size="small">삭제</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ letterSpacing: '-0.03em', margin: 0 }}>
          평가 관리
        </Typography.Title>
        <Space>
          <Select
            placeholder="유형 필터"
            allowClear
            style={{ width: 140 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { label: '위원 평가', value: 'A' },
              { label: '자동 채점', value: 'B' },
              { label: '문항별 채점', value: 'C' },
              { label: '점수 변환표', value: 'D' },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/evaluations/create')}>
            평가 생성
          </Button>
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta.total,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
