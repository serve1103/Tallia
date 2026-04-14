import { Alert, Table, Typography } from 'antd';
import type { ScoreUpload } from '@tallia/shared';

interface Props {
  upload: ScoreUpload;
}

export function ValidationPreview({ upload }: Props) {
  const errors = upload.validationErrors as Array<{ row: number; column: string; message: string }>;

  if (!errors || errors.length === 0) {
    return (
      <Alert
        type="success"
        message={`검증 완료: ${upload.rowCount}건 정상`}
        style={{ marginBottom: 16 }}
      />
    );
  }

  const columns = [
    { title: '행', dataIndex: 'row', key: 'row', width: 80 },
    { title: '컬럼', dataIndex: 'column', key: 'column', width: 120 },
    { title: '오류', dataIndex: 'message', key: 'message' },
  ];

  return (
    <div>
      <Alert
        type="warning"
        message={`${errors.length}건의 검증 오류가 있습니다`}
        style={{ marginBottom: 16 }}
      />
      <Table
        columns={columns}
        dataSource={errors.map((e, i) => ({ ...e, key: i }))}
        size="small"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
