import { useState } from 'react';
import { Table, Select, Tag, Popconfirm, Button, InputNumber, message, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { SubjectDef, QuestionError } from '@tallia/shared';

interface ErrorRow {
  key: string;
  subjectId: string;
  subjectName: string;
  questionNo: number;
  handling: 'all_correct' | 'exclude';
  saved: boolean;
}

interface Props {
  evaluationId: string;
  subjects: SubjectDef[];
  onReport: (payload: { subjectId: string; questionNo: number; handling: 'all_correct' | 'exclude' }) => Promise<void>;
  onRemoveError: (subjectId: string, questionNo: number) => Promise<void>;
  saving?: boolean;
}

function buildRows(subjects: SubjectDef[]): ErrorRow[] {
  const rows: ErrorRow[] = [];
  for (const subject of subjects) {
    for (const qe of subject.questionErrors ?? []) {
      rows.push({
        key: `${subject.id}-${qe.questionNo}`,
        subjectId: subject.id,
        subjectName: subject.name,
        questionNo: qe.questionNo,
        handling: qe.handling,
        saved: true,
      });
    }
  }
  return rows;
}

const HANDLING_OPTIONS = [
  { value: 'all_correct', label: '전원 정답 처리' },
  { value: 'exclude', label: '배점 제외' },
];

export function QuestionErrorManager({
  evaluationId: _evaluationId,
  subjects,
  onReport,
  onRemoveError,
  saving,
}: Props) {
  const [rows, setRows] = useState<ErrorRow[]>(() => buildRows(subjects));

  // Sync from parent when subjects change (initial load)
  const savedRows = buildRows(subjects);
  const unsavedRows = rows.filter((r) => !r.saved);
  const displayRows = [
    ...savedRows,
    ...unsavedRows.filter(
      (ur) => !savedRows.some((sr) => sr.key === ur.key),
    ),
  ];

  const addRow = () => {
    const firstSubject = subjects[0];
    if (!firstSubject) {
      message.warning('과목을 먼저 추가하세요');
      return;
    }
    const newRow: ErrorRow = {
      key: `new-${Date.now()}`,
      subjectId: firstSubject.id,
      subjectName: firstSubject.name,
      questionNo: 1,
      handling: 'all_correct',
      saved: false,
    };
    setRows((prev) => [...prev, newRow]);
  };

  const updateRow = (key: string, patch: Partial<ErrorRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  };

  const handleSaveRow = async (row: ErrorRow) => {
    try {
      await onReport({
        subjectId: row.subjectId,
        questionNo: row.questionNo,
        handling: row.handling,
      });
      setRows((prev) =>
        prev.map((r) => (r.key === row.key ? { ...r, saved: true } : r)),
      );
      message.success('오류 처리 등록 완료');
    } catch {
      message.error('오류 처리 등록에 실패했습니다');
    }
  };

  const handleCancel = async (row: ErrorRow) => {
    if (row.saved) {
      try {
        await onRemoveError(row.subjectId, row.questionNo);
        setRows((prev) => prev.filter((r) => r.key !== row.key));
        message.success('오류 처리 취소 완료');
      } catch {
        message.error('취소에 실패했습니다');
      }
    } else {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
    }
  };

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name || s.id }));

  const columns = [
    {
      title: '과목',
      dataIndex: 'subjectId',
      key: 'subjectId',
      width: 140,
      render: (subjectId: string, row: ErrorRow) =>
        row.saved ? (
          <span>{row.subjectName || subjectId}</span>
        ) : (
          <Select
            size="small"
            value={subjectId}
            options={subjectOptions}
            style={{ width: 120 }}
            onChange={(v) => {
              const subj = subjects.find((s) => s.id === v);
              updateRow(row.key, { subjectId: v, subjectName: subj?.name ?? v });
            }}
          />
        ),
    },
    {
      title: '문항 번호',
      dataIndex: 'questionNo',
      key: 'questionNo',
      width: 100,
      render: (questionNo: number, row: ErrorRow) =>
        row.saved ? (
          <span>{questionNo}번</span>
        ) : (
          <InputNumber
            size="small"
            min={1}
            value={questionNo}
            onChange={(v) => updateRow(row.key, { questionNo: v ?? 1 })}
            style={{ width: 70 }}
          />
        ),
    },
    {
      title: '처리 방식',
      dataIndex: 'handling',
      key: 'handling',
      width: 180,
      render: (handling: string, row: ErrorRow) => (
        <Select
          size="small"
          value={handling}
          options={HANDLING_OPTIONS}
          style={{ width: 160 }}
          disabled={row.saved}
          onChange={(v) => updateRow(row.key, { handling: v as ErrorRow['handling'] })}
        />
      ),
    },
    {
      title: '상태',
      key: 'status',
      width: 100,
      render: (_: unknown, row: ErrorRow) =>
        row.saved ? (
          <Tag color="red">오류 처리됨</Tag>
        ) : (
          <Tag>미저장</Tag>
        ),
    },
    {
      title: '',
      key: 'action',
      width: 120,
      render: (_: unknown, row: ErrorRow) => (
        <Space size={4}>
          {!row.saved && (
            <Button size="small" type="primary" loading={saving} onClick={() => handleSaveRow(row)}>
              저장
            </Button>
          )}
          <Popconfirm
            title={row.saved ? '오류 처리를 취소하시겠습니까?' : '행을 삭제하시겠습니까?'}
            onConfirm={() => handleCancel(row)}
            okText="확인"
            cancelText="아니오"
          >
            <Button size="small" danger={row.saved}>
              취소
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table
        size="small"
        dataSource={displayRows}
        columns={columns}
        pagination={false}
        rowKey="key"
        locale={{ emptyText: '등록된 오류 문항이 없습니다' }}
      />
      <Button
        icon={<PlusOutlined />}
        size="small"
        style={{ marginTop: 12 }}
        onClick={addRow}
      >
        오류 문항 추가
      </Button>
    </div>
  );
}
