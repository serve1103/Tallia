import { Typography, Table, Button, Tag, Space, Popconfirm, Tooltip, message } from 'antd';
import type { Evaluation, EvaluationType } from '@tallia/shared';
import { useEvaluations, useRestoreEvaluation, useHardDeleteEvaluation } from '../../domains/evaluation/hooks/useEvaluations';
import { getEvalTypeLabel } from '../../domains/evaluation/models/evaluation';
import { formatDate } from '../../shared/lib/format';

function getDaysRemaining(deletedAt: string): number {
  const deletedMs = new Date(deletedAt).getTime();
  const elapsedDays = (Date.now() - deletedMs) / (1000 * 60 * 60 * 24);
  return Math.ceil(30 - elapsedDays);
}

export function TrashPage() {
  const { data, isLoading } = useEvaluations({ page: 1, limit: 200, trash: true });
  const restoreMutation = useRestoreEvaluation();
  const hardDeleteMutation = useHardDeleteEvaluation();

  const handleRestore = (id: string) => {
    restoreMutation.mutate(id, {
      onSuccess: () => message.success('복원되었습니다'),
      onError: () => message.error('복원에 실패했습니다'),
    });
  };

  const handleHardDelete = (id: string) => {
    hardDeleteMutation.mutate(id, {
      onSuccess: () => message.success('영구 삭제되었습니다'),
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
        message.error(msg ?? '영구 삭제에 실패했습니다');
      },
    });
  };

  const columns = [
    {
      title: '평가명',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '유형',
      dataIndex: 'type',
      key: 'type',
      render: (type: EvaluationType) => <Tag>{getEvalTypeLabel(type)}</Tag>,
    },
    {
      title: '삭제일',
      dataIndex: 'deletedAt',
      key: 'deletedAt',
      render: (deletedAt: string | null | undefined) => (deletedAt ? formatDate(deletedAt) : '-'),
    },
    {
      title: '잔여일',
      key: 'daysRemaining',
      render: (_: unknown, record: Evaluation) => {
        if (!record.deletedAt) return '-';
        const days = getDaysRemaining(record.deletedAt);
        if (days <= 0) return <Tag color="red">만료</Tag>;
        return <Tag color={days <= 7 ? 'orange' : 'default'}>{days}일 남음</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: Evaluation) => {
        const canHardDelete = record.deletedAt ? getDaysRemaining(record.deletedAt) <= 0 : false;
        return (
          <Space>
            <Popconfirm
              title="이 평가를 복원하시겠습니까?"
              onConfirm={() => handleRestore(record.id)}
              okText="복원"
              cancelText="취소"
            >
              <Button type="text" size="small">
                복원
              </Button>
            </Popconfirm>
            {canHardDelete ? (
              <Popconfirm
                title="영구 삭제하면 복구할 수 없습니다. 계속하시겠습니까?"
                onConfirm={() => handleHardDelete(record.id)}
                okText="영구 삭제"
                okButtonProps={{ danger: true }}
                cancelText="취소"
              >
                <Button type="text" danger size="small">
                  영구 삭제
                </Button>
              </Popconfirm>
            ) : (
              <Tooltip title={`삭제 후 30일이 지나야 영구 삭제할 수 있습니다 (${record.deletedAt ? getDaysRemaining(record.deletedAt) : 30}일 남음)`}>
                <Button type="text" danger size="small" disabled>
                  영구 삭제
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ letterSpacing: '-0.03em', margin: 0 }}>
          휴지통
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          삭제된 평가는 30일 후 영구 삭제됩니다. 30일 이내에 복원할 수 있습니다.
        </Typography.Text>
      </div>

      <Table
        columns={columns}
        dataSource={data?.data}
        rowKey="id"
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: '휴지통이 비어있습니다' }}
      />
    </div>
  );
}
