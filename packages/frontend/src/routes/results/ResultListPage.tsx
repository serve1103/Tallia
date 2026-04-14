import { Typography, Select, Space, Button, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircleOutlined } from '@ant-design/icons';
import { useEvaluations } from '../../domains/evaluation/hooks/useEvaluations';
import { getEvalTypeLabel } from '../../domains/evaluation/models/evaluation';
import { ScoreTable } from '../../domains/score/components/ScoreTable';
import { DownloadButton } from '../../domains/score/components/DownloadButton';
import { useCalculateScores } from '../../domains/score/hooks/useScores';

export function ResultListPage() {
  const navigate = useNavigate();
  const [selectedEvalId, setSelectedEvalId] = useState<string>();
  const { data: evaluations } = useEvaluations({ page: 1, limit: 100 });
  const calculateMutation = useCalculateScores(selectedEvalId ?? '');

  const handleCalculate = () => {
    if (!selectedEvalId) return;
    calculateMutation.mutate(undefined, {
      onSuccess: (result) => {
        message.success(`계산 완료: 성공 ${result.successCount}건, 오류 ${result.errorCount}건`);
      },
      onError: () => message.error('계산에 실패했습니다'),
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ letterSpacing: '-0.03em', margin: 0 }}>
          결과 조회
        </Typography.Title>
        <Space>
          <Select
            placeholder="평가 선택"
            style={{ width: 300 }}
            value={selectedEvalId}
            onChange={setSelectedEvalId}
            options={evaluations?.data.map((e) => ({
              label: `${e.name} (${getEvalTypeLabel(e.type)})`,
              value: e.id,
            }))}
          />
          {selectedEvalId && (
            <>
              <Button
                icon={<PlayCircleOutlined />}
                onClick={handleCalculate}
                loading={calculateMutation.isPending}
              >
                계산 실행
              </Button>
              <DownloadButton evaluationId={selectedEvalId} />
            </>
          )}
        </Space>
      </div>
      {selectedEvalId ? (
        <ScoreTable
          evaluationId={selectedEvalId}
          onSelectExaminee={(no) => navigate(`/evaluations/${selectedEvalId}/results/${no}`)}
        />
      ) : (
        <Typography.Text type="secondary">평가를 선택하세요</Typography.Text>
      )}
    </div>
  );
}
