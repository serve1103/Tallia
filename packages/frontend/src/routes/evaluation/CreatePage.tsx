import { Typography, Form, Input, Select, Button, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import type { EvaluationType } from '@tallia/shared';
import { useCreateEvaluation } from '../../domains/evaluation/hooks/useEvaluations';

const TYPE_OPTIONS = [
  { label: 'A. 위원 평가', value: 'A' },
  { label: 'B. 자동 채점', value: 'B' },
  { label: 'C. 문항별 채점', value: 'C' },
  { label: 'D. 점수 변환표', value: 'D' },
];

export function CreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateEvaluation();

  const handleFinish = (values: { name: string; type: EvaluationType; academicYear?: string; admissionType?: string }) => {
    createMutation.mutate(values, {
      onSuccess: (evaluation) => {
        message.success('평가가 생성되었습니다');
        navigate(`/evaluations/${evaluation.id}/config`);
      },
      onError: () => message.error('생성에 실패했습니다'),
    });
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <Typography.Title level={3} style={{ letterSpacing: '-0.03em', marginBottom: 24 }}>
        평가 생성
      </Typography.Title>
      <Card>
        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item name="name" label="평가명" rules={[{ required: true, message: '평가명을 입력하세요' }]}>
            <Input placeholder="예: 2026학년도 수시 면접평가" />
          </Form.Item>
          <Form.Item name="type" label="평가 유형" rules={[{ required: true, message: '유형을 선택하세요' }]}>
            <Select placeholder="유형 선택" options={TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="academicYear" label="학년도">
            <Input placeholder="예: 2026" />
          </Form.Item>
          <Form.Item name="admissionType" label="전형">
            <Input placeholder="예: 수시, 정시" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
              생성
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
