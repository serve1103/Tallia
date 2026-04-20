import { useState } from 'react';
import { Typography, Space, Button, message, Spin } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useEvaluation } from '../../domains/evaluation/hooks/useEvaluations';
import { getEvalTypeLabel } from '../../domains/evaluation/models/evaluation';
import { ScoreTable } from '../../domains/score/components/ScoreTable';
import { DownloadButton } from '../../domains/score/components/DownloadButton';
import { RecalculationBanner } from '../../domains/score/components/RecalculationBanner';
import { ResultStatsCards } from '../../domains/score/components/ResultStatsCards';
import { ResultFilters, type FailFilter } from '../../domains/score/components/ResultFilters';
import { useCalculateScores, useResultStats } from '../../domains/score/hooks/useScores';
import { EvaluationTabs } from '../../shared/components/EvaluationTabs';

export function ResultListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluation, isLoading } = useEvaluation(id);
  const { data: stats, isLoading: statsLoading } = useResultStats(id);
  const calculateMutation = useCalculateScores(id ?? '');

  const [failFilter, setFailFilter] = useState<FailFilter>('all');
  const [searchText, setSearchText] = useState('');
  const [includeIntermediate, setIncludeIntermediate] = useState(false);

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
      onError: (err: unknown) => {
        const anyErr = err as { response?: { data?: { error?: { message?: string } } } };
        const msg = anyErr?.response?.data?.error?.message ?? '계산에 실패했습니다';
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
            type="primary"
            onClick={handleCalculate}
            loading={calculateMutation.isPending}
          >
            계산 실행
          </Button>
          <DownloadButton evaluationId={id} includeIntermediate={includeIntermediate} />
        </Space>
      </div>

      <EvaluationTabs evaluationId={id} activeKey="results" />

      <RecalculationBanner
        needsRecalculation={evaluation.needsRecalculation}
        onRecalculate={handleCalculate}
        loading={calculateMutation.isPending}
      />

      <ResultStatsCards
        stats={stats ?? { total: 0, average: null, failCount: 0, max: null }}
        loading={statsLoading}
      />

      <ResultFilters
        failFilter={failFilter}
        onFailFilterChange={setFailFilter}
        searchText={searchText}
        onSearchChange={setSearchText}
        includeIntermediate={includeIntermediate}
        onIncludeIntermediateChange={setIncludeIntermediate}
      />

      <ScoreTable
        evaluationId={id}
        onSelectExaminee={(no) => navigate(`/evaluations/${id}/results/${no}`)}
        failOnly={failFilter === 'fail'}
        searchText={searchText}
      />
    </div>
  );
}
