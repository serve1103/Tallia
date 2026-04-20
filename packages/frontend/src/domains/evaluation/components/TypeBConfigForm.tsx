import { useState } from 'react';
import { Form, InputNumber, Button, Card, Space, Divider, Input, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TypeBConfig, SubjectDef, ExamType } from '@tallia/shared';
import { ExamTypeManager } from './ExamTypeManager';
import { AnswerKeyEditor } from './AnswerKeyEditor';
import { QuestionErrorManager } from './QuestionErrorManager';
import { saveAnswerKey, reportQuestionError } from '../api/evaluations';
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

function buildExamTypeMap(subjects: SubjectDef[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const s of subjects) {
    map[s.id] = (s.examTypes ?? []).map((et) => et.name);
  }
  return map;
}

export function TypeBConfigForm({ evaluationId, value, commonSettings, onSave, loading }: Props) {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<CommonSettings>(commonSettings ?? DEFAULT_COMMON_SETTINGS);
  const [answerKeySaving, setAnswerKeySaving] = useState(false);
  const [errorSaving, setErrorSaving] = useState(false);

  // examTypes per subject: subjectId -> string[]
  const [examTypeMap, setExamTypeMap] = useState<Record<string, string[]>>(
    () => buildExamTypeMap(value?.subjects ?? []),
  );

  const handleFinish = (values: { subjects: Record<string, unknown>[]; totalFailThreshold?: number | null }) => {
    const config: TypeBConfig = {
      type: 'B',
      subjects: values.subjects.map((s: Record<string, unknown>, idx: number) => {
        const subjectId = (s.id as string) || `subj-${idx}`;
        const typeNames = examTypeMap[subjectId] ?? [];
        const existingExamTypes: ExamType[] = (value?.subjects ?? [])
          .find((es) => es.id === subjectId)
          ?.examTypes ?? [];
        const examTypes: ExamType[] = typeNames.map((name) => {
          const existing = existingExamTypes.find((et) => et.name === name);
          return existing ?? { id: `et-${name}`, name, questionCount: (s.questionCount as number) ?? 0 };
        });
        return {
          ...s,
          id: subjectId,
          examTypes,
          questionErrors: (s.questionErrors as unknown[]) ?? [],
        };
      }) as SubjectDef[],
      totalFailThreshold: values.totalFailThreshold ?? null,
    };
    onSave(config, settings);
  };

  const handleSaveAnswerKey = async (subjectId: string, answerKey: AnswerKeyEntry[]) => {
    if (!evaluationId) return;
    setAnswerKeySaving(true);
    try {
      await saveAnswerKey(evaluationId, subjectId, answerKey);
    } finally {
      setAnswerKeySaving(false);
    }
  };

  const handleReportError = async (payload: { subjectId: string; questionNo: number; handling: 'all_correct' | 'exclude' }) => {
    if (!evaluationId) return;
    setErrorSaving(true);
    try {
      await reportQuestionError(evaluationId, payload);
    } finally {
      setErrorSaving(false);
    }
  };

  // Remove error: re-save config without that error entry
  const handleRemoveError = async (subjectId: string, questionNo: number) => {
    if (!evaluationId) return;
    const currentValues = form.getFieldsValue();
    const subjects: SubjectDef[] = (currentValues.subjects ?? []).map((s: Record<string, unknown>, idx: number) => {
      const sid = (s.id as string) || `subj-${idx}`;
      const existing = (value?.subjects ?? []).find((es) => es.id === sid);
      const updatedErrors = (existing?.questionErrors ?? []).filter(
        (qe) => !(qe.questionNo === questionNo && sid === subjectId),
      );
      return {
        ...s,
        id: sid,
        examTypes: existing?.examTypes ?? [],
        questionErrors: updatedErrors,
      };
    });
    const updatedConfig: TypeBConfig = {
      type: 'B',
      subjects,
      totalFailThreshold: currentValues.totalFailThreshold ?? null,
    };
    onSave(updatedConfig, settings);
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
              const examTypes = examTypeMap[subjectId] ?? [];
              const subjectDef = currentSubjects.find((s) => s.id === subjectId);
              const questionCount =
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
                    <Form.Item {...rest} name={[name, 'failThreshold']} label="과락 기준">
                      <InputNumber min={0} placeholder="없음" />
                    </Form.Item>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  </Space>

                  <Divider orientation="left" style={{ fontSize: 13 }}>
                    시험유형
                  </Divider>
                  <ExamTypeManager
                    examTypes={examTypes}
                    onChange={(types) =>
                      setExamTypeMap((prev) => ({ ...prev, [subjectId]: types }))
                    }
                  />

                  {examTypes.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <Tabs
                        size="small"
                        items={examTypes.map((typeName) => {
                          const examTypeDef = subjectDef?.examTypes?.find(
                            (et) => et.name === typeName,
                          );
                          return {
                            key: typeName,
                            label: `${typeName}형 정답지`,
                            children: (
                              <AnswerKeyEditor
                                evaluationId={evaluationId ?? ''}
                                subjectId={subjectId}
                                examType={typeName}
                                questionCount={questionCount}
                                existingAnswerKey={examTypeDef?.answerKey}
                                onSave={handleSaveAnswerKey}
                                saving={answerKeySaving}
                              />
                            ),
                          };
                        })}
                      />
                    </div>
                  )}
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
