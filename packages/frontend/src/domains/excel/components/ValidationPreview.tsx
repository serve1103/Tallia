import { Table, Button, Space, Typography, Statistic, Row, Col } from 'antd';

export interface ValidationError {
  row: number;
  examineeNo: string;
  examineeName: string;
  column: string;
  message: string;
}

interface Props {
  summary: { total: number; ok: number; error: number };
  errors: ValidationError[];
  onConfirm: (skipErrors: boolean) => void;
  onCancel: () => void;
  confirmLoading?: boolean;
}

const ERROR_ROW_STYLE = { backgroundColor: '#fff5f5' };

export function ValidationPreview({ summary, errors, onConfirm, onCancel, confirmLoading }: Props) {
  const columns = [
    {
      title: '행',
      dataIndex: 'row',
      key: 'row',
      width: 70,
    },
    {
      title: '수험번호',
      dataIndex: 'examineeNo',
      key: 'examineeNo',
      width: 130,
    },
    {
      title: '성명',
      dataIndex: 'examineeName',
      key: 'examineeName',
      width: 100,
    },
    {
      title: '오류 내용',
      key: 'message',
      render: (_: unknown, record: ValidationError) =>
        record.column ? `${record.column}: ${record.message}` : record.message,
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <Row gutter={24} style={{ marginBottom: 16 }}>
        <Col>
          <Statistic title="총 행수" value={summary.total} />
        </Col>
        <Col>
          <Statistic title="정상" value={summary.ok} valueStyle={{ color: '#18181b' }} />
        </Col>
        <Col>
          <Statistic
            title="오류"
            value={summary.error}
            valueStyle={summary.error > 0 ? { color: '#cf1322' } : { color: '#18181b' }}
          />
        </Col>
      </Row>

      {errors.length > 0 && (
        <>
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
            아래 행에서 오류가 발견되었습니다.
          </Typography.Text>
          <Table
            columns={columns}
            dataSource={errors.map((e, i) => ({ ...e, key: i }))}
            size="small"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            rowClassName={() => ''}
            onRow={() => ({ style: ERROR_ROW_STYLE })}
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      <Space>
        {errors.length > 0 ? (
          <Button
            type="primary"
            onClick={() => onConfirm(true)}
            loading={confirmLoading}
            style={{ background: '#18181b', borderColor: '#18181b' }}
          >
            오류 제외하고 저장 ({summary.ok}건)
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={() => onConfirm(false)}
            loading={confirmLoading}
            style={{ background: '#18181b', borderColor: '#18181b' }}
          >
            저장 ({summary.total}건)
          </Button>
        )}
        <Button onClick={onCancel}>취소</Button>
      </Space>
    </div>
  );
}
