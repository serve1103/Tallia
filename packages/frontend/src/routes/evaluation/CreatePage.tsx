import { Typography, Form, Input, Button, Card, message, Select, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { EvaluationType } from '@tallia/shared';
import { useCreateEvaluation, useCopyEvaluation, useEvaluations } from '../../domains/evaluation/hooks/useEvaluations';
import { promptNewName } from '../../shared/lib/prompt-new-name';

const TYPE_CARDS: { value: EvaluationType; label: string; desc: string }[] = [
  { value: 'A', label: 'A. 위원 점수 집계', desc: '서류, 면접, 실기' },
  { value: 'B', label: 'B. 자동 채점', desc: '필답고사' },
  { value: 'C', label: 'C. 문항 점수 계산', desc: '논술' },
  { value: 'D', label: 'D. 점수 변환표', desc: '자격증, 어학, 전적대학' },
];

export function CreatePage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState<EvaluationType | undefined>();
  const [copySourceId, setCopySourceId] = useState<string | undefined>();

  const createMutation = useCreateEvaluation();
  const copyMutation = useCopyEvaluation();
  const { data: evaluationsData } = useEvaluations({ page: 1, limit: 100 });

  const handleCopySourceChange = (value: string | undefined) => {
    setCopySourceId(value);
  };

  /** 이름 중복(409)이면 Modal 로 새 이름을 받아 재시도, 그 외 오류면 토스트. */
  const tryCreate = async (name: string, academicYear?: string, admissionType?: string): Promise<void> => {
    if (!selectedType) return;
    try {
      const evaluation = await createMutation.mutateAsync({
        name,
        type: selectedType,
        academicYear,
        admissionType,
      });
      message.success('평가가 생성되었습니다');
      navigate(`/evaluations/${evaluation.id}/config`);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        const newName = await promptNewName({
          title: '같은 이름의 평가가 이미 있습니다',
          description: '아래에서 새 이름을 입력하세요.',
          currentName: name,
        });
        if (newName) {
          await tryCreate(newName, academicYear, admissionType);
        }
      } else {
        message.error('생성에 실패했습니다');
      }
    }
  };

  const handleFinish = (values: { name: string; academicYear?: string; admissionType?: string }) => {
    if (!selectedType) {
      message.error('평가 유형을 선택하세요');
      return;
    }

    if (copySourceId) {
      copyMutation.mutate(copySourceId, {
        onSuccess: (evaluation) => {
          message.success('평가가 복사되었습니다');
          navigate(`/evaluations/${evaluation.id}/config`);
        },
        onError: () => message.error('복사에 실패했습니다'),
      });
      return;
    }

    void tryCreate(values.name, values.academicYear, values.admissionType);
  };

  const copyOptions = [
    { label: '새로 생성', value: '' },
    ...(evaluationsData?.data ?? []).map((ev) => ({
      label: `${ev.name} 복사`,
      value: ev.id,
    })),
  ];

  const isPending = createMutation.isPending || copyMutation.isPending;

  return (
    <div style={{ maxWidth: 640 }}>
      <Typography.Title level={3} style={{ letterSpacing: '-0.03em', marginBottom: 24 }}>
        새 평가 생성
      </Typography.Title>
      <Card>
        <Form layout="vertical" form={form} onFinish={handleFinish}>

          {/* 기존 평가 복사 */}
          <Form.Item label="기존 평가 복사 (선택사항)">
            <Select
              placeholder="새로 생성"
              options={copyOptions}
              value={copySourceId ?? ''}
              onChange={(val) => handleCopySourceChange(val || undefined)}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: 4, fontSize: 12, color: '#8c8c8c' }}>
              이전 평가를 복사하면 모든 설정이 그대로 복사됩니다
            </div>
          </Form.Item>

          {/* 평가 유형 선택 카드 */}
          <Form.Item label="평가 유형 선택" required>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {TYPE_CARDS.map((card) => {
                const isSelected = selectedType === card.value;
                return (
                  <div
                    key={card.value}
                    onClick={() => setSelectedType(card.value)}
                    style={{
                      border: isSelected ? '2px solid #18181b' : '1px solid #d9d9d9',
                      borderRadius: 8,
                      padding: '12px 8px',
                      cursor: 'pointer',
                      background: isSelected ? '#f5f5f5' : '#fff',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#18181b', marginBottom: 4 }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{card.desc}</div>
                  </div>
                );
              })}
            </div>
          </Form.Item>

          {/* 평가 기본 정보 (복사 시 불필요하지만 표시 유지) */}
          {!copySourceId && (
            <>
              <Form.Item
                name="name"
                label="평가명"
                rules={[{ required: true, message: '평가명을 입력하세요' }]}
              >
                <Input placeholder="예: 2026학년도 수시 면접평가" />
              </Form.Item>
              <Space style={{ width: '100%' }} size={12}>
                <Form.Item name="academicYear" label="학년도 (선택)" style={{ flex: 1, marginBottom: 0 }}>
                  <Input placeholder="예: 2026" />
                </Form.Item>
                <Form.Item name="admissionType" label="전형명 (선택)" style={{ flex: 1, marginBottom: 0 }}>
                  <Input placeholder="예: 수시, 정시" />
                </Form.Item>
              </Space>
            </>
          )}

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={isPending}
                disabled={!copySourceId && !selectedType}
              >
                {copySourceId ? '복사 후 설정 이동' : '다음: 세부 설정'}
              </Button>
              <Button onClick={() => navigate('/dashboard')}>취소</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
