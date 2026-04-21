import { Tag } from 'antd';
import type { CSSProperties, ReactNode } from 'react';

/** Tallia 디자인 시스템 §2.5 Semantic 팔레트 */
export type StatusVariant =
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'neutral'
  | 'primary';

interface VariantStyle {
  background: string;
  color: string;
  borderColor: string;
}

const VARIANT_STYLES: Record<StatusVariant, VariantStyle> = {
  success: { background: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' },
  info: { background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' },
  warning: { background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' },
  error: { background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' },
  neutral: { background: '#f1f1f4', color: '#71717a', borderColor: '#e4e4e7' },
  primary: { background: '#18181b', color: '#ffffff', borderColor: '#18181b' },
};

/** AntD 명명 색 / 단어를 Tallia variant 로 매핑. 레거시 색상 점진 이주용. */
const LEGACY_COLOR_MAP: Record<string, StatusVariant> = {
  green: 'success',
  success: 'success',
  blue: 'info',
  cyan: 'info',
  processing: 'info',
  orange: 'warning',
  gold: 'warning',
  warning: 'warning',
  red: 'error',
  error: 'error',
  default: 'neutral',
  gray: 'neutral',
  magenta: 'info',
  purple: 'info',
};

export function resolveVariant(value: string | StatusVariant | undefined): StatusVariant {
  if (!value) return 'neutral';
  if ((VARIANT_STYLES as Record<string, unknown>)[value]) return value as StatusVariant;
  return LEGACY_COLOR_MAP[value] ?? 'neutral';
}

interface Props {
  variant?: StatusVariant | string;
  icon?: ReactNode;
  style?: CSSProperties;
  children: ReactNode;
}

/** Tallia 디자인 시스템에 맞춘 상태 배지. 모든 Tag 사용은 이 컴포넌트로 통일. */
export function StatusTag({ variant, icon, style, children }: Props) {
  const v = resolveVariant(variant);
  const s = VARIANT_STYLES[v];
  return (
    <Tag
      icon={icon}
      style={{
        background: s.background,
        color: s.color,
        borderColor: s.borderColor,
        fontWeight: 600,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
