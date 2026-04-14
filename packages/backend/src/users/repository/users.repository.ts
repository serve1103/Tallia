export interface UserProfileEntity {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string | null;
  emailVerified: boolean;
}

export interface UsersRepository {
  findById(id: string): Promise<UserProfileEntity | null>;
  updateProfile(id: string, dto: { name?: string }): Promise<UserProfileEntity>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
