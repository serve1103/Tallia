import { Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';

const TAB_ITEMS = [
  { key: 'config', label: '평가 설정' },
  { key: 'pipeline', label: '계산 과정' },
  { key: 'upload', label: '엑셀 업로드' },
  { key: 'results', label: '결과 조회' },
];

interface Props {
  evaluationId: string;
  activeKey: string;
}

export function EvaluationTabs({ evaluationId, activeKey }: Props) {
  const navigate = useNavigate();

  return (
    <Tabs
      activeKey={activeKey}
      onChange={(key) => navigate(`/evaluations/${evaluationId}/${key}`)}
      items={TAB_ITEMS}
      style={{ marginBottom: 24 }}
    />
  );
}
