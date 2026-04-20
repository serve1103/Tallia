import { Controller, Get, Post, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ScoresApplication } from '../application/scores.application';

@Controller('evaluations/:id')
export class ScoresController {
  constructor(private readonly scoresApp: ScoresApplication) {}

  @Post('calculate')
  async calculate(@Param('id') id: string, @CurrentTenant() tenantId: string, @CurrentUser() user: JwtPayload) {
    const result = await this.scoresApp.calculate(id, tenantId, user.sub);
    return { data: result };
  }

  @Get('calculate/status')
  async calculateStatus(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    // 비동기 전환 대비 stub
    return { data: { status: 'idle' } };
  }

  @Get('results/stats')
  async getResultStats(@Param('id') id: string, @CurrentTenant() tenantId: string) {
    const stats = await this.scoresApp.getStats(id, tenantId);
    return { data: stats };
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
    const result = await this.scoresApp.getResults(
      id,
      tenantId,
      Number(page),
      Math.min(Number(limit), 100),
      sort,
      failOnly === 'true',
    );
    return { data: result.data, meta: { total: result.total, page: Number(page), limit: Math.min(Number(limit), 100) } };
  }

  @Get('results/download')
  async downloadResults(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('includeIntermediate') includeIntermediate?: string,
    @Res() res?: Response,
  ) {
    if (!res) return;
    await this.scoresApp.downloadResults(id, tenantId, includeIntermediate === 'true', res, user.sub);
  }

  @Get('results/:examineeNo')
  async getResultDetail(
    @Param('id') id: string,
    @Param('examineeNo') examineeNo: string,
    @CurrentTenant() tenantId: string,
  ) {
    const result = await this.scoresApp.getResultDetail(id, examineeNo, tenantId);
    return { data: result };
  }
}
