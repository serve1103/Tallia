import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Space, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useResultDetail } from '../../domains/score/hooks/useScores';
import { IntermediateDetail } from '../../domains/score/components/IntermediateDetail';

export function ResultDetailPage() {
  const { id, examineeNo } = useParams<{ id: string; examineeNo: string }>();
  const navigate = useNavigate();
  const { data: score, isLoading } = useResultDetail(id, examineeNo);

  if (isLoading) return <Spin />;
  if (!score) return <Typography.Text>결과를 찾을 수 없습니다</Typography.Text>;

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(`/evaluations/${id}/results`)}>
          목록으로
        </Button>
      </Space>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        수험자 상세: {score.examineeName} ({score.examineeNo})
      </Typography.Title>
      <IntermediateDetail score={score} />
    </div>
  );
}
