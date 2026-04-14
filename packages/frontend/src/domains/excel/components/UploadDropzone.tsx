import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useUploadExcel } from '../hooks/useExcel';

const { Dragger } = Upload;

interface Props {
  evaluationId: string;
}

export function UploadDropzone({ evaluationId }: Props) {
  const uploadMutation = useUploadExcel(evaluationId);

  const handleUpload = (file: File) => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      message.error('파일 크기는 10MB를 초과할 수 없습니다');
      return false;
    }

    const isExcel =
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls');

    if (!isExcel) {
      message.error('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다');
      return false;
    }

    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        message.success(`${data.rowCount}건 업로드 완료`);
      },
      onError: () => {
        message.error('업로드에 실패했습니다');
      },
    });
    return false;
  };

  return (
    <Dragger
      accept=".xlsx,.xls"
      showUploadList={false}
      beforeUpload={handleUpload}
      disabled={uploadMutation.isPending}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">엑셀 파일을 여기에 드래그하거나 클릭하여 업로드</p>
      <p className="ant-upload-hint">.xlsx, .xls 파일만 지원합니다</p>
    </Dragger>
  );
}
