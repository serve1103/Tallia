import { Typography, Space, Button, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useEvaluation } from '../../domains/evaluation/hooks/useEvaluations';
import { getEvalTypeLabel } from '../../domains/evaluation/models/evaluation';
import { ScoreTable } from '../../domains/score/components/ScoreTable';
import { DownloadButton } from '../../domains/score/components/DownloadButton';
import { useCalculateScores } from '../../domains/score/hooks/useScores';
import { EvaluationTabs } from '../../shared/components/EvaluationTabs';

export function ResultListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluation, isLoading } = useEvaluation(id);
  const calculateMutation = useCalculateScores(id ?? '');

  if (!id) {
    return (
      <div>
        <Typography.Title level={3}>결과 조회</Typography.Title>
        <Typography.Text type="secondary">대시보드에서 평가를 선택해주세요.</Typography.Text>
      </div>
    );
  }

  if (isLoading) return <Spin />;
  if (!evaluation) return <Typography.Text>평가를 찾을 수 없습니다</Typography.Text>;

  const handleCalculate = () => {
    calculateMutation.mutate(undefined, {
      onSuccess: (result) => {
        message.success(`계산 완료: 성공 ${result.successCount}건, 오류 ${result.errorCount}건`);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error?.message ?? '계산에 실패했습니다';
        message.error(msg);
      },
    });
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/dashboard')}>
          목록으로
        </Button>
      </Space>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {evaluation.name}
          </Typography.Title>
          <Typography.Text type="secondary">{getEvalTypeLabel(evaluation.type)}</Typography.Text>
        </div>
        <Space>
          <Button
            icon={<PlayCircleOutlined />}
            onClick={handleCalculate}
            loading={calculateMutation.isPending}
          >
            계산 실행
          </Button>
          <DownloadButton evaluationId={id} />
        </Space>
      </div>

      <EvaluationTabs evaluationId={id} activeKey="results" />

      <ScoreTable
        evaluationId={id}
        onSelectExaminee={(no) => navigate(`/evaluations/${id}/results/${no}`)}
      />
    </div>
  );
}
