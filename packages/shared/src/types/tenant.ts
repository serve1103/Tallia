export interface Tenant {
  id: string;
  name: string;
  allowedDomains: string[];
  inviteCode: string;
  dataRetentionYears: number;
  createdAt: string;
  updatedAt: string;
}
