import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useDownloadResults } from '../hooks/useScores';

interface Props {
  evaluationId: string;
}

export function DownloadButton({ evaluationId }: Props) {
  const mutation = useDownloadResults(evaluationId);

  const handleClick = () => {
    mutation.mutate(undefined, {
      onError: () => message.error('다운로드에 실패했습니다'),
    });
  };

  return (
    <Button icon={<DownloadOutlined />} onClick={handleClick} loading={mutation.isPending}>
      결과 다운로드
    </Button>
  );
}
