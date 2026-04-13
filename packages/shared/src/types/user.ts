export const ROLES = ['platform_admin', 'tenant_admin'] as const;
export type Role = (typeof ROLES)[number];

/** API 응답용 User (password_hash 제외). 백엔드 엔티티는 별도 정의. */
export interface User {
  id: string;
  tenantId: string | null;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
