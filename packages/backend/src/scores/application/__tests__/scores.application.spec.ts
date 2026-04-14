import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ScoresApplication } from '../scores.application';
import { ScoresService } from '../../service/scores.service';
import { EvaluationsService } from '../../../evaluations/service/evaluations.service';
import { ExcelService } from '../../../excel/service/excel.service';
import { ResultExporter } from '../../../excel/service/result-exporter';
import { PipelineExecutor } from '../../../pipeline/pipeline-executor';
import { AuditService } from '../../../audit/service/audit.service';

const mockScoresService = {
  findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
  findByExamineeNo: jest.fn().mockResolvedValue({
    id: 's1',
    tenantId: 't1',
    evaluationId: 'e1',
    uploadId: 'u1',
    examineeNo: '001',
    examineeName: '홍길동',
    rawScore: 85,
    convertedScore: 90,
    failFlag: false,
    failReasons: [],
    intermediateResults: [],
    errorFlag: false,
    errorMessage: null,
    calculatedAt: new Date(),
  }),
  saveResults: jest.fn().mockResolvedValue(1),
};

const mockEvaluationsService = {
  findById: jest.fn().mockResolvedValue({
    id: 'e1',
    tenantId: 't1',
    pipelineConfig: null,
    config: { type: 'B' },
    defaultDecimal: { method: 'round', places: 2 },
  }),
  update: jest.fn().mockResolvedValue(undefined),
};

const mockExcelService = {
  findCurrentUpload: jest.fn().mockResolvedValue(null),
};

const mockResultExporter = {
  export: jest.fn(),
};

const mockPipelineExecutor = {
  executeConfig: jest.fn(),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('ScoresApplication', () => {
  let app: ScoresApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ScoresApplication,
        { provide: ScoresService, useValue: mockScoresService },
        { provide: EvaluationsService, useValue: mockEvaluationsService },
        { provide: ExcelService, useValue: mockExcelService },
        { provide: ResultExporter, useValue: mockResultExporter },
        { provide: PipelineExecutor, useValue: mockPipelineExecutor },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    app = module.get(ScoresApplication);
    jest.clearAllMocks();
  });

  it('getResults — scoresService.findAll 호출', async () => {
    await app.getResults('e1', 't1', 1, 20);
    expect(mockScoresService.findAll).toHaveBeenCalledWith({
      tenantId: 't1',
      evaluationId: 'e1',
      page: 1,
      limit: 20,
      sort: undefined,
      failOnly: undefined,
    });
  });

  it('getResultDetail — scoresService.findByExamineeNo 호출', async () => {
    await app.getResultDetail('e1', '001', 't1');
    expect(mockScoresService.findByExamineeNo).toHaveBeenCalledWith('e1', '001', 't1');
  });

  it('calculate — 파이프라인 미설정 시 BadRequestException', async () => {
    mockEvaluationsService.findById.mockResolvedValueOnce({
      id: 'e1',
      tenantId: 't1',
      pipelineConfig: null,
      config: { type: 'B' },
      defaultDecimal: { method: 'round', places: 2 },
    });

    await expect(app.calculate('e1', 't1')).rejects.toThrow(BadRequestException);
    await expect(app.calculate('e1', 't1')).rejects.toThrow('파이프라인이 설정되지 않았습니다');
  });
});
