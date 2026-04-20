import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Space, Spin, Divider, message } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ScoreUpload } from '@tallia/shared';
import { useEvaluation } from '../../domains/evaluation/hooks/useEvaluations';
import { getEvalTypeLabel } from '../../domains/evaluation/models/evaluation';
import { UploadDropzone } from '../../domains/excel/components/UploadDropzone';
import { UploadHistory } from '../../domains/excel/components/UploadHistory';
import { ValidationPreview } from '../../domains/excel/components/ValidationPreview';
import type { ValidationError } from '../../domains/excel/components/ValidationPreview';
import { useDownloadTemplate, useUploadExcelSkipErrors } from '../../domains/excel/hooks/useExcel';
import { EvaluationTabs } from '../../shared/components/EvaluationTabs';

export function UploadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluation, isLoading } = useEvaluation(id);
  const templateMutation = useDownloadTemplate(id ?? '');
  const skipErrorsMutation = useUploadExcelSkipErrors(id ?? '');

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUpload, setPreviewUpload] = useState<ScoreUpload | null>(null);

  if (isLoading) return <Spin />;
  if (!evaluation || !id) return <Typography.Text>평가를 찾을 수 없습니다</Typography.Text>;

  const handleUploadSuccess = (upload: ScoreUpload, file: File) => {
    const errors = upload.validationErrors as ValidationError[];
    if (errors && errors.length > 0) {
      setPendingFile(file);
      setPreviewUpload(upload);
    } else {
      message.success(`${upload.rowCount}건 업로드 완료`);
    }
  };

  const handleConfirm = (skipErrors: boolean) => {
    if (!pendingFile) return;
    if (skipErrors) {
      skipErrorsMutation.mutate(pendingFile, {
        onSuccess: (data) => {
          message.success(`${data.rowCount}건 저장 완료`);
          setPendingFile(null);
          setPreviewUpload(null);
        },
        onError: () => {
          message.error('저장에 실패했습니다');
        },
      });
    } else {
      // no errors — already saved on first upload
      message.success(`${previewUpload?.rowCount ?? 0}건 저장 완료`);
      setPendingFile(null);
      setPreviewUpload(null);
    }
  };

  const handleCancel = () => {
    setPendingFile(null);
    setPreviewUpload(null);
  };

  const errors = previewUpload
    ? (previewUpload.validationErrors as ValidationError[])
    : [];
  const totalRows = previewUpload ? previewUpload.rowCount + errors.length : 0;
  const summary = {
    total: totalRows,
    ok: previewUpload?.rowCount ?? 0,
    error: errors.length,
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
        <Button
          icon={<DownloadOutlined />}
          onClick={() => templateMutation.mutate()}
          loading={templateMutation.isPending}
        >
          양식 다운로드
        </Button>
      </div>

      <EvaluationTabs evaluationId={id} activeKey="upload" />

      {previewUpload ? (
        <ValidationPreview
          summary={summary}
          errors={errors}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          confirmLoading={skipErrorsMutation.isPending}
        />
      ) : (
        <UploadDropzone
          evaluationId={id}
          onUploadSuccess={(upload, file) => handleUploadSuccess(upload, file)}
        />
      )}

      <Divider orientation="left">업로드 이력</Divider>
      <UploadHistory evaluationId={id} />
    </div>
  );
}
