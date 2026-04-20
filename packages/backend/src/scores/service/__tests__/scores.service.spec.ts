import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ScoresService } from '../scores.service';
import { SCORES_REPOSITORY } from '../../repository/scores.repository';
import type { ScoresRepository, ScoreEntity } from '../../repository/scores.repository';

const mockScore: ScoreEntity = {
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
};

const mockRepo: ScoresRepository = {
  findAll: jest.fn().mockResolvedValue({ data: [mockScore], total: 1 }),
  findByExamineeNo: jest.fn().mockResolvedValue(mockScore),
  upsertBatch: jest.fn().mockResolvedValue(1),
  deleteByEvaluation: jest.fn().mockResolvedValue(0),
  getStats: jest.fn().mockResolvedValue({ total: 1, average: 87.5, failCount: 0, max: 90 }),
};

describe('ScoresService', () => {
  let service: ScoresService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ScoresService,
        { provide: SCORES_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(ScoresService);
    jest.clearAllMocks();
  });

  it('findAll — 점수 목록 조회', async () => {
    const result = await service.findAll({ tenantId: 't1', evaluationId: 'e1', page: 1, limit: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(mockRepo.findAll).toHaveBeenCalledWith({ tenantId: 't1', evaluationId: 'e1', page: 1, limit: 20 });
  });

  it('findByExamineeNo — 수험자 상세 조회', async () => {
    const result = await service.findByExamineeNo('e1', '001', 't1');
    expect(result.examineeNo).toBe('001');
  });

  it('findByExamineeNo — 없으면 NotFoundException', async () => {
    (mockRepo.findByExamineeNo as jest.Mock).mockResolvedValueOnce(null);
    await expect(service.findByExamineeNo('e1', '999', 't1')).rejects.toThrow(NotFoundException);
  });

  it('saveResults — 배치 upsert', async () => {
    const scores = [
      { tenantId: 't1', evaluationId: 'e1', uploadId: 'u1', examineeNo: '001', examineeName: '홍길동', rawScore: 85, convertedScore: 90, failFlag: false, failReasons: [], intermediateResults: [], errorFlag: false, errorMessage: null },
    ];
    const count = await service.saveResults(scores);
    expect(count).toBe(1);
    expect(mockRepo.upsertBatch).toHaveBeenCalledWith(scores);
  });
});
