export type MappingType = 'certificate' | 'language_test' | 'transfer_gpa' | 'achievement' | 'custom';

export interface MappingTableColumnDef {
  key: string;
  label: string;
  type: 'text' | 'number';
}

export interface MappingTable {
  id: string;
  tenantId: string;
  evaluationId: string;
  mappingType: MappingType;
  columnsDef: MappingTableColumnDef[];
  createdAt: string;
  updatedAt: string;
}

export interface MappingTableEntry {
  id: string;
  mappingTableId: string;
  conditions: Record<string, string | number>;
  score: number;
  sortOrder: number;
}
