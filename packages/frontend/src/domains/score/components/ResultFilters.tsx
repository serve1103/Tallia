import { Row, Col, Select, Input, Checkbox } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

export type FailFilter = 'all' | 'fail' | 'pass';

interface Props {
  failFilter: FailFilter;
  onFailFilterChange: (value: FailFilter) => void;
  searchText: string;
  onSearchChange: (value: string) => void;
  includeIntermediate: boolean;
  onIncludeIntermediateChange: (value: boolean) => void;
}

export function ResultFilters({
  failFilter,
  onFailFilterChange,
  searchText,
  onSearchChange,
  includeIntermediate,
  onIncludeIntermediateChange,
}: Props) {
  return (
    <Row gutter={[12, 8]} align="middle" style={{ marginBottom: 16 }}>
      <Col xs={24} sm={6}>
        <Select
          value={failFilter}
          onChange={onFailFilterChange}
          style={{ width: '100%' }}
          options={[
            { value: 'all', label: '전체' },
            { value: 'fail', label: '과락만' },
            { value: 'pass', label: '정상만' },
          ]}
          placeholder="과락 필터"
        />
      </Col>
      <Col xs={24} sm={10}>
        <Input
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="수험번호 또는 성명 검색"
          allowClear
        />
      </Col>
      <Col xs={24} sm={8}>
        <Checkbox
          checked={includeIntermediate}
          onChange={(e) => onIncludeIntermediateChange(e.target.checked)}
        >
          중간 결과 포함 다운로드
        </Checkbox>
      </Col>
    </Row>
  );
}
