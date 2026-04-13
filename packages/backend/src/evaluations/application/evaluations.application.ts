import { Injectable } from '@nestjs/common';
import { EvaluationsService } from '../service/evaluations.service';
import type { EvaluationFilter } from '../repository/evaluations.repository';

@Injectable()
export class EvaluationsApplication {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  async findAll(filter: EvaluationFilter) {
    return this.evaluationsService.findAll(filter);
  }

  async findById(id: string, tenantId: string) {
    return this.evaluationsService.findById(id, tenantId);
  }

  async create(tenantId: string, body: { name: string; type: string; academicYear?: string; admissionType?: string; config: unknown; pipelineConfig?: unknown }) {
    return this.evaluationsService.create({
      tenantId,
      name: body.name,
      type: body.type,
      academicYear: body.academicYear,
      admissionType: body.admissionType,
      config: body.config as Record<string, unknown>,
      pipelineConfig: body.pipelineConfig as Record<string, unknown> ?? { blocks: [] },
    });
  }

  async update(id: string, tenantId: string, body: Record<string, unknown>) {
    return this.evaluationsService.update(id, tenantId, body);
  }

  async delete(id: string, tenantId: string) {
    return this.evaluationsService.delete(id, tenantId);
  }

  async copy(id: string, tenantId: string) {
    return this.evaluationsService.copy(id, tenantId);
  }

  async getConfig(id: string, tenantId: string) {
    return this.evaluationsService.getConfig(id, tenantId);
  }

  async saveConfig(id: string, tenantId: string, config: unknown) {
    return this.evaluationsService.saveConfig(id, tenantId, config);
  }
}
