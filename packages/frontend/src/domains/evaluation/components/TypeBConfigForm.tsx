import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Form, InputNumber, Button, Card, Space, Divider, Input, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TypeBConfig, SubjectDef, ExamType, QuestionError, ScoreRange } from '@tallia/shared';
import { ExamTypeManager } from './ExamTypeManager';
import type { ExamTypeEntry } from './ExamTypeManager';
import { AnswerKeyEditor } from './AnswerKeyEditor';
import { QuestionErrorManager } from './QuestionErrorManager';
import { saveAnswerKey, reportQuestionError, removeQuestionError } from '../api/evaluations';
import type { AnswerKeyEntry } from '../api/evaluations';
import { CommonSettingsCard, DEFAULT_COMMON_SETTINGS } from './CommonSettingsCard';
import type { CommonSettings } from './CommonSettingsCard';

interface Props {
  evaluationId?: string;
  value?: TypeBConfig;
  commonSettings?: CommonSettings;
  onSave: (config: TypeBConfig, commonSettings: CommonSettings) => void;
  loading?: boolean;
}

const emptySubject: Omit<SubjectDef, 'examTypes' | 'questionErrors'> = {
  id: '',
  name: '',
  questionCount: 0,
  maxScore: 100,
  failThreshold: null,
};

function buildExamTypeMap(subjects: SubjectDef[]): Record<string, ExamTypeEntry[]> {
  const map: Record<string, ExamTypeEntry[]> = {};
  for (const s of subjects) {
    map[s.id] = (s.examTypes ?? []).map((et) => ({ name: et.name, questionCount: et.questionCount }));
  }
  return map;
}

export function TypeBConfigForm({ evaluationId, value, commonSettings, onSave, loading }: Props) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<CommonSettings>(commonSettings ?? DEFAULT_COMMON_SETTINGS);
  const [answerKeySaving, setAnswerKeySaving] = useState(false);
  const [errorSaving, setErrorSaving] = useState(false);

  // examTypes per subject: subjectId -> ExamTypeEntry[]
  const [examTypeMap, setExamTypeMap] = useState<Record<string, ExamTypeEntry[]>>(
    () => buildExamTypeMap(value?.subjects ?? []),
  );

  const handleFinish = (values: { subjects: Record<string, unknown>[]; totalFailThreshold?: number | null }) => {
    const config: TypeBConfig = {
      type: 'B',
      subjects: values.subjects.map((s: Record<string, unknown>, idx: number) => {
        const subjectId = (s.id as string) || `subj-${idx}`;
        const entries = examTypeMap[subjectId] ?? [];
        const existingSubject = (value?.subjects ?? []).find((es) => es.id === subjectId);
        const existingExamTypes: ExamType[] = existingSubject?.examTypes ?? [];
        const examTypes: ExamType[] = entries.map((entry) => {
          const existing = existingExamTypes.find((et) => et.name === entry.name);
          return existing
            ? { ...existing, questionCount: entry.questionCount }
            : { id: `et-${entry.name}`, name: entry.name, questionCount: entry.questionCount };
        });
        // questionErrors 는 form 필드가 아니라 별도 엔드포인트로 관리됨 →
        // 여기서 빈 배열로 덮어쓰면 서버에 저장된 오류 문항이 날아감.
        // 반드시 서버 상태(existingSubject)에서 그대로 가져와 보존.
        const existingQuestionErrors: QuestionError[] = existingSubject?.questionErrors ?? [];
        return {
          ...s,
          id: subjectId,
          examTypes,
          questionErrors: existingQuestionErrors,
        };
      }) as SubjectDef[],
      totalFailThreshold: values.totalFailThreshold ?? null,
    };
    onSave(config, settings);
  };

  const handleSaveAnswerKey = async (
    subjectId: string,
    examType: string,
    answerKey: AnswerKeyEntry[],
    scoreRanges: ScoreRange[],
  ) => {
    if (!evaluationId) return;
    setAnswerKeySaving(true);
    try {
      await saveAnswerKey(evaluationId, subjectId, examType, answerKey, scoreRanges);
    } finally {
      setAnswerKeySaving(false);
    }
  };

  const handleReportError = async (payload: { subjectId: string; questionNo: number; handling: 'all_correct' | 'exclude' }) => {
    if (!evaluationId) return;
    setErrorSaving(true);
    try {
      await reportQuestionError(evaluationId, payload);
      // 서버 저장 직후 evaluation config 쿼리 invalidate → value 가 새로 내려오고
      // QuestionErrorManager 의 buildRows(subjects) 가 갱신됨
      await queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId, 'config'] });
      await queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId] });
    } finally {
      setErrorSaving(false);
    }
  };

  const handleRemoveError = async (subjectId: string, questionNo: number) => {
    if (!evaluationId) return;
    setErrorSaving(true);
    try {
      await removeQuestionError(evaluationId, { subjectId, questionNo });
      await queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId, 'config'] });
      await queryClient.invalidateQueries({ queryKey: ['evaluations', evaluationId] });
    } finally {
      setErrorSaving(false);
    }
  };

  const currentSubjects: SubjectDef[] = value?.subjects ?? [];

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={value ?? { subjects: [emptySubject], totalFailThreshold: null }}
      onFinish={handleFinish}
    >
      <Form.Item name="totalFailThreshold" label="전체 과락 기준">
        <InputNumber min={0} placeholder="없음" style={{ width: 200 }} />
      </Form.Item>

      <Divider orientation="left">과목</Divider>

      <Form.List name="subjects">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => {
              const subjectId =
                form.getFieldValue(['subjects', name, 'id']) || `subj-${name}`;
              const examTypeEntries = examTypeMap[subjectId] ?? [];
              const subjectDef = currentSubjects.find((s) => s.id === subjectId);
              const subjectQuestionCount =
                form.getFieldValue(['subjects', name, 'questionCount']) ?? subjectDef?.questionCount ?? 0;

              return (
                <Card key={key} size="small" style={{ marginBottom: 16 }}>
                  <Space wrap>
                    <Form.Item {...rest} name={[name, 'name']} label="과목명" rules={[{ required: true }]}>
                      <Input placeholder="과목명" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'questionCount']} label="문항 수">
                      <InputNumber min={1} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'maxScore']} label="만점">
                      <InputNumber min={0} />
                    </Form.Item>
                    <Form.Item
                      {...rest}
                      name={[name, 'weight']}
                      label="가중치"
                      tooltip="과목 가중합산 단계에서 사용. 비워두면 1로 처리."
                    >
                      <InputNumber min={0} step={0.1} placeholder="1" style={{ width: 90 }} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'failThreshold']} label="과락 기준">
                      <InputNumber min={0} placeholder="없음" />
                    </Form.Item>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  </Space>

                  <Divider orientation="left" style={{ fontSize: 13 }}>
                    시험유형
                  </Divider>
                  <ExamTypeManager
                    items={examTypeEntries}
                    onChange={(entries) =>
                      setExamTypeMap((prev) => ({ ...prev, [subjectId]: entries }))
                    }
                    defaultQuestionCount={subjectQuestionCount}
                  />

                  {(() => {
                    // 유형이 없으면 "기본" 하나로 표시 (탭 헤더 숨김)
                    const hasTypes = examTypeEntries.length > 0;
                    const subjectMaxScore =
                      form.getFieldValue(['subjects', name, 'maxScore']) ?? subjectDef?.maxScore ?? 100;
                    return (
                      <div style={{ marginTop: 16 }}>
                        {!hasTypes ? (
                          <div>
                            <div style={{ marginBottom: 8, fontSize: 13, color: '#888', fontWeight: 500 }}>
                              정답지 (기본 유형)
                            </div>
                            <AnswerKeyEditor
                              evaluationId={evaluationId ?? ''}
                              subjectId={subjectId}
                              subjectMaxScore={subjectMaxScore}
                              examType="기본"
                              questionCount={subjectQuestionCount}
                              existingAnswerKey={subjectDef?.examTypes?.find((et) => et.name === '기본')?.answerKey}
                              existingScoreRanges={subjectDef?.examTypes?.find((et) => et.name === '기본')?.scoreRanges}
                              onSave={handleSaveAnswerKey}
                              saving={answerKeySaving}
                            />
                          </div>
                        ) : (
                          <Tabs
                            size="small"
                            items={examTypeEntries.map((entry) => {
                              const examTypeDef = subjectDef?.examTypes?.find(
                                (et) => et.name === entry.name,
                              );
                              // 시험유형별 문항수 우선, 없으면 과목 문항수 사용
                              const etQuestionCount = entry.questionCount > 0 ? entry.questionCount : subjectQuestionCount;
                              return {
                                key: entry.name,
                                label: `${entry.name}형 정답지`,
                                children: (
                                  <AnswerKeyEditor
                                    evaluationId={evaluationId ?? ''}
                                    subjectId={subjectId}
                                    subjectMaxScore={subjectMaxScore}
                                    examType={entry.name}
                                    questionCount={etQuestionCount}
                                    existingAnswerKey={examTypeDef?.answerKey}
                                    existingScoreRanges={examTypeDef?.scoreRanges}
                                    onSave={handleSaveAnswerKey}
                                    saving={answerKeySaving}
                                  />
                                ),
                              };
                            })}
                          />
                        )}
                      </div>
                    );
                  })()}
                </Card>
              );
            })}
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add(emptySubject)}>
              과목 추가
            </Button>
          </>
        )}
      </Form.List>

      {currentSubjects.length > 0 && evaluationId && (
        <>
          <Divider orientation="left">출제 오류 처리</Divider>
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontSize: 13, color: '#888' }}>
              채점 후 출제 오류가 발견되면 여기서 처리합니다
            </div>
            <QuestionErrorManager
              evaluationId={evaluationId}
              subjects={currentSubjects}
              onReport={handleReportError}
              onRemoveError={handleRemoveError}
              saving={errorSaving}
            />
          </Card>
        </>
      )}

      <CommonSettingsCard value={settings} onChange={setSettings} />

      <Form.Item style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit" loading={loading}>
          설정 저장
        </Button>
      </Form.Item>
    </Form>
  );
}
