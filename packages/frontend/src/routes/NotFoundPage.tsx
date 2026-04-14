import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Result
        status="404"
        title="페이지를 찾을 수 없습니다"
        subTitle="요청하신 페이지가 존재하지 않거나 이동되었습니다."
        extra={
          <Button type="primary" onClick={() => navigate('/dashboard')}>
            대시보드로 이동
          </Button>
        }
      />
    </div>
  );
}
