import { Controller, Get, Post, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@Controller('evaluations/:id')
export class ScoresController {
  @Post('calculate')
  async calculate(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    // Phase 11 — PipelineExecutor 연동 후 구현
    return { data: { successCount: 0, errorCount: 0, errors: [] } };
  }

  @Get('calculate/status')
  async calculateStatus(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    // 비동기 전환 대비 stub
    return { data: { status: 'idle' } };
  }

  @Get('results')
  async getResults(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('sort') sort = 'examinee_no',
    @Query('failOnly') failOnly?: string,
  ) {
    // Phase 11 — Scores 조회 구현
    return { data: [], meta: { total: 0, page: Number(page), limit: Math.min(Number(limit), 100) } };
  }

  @Get('results/:examineeNo')
  async getResultDetail(
    @Param('id') id: string,
    @Param('examineeNo') examineeNo: string,
    @CurrentTenant() tenantId: string,
  ) {
    // Phase 11 — 중간 결과 포함 상세 조회
    return { data: null };
  }

  @Get('results/download')
  async downloadResults(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Query('includeIntermediate') includeIntermediate?: string,
    @Res() res?: Response,
  ) {
    // Phase 11 — ExcelJS 스트리밍 다운로드
    res?.status(501).json({ error: { code: 'NOT_IMPLEMENTED', message: 'Phase 11에서 구현', details: [] } });
  }
}
