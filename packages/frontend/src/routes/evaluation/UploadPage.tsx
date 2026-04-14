import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Space, Spin, Divider } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { useEvaluation } from '../../domains/evaluation/hooks/useEvaluations';
import { getEvalTypeLabel } from '../../domains/evaluation/models/evaluation';
import { UploadDropzone } from '../../domains/excel/components/UploadDropzone';
import { UploadHistory } from '../../domains/excel/components/UploadHistory';
import { useDownloadTemplate } from '../../domains/excel/hooks/useExcel';

export function UploadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluation, isLoading } = useEvaluation(id);
  const templateMutation = useDownloadTemplate(id ?? '');

  if (isLoading) return <Spin />;
  if (!evaluation || !id) return <Typography.Text>평가를 찾을 수 없습니다</Typography.Text>;

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/dashboard')}>
          목록으로
        </Button>
      </Space>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {evaluation.name}
          </Typography.Title>
          <Typography.Text type="secondary">{getEvalTypeLabel(evaluation.type)} — 엑셀 업로드</Typography.Text>
        </div>
        <Button
          icon={<DownloadOutlined />}
          onClick={() => templateMutation.mutate()}
          loading={templateMutation.isPending}
        >
          양식 다운로드
        </Button>
      </div>

      <UploadDropzone evaluationId={id} />

      <Divider orientation="left">업로드 이력</Divider>
      <UploadHistory evaluationId={id} />
    </div>
  );
}
