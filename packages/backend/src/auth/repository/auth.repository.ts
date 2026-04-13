export interface CreateUserDto {
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  tenantId: string | null;
}

export interface AuthRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(dto: CreateUserDto): Promise<UserEntity>;
  updateEmailVerified(id: string, verified: boolean): Promise<void>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}

export interface UserEntity {
  id: string;
  tenantId: string | null;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');
