import { Modal, Input } from 'antd';
import { useEffect, useRef, useState } from 'react';

interface PromptOptions {
  title: string;
  description?: string;
  currentName: string;
  /** 기본 제안 이름 (기본값: "{currentName} (2)") */
  suggested?: string;
  okText?: string;
}

/** " (2)" suffix 를 붙여 유니크 후보 생성. 이미 "(2)" 있으면 3으로 증가. */
export function suggestAltName(name: string): string {
  const m = name.match(/^(.*) \((\d+)\)$/);
  if (m) {
    const base = m[1];
    const n = Number(m[2]);
    return `${base} (${n + 1})`;
  }
  return `${name} (2)`;
}

/** 중복 이름 충돌 시 사용자가 새 이름을 입력하도록 안내하는 Modal.
 *  OK 누르면 새 이름을 resolve, 취소하면 null. */
export function promptNewName(options: PromptOptions): Promise<string | null> {
  const suggested = options.suggested ?? suggestAltName(options.currentName);
  return new Promise((resolve) => {
    const valueRef = { current: suggested };
    const modal = Modal.confirm({
      title: options.title,
      icon: null,
      okText: options.okText ?? '변경 후 재시도',
      cancelText: '취소',
      content: (
        <NameInput
          initial={suggested}
          description={options.description}
          onChange={(v) => {
            valueRef.current = v;
          }}
          onEnter={() => {
            modal.destroy();
            resolve(valueRef.current.trim() || null);
          }}
        />
      ),
      onOk: () => {
        const trimmed = valueRef.current.trim();
        resolve(trimmed || null);
      },
      onCancel: () => resolve(null),
    });
  });
}

interface NameInputProps {
  initial: string;
  description?: string;
  onChange: (v: string) => void;
  onEnter: () => void;
}

function NameInput({ initial, description, onChange, onEnter }: NameInputProps) {
  const [value, setValue] = useState(initial);
  const inputRef = useRef<{ select: () => void } | null>(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  return (
    <div style={{ marginTop: 8 }}>
      {description && (
        <div style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>{description}</div>
      )}
      <Input
        ref={(el) => {
          inputRef.current = el as unknown as { select: () => void } | null;
        }}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        onPressEnter={onEnter}
        autoFocus
        maxLength={100}
      />
    </div>
  );
}
