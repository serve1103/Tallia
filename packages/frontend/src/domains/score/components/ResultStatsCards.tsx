import { Row, Col, Card, Statistic, Skeleton } from 'antd';
import { formatNumber } from '../../../shared/lib/format';

export interface ResultStats {
  total: number;
  average: number | null;
  failCount: number;
  max: number | null;
}

interface Props {
  stats: ResultStats;
  loading?: boolean;
}

export function ResultStatsCards({ stats, loading }: Props) {
  if (loading) {
    return (
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <Col key={i} xs={12} sm={6}>
            <Card size="small">
              <Skeleton active paragraph={false} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic title="총 인원" value={stats.total} suffix="명" />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title="평균 환산점수"
            value={stats.average != null ? formatNumber(stats.average) : '-'}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title="과락 인원"
            value={stats.failCount}
            suffix="명"
            valueStyle={stats.failCount > 0 ? { color: '#d46b08' } : undefined}
          />
        </Card>
      </Col>
      <Col xs={12} sm={6}>
        <Card size="small">
          <Statistic
            title="최고 환산점수"
            value={stats.max != null ? formatNumber(stats.max) : '-'}
            valueStyle={{ fontWeight: 700 }}
          />
        </Card>
      </Col>
    </Row>
  );
}
