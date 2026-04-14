import { Test } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExcelService } from '../excel.service';
import { EXCEL_REPOSITORY } from '../../repository/excel.repository';
import type { ExcelRepository, ScoreUploadEntity } from '../../repository/excel.repository';

const mockUpload: ScoreUploadEntity = {
  id: 'u1',
  tenantId: 't1',
  evaluationId: 'e1',
  fileName: 'test.xlsx',
  fileSize: 1024,
  rowCount: 10,
  status: 'active',
  isCurrent: true,
  rawData: [],
  validationErrors: [],
  uploadedBy: 'user1',
  uploadedAt: new Date(),
};

const mockRepo: ExcelRepository = {
  findUploads: jest.fn().mockResolvedValue([mockUpload]),
  findUploadById: jest.fn().mockResolvedValue(mockUpload),
  createUpload: jest.fn().mockResolvedValue(mockUpload),
  rollback: jest.fn().mockResolvedValue(undefined),
};

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExcelService,
        { provide: EXCEL_REPOSITORY, useValue: mockRepo },
      ],
    }).compile();

    service = module.get(ExcelService);
    jest.clearAllMocks();
  });

  it('getUploads — 업로드 목록 조회', async () => {
    const result = await service.getUploads('e1', 't1');
    expect(result).toHaveLength(1);
    expect(mockRepo.findUploads).toHaveBeenCalledWith('e1', 't1');
  });

  it('createUpload — 업로드 생성', async () => {
    const dto = {
      tenantId: 't1', evaluationId: 'e1', fileName: 'test.xlsx',
      fileSize: 1024, rowCount: 10, rawData: [], validationErrors: [], uploadedBy: 'user1',
    };
    const result = await service.createUpload(dto);
    expect(result.id).toBe('u1');
  });

  it('rollback — 성공', async () => {
    await service.rollback('e1', 'u1', 't1');
    expect(mockRepo.rollback).toHaveBeenCalledWith('e1', 'u1', 't1');
  });

  it('rollback — 업로드 없으면 NotFoundException', async () => {
    (mockRepo.findUploadById as jest.Mock).mockResolvedValueOnce(null);
    await expect(service.rollback('e1', 'u999', 't1')).rejects.toThrow(NotFoundException);
  });

  it('rollback — 평가 ID 불일치 시 BadRequestException', async () => {
    (mockRepo.findUploadById as jest.Mock).mockResolvedValueOnce({ ...mockUpload, evaluationId: 'e2' });
    await expect(service.rollback('e1', 'u1', 't1')).rejects.toThrow(BadRequestException);
  });
});
