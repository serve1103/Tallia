import { Typography, Table, Button, Tag, Space, Select, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, CopyOutlined, SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Evaluation, EvaluationType } from '@tallia/shared';
import { useEvaluations, useDeleteEvaluation, useCopyEvaluation } from '../../domains/evaluation/hooks/useEvaluations';
import { getEvalTypeLabel, getStatusLabel, getStatusColor } from '../../domains/evaluation/models/evaluation';
import { formatDate, formatDateTime } from '../../shared/lib/format';

export function DashboardPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<EvaluationType | undefined>();
  const [academicYearFilter, setAcademicYearFilter] = useState<string | undefined>();
  const [admissionTypeFilter, setAdmissionTypeFilter] = useState<string | undefined>();
  const pageSize = 20;

  const { data, isLoading } = useEvaluations({
    page,
    limit: pageSize,
    type: typeFilter,
    academicYear: academicYearFilter,
    admissionType: admissionTypeFilter,
  });
  const deleteMutation = useDeleteEvaluation();
  const copyMutation = useCopyEvaluation();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => message.success('휴지통으로 이동되었습니다. 휴지통에서 복원 또는 영구 삭제할 수 있습니다.'),
      onError: () => message.error('삭제에 실패했습니다'),
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
        <Link to={`/evaluations/${record.id}/config`}>{name}</Link>
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
      title: '최종 계산',
      key: 'lastCalculated',
      render: (_: unknown, record: Evaluation) =>
        record.status === 'calculated' ? formatDateTime(record.updatedAt) : '-',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ letterSpacing: '-0.03em', margin: 0 }}>
          평가 관리
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/evaluations/create')}>
          평가 생성
        </Button>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="학년도 (예: 2026)"
          allowClear
          style={{ width: 180 }}
          value={academicYearFilter ?? ''}
          onChange={(e) => {
            setPage(1);
            setAcademicYearFilter(e.target.value || undefined);
          }}
        />
        <Input
          prefix={<SearchOutlined />}
          placeholder="전형 (예: 수시)"
          allowClear
          style={{ width: 180 }}
          value={admissionTypeFilter ?? ''}
          onChange={(e) => {
            setPage(1);
            setAdmissionTypeFilter(e.target.value || undefined);
          }}
        />
        <Select
          placeholder="전체 유형"
          allowClear
          style={{ width: 180 }}
          value={typeFilter}
          onChange={(val) => {
            setPage(1);
            setTypeFilter(val ?? undefined);
          }}
          options={[
            { label: 'A. 위원 평가', value: 'A' },
            { label: 'B. 자동 채점', value: 'B' },
            { label: 'C. 문항별 채점', value: 'C' },
            { label: 'D. 점수 변환표', value: 'D' },
          ]}
        />
        {(academicYearFilter || admissionTypeFilter || typeFilter) && (
          <Button
            type="text"
            onClick={() => {
              setAcademicYearFilter(undefined);
              setAdmissionTypeFilter(undefined);
              setTypeFilter(undefined);
              setPage(1);
            }}
          >
            필터 초기화
          </Button>
        )}
      </Space>

      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: data?.meta?.total,
          onChange: setPage,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
