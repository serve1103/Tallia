import type { Prisma } from '@prisma/client';

/** Prisma JSON 필드 캐스트 헬퍼 */
export function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return value as any;
}
