import { Table, Button, Popconfirm, message } from 'antd';
import type { ScoreUpload } from '@tallia/shared';
import { useUploads, useRollbackUpload } from '../hooks/useExcel';
import { formatDateTime, formatFileSize } from '../../../shared/lib/format';
import { StatusTag } from '../../../shared/components/StatusTag';

interface Props {
  evaluationId: string;
}

const STATUS_MAP: Record<string, { color: string; label: string }> = {
  validated: { color: 'processing', label: '검증됨' },
  active: { color: 'success', label: '활성' },
  rolled_back: { color: 'default', label: '롤백됨' },
};

export function UploadHistory({ evaluationId }: Props) {
  const { data: uploads, isLoading } = useUploads(evaluationId);
  const rollbackMutation = useRollbackUpload(evaluationId);

  const handleRollback = (uploadId: string) => {
    rollbackMutation.mutate(uploadId, {
      onSuccess: () => message.success('롤백되었습니다'),
      onError: () => message.error('롤백에 실패했습니다'),
    });
  };

  const columns = [
    { title: '파일명', dataIndex: 'fileName', key: 'fileName' },
    {
      title: '크기',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: formatFileSize,
    },
    { title: '행 수', dataIndex: 'rowCount', key: 'rowCount' },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = STATUS_MAP[status] ?? { color: 'default', label: status };
        return <StatusTag variant={info.color}>{info.label}</StatusTag>;
      },
    },
    {
      title: '업로드일',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      render: formatDateTime,
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: ScoreUpload) =>
        record.status === 'active' ? (
          <Popconfirm title="이 업로드를 롤백하시겠습니까?" onConfirm={() => handleRollback(record.id)}>
            <Button type="text" danger size="small">
              롤백
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={uploads}
      rowKey="id"
      loading={isLoading}
      size="small"
    />
  );
}
