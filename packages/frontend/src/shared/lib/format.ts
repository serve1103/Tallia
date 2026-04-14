/** 숫자를 소수점 places 자리까지 표시. null/undefined → '-' */
export function formatNumber(value: number | null | undefined, places = 2): string {
  if (value == null) return '-';
  return value.toFixed(places);
}

/** 점수 표시: rawScore / maxScore 형태 */
export function formatScore(raw: number | null | undefined, max?: number): string {
  const formatted = formatNumber(raw);
  if (max != null) return `${formatted} / ${max}`;
  return formatted;
}

/** ISO 날짜 → yyyy-MM-dd HH:mm */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}`;
}

/** ISO 날짜 → yyyy-MM-dd */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd}`;
}

/** 파일 크기 표시 (bytes → KB/MB) */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
