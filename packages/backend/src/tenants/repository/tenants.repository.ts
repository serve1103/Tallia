export interface TenantEntity {
  id: string;
  name: string;
  allowedDomains: string[];
  inviteCode: string;
  dataRetentionYears: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTenantDto {
  name: string;
  allowedDomains: string[];
  inviteCode: string;
  dataRetentionYears?: number;
}

export interface UpdateTenantDto {
  name?: string;
  allowedDomains?: string[];
  inviteCode?: string;
  dataRetentionYears?: number;
}

export interface TenantsRepository {
  findAll(): Promise<TenantEntity[]>;
  findById(id: string): Promise<TenantEntity | null>;
  findByInviteCode(code: string): Promise<TenantEntity | null>;
  findByDomain(domain: string): Promise<TenantEntity | null>;
  create(dto: CreateTenantDto): Promise<TenantEntity>;
  update(id: string, dto: UpdateTenantDto): Promise<TenantEntity>;
  delete(id: string): Promise<void>;
  findUsers(tenantId: string): Promise<{ id: string; email: string; name: string; role: string }[]>;
  removeUser(tenantId: string, userId: string): Promise<void>;
}

export const TENANTS_REPOSITORY = Symbol('TENANTS_REPOSITORY');
