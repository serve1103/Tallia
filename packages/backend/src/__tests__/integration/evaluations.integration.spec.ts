import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Evaluations Integration', () => {
  let tenantId: string;

  beforeAll(async () => {
    await prisma.$connect();
    // 테스트 테넌트 생성
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Integration Test Uni',
        allowedDomains: ['test.ac.kr'],
        inviteCode: 'INTTEST',
        dataRetentionYears: 3,
      },
    });
    tenantId = tenant.id;
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await prisma.evaluation.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('평가 생성 → 조회 → 수정 → 삭제', async () => {
    // 생성
    const created = await prisma.evaluation.create({
      data: {
        tenantId,
        name: '테스트 평가',
        type: 'A',
        config: { type: 'A', maxCommitteeCount: 3, dataType: 'score', items: [] },
        pipelineConfig: { blocks: [] },
        status: 'draft',
        needsRecalculation: false,
      },
    });
    expect(created.id).toBeTruthy();
    expect(created.name).toBe('테스트 평가');

    // 조회
    const found = await prisma.evaluation.findUnique({ where: { id: created.id } });
    expect(found).not.toBeNull();
    expect(found!.tenantId).toBe(tenantId);

    // 수정
    const updated = await prisma.evaluation.update({
      where: { id: created.id },
      data: { name: '수정된 평가', needsRecalculation: true },
    });
    expect(updated.name).toBe('수정된 평가');
    expect(updated.needsRecalculation).toBe(true);

    // 삭제
    await prisma.evaluation.delete({ where: { id: created.id } });
    const deleted = await prisma.evaluation.findUnique({ where: { id: created.id } });
    expect(deleted).toBeNull();
  });

  it('테넌트 격리: 다른 테넌트 데이터 접근 불가', async () => {
    const eval1 = await prisma.evaluation.create({
      data: {
        tenantId,
        name: '테넌트A 평가',
        type: 'B',
        config: { type: 'B', subjects: [], totalFailThreshold: null },
        pipelineConfig: { blocks: [] },
        status: 'draft',
        needsRecalculation: false,
      },
    });

    // 다른 테넌트로 조회 시 결과 없음
    const results = await prisma.evaluation.findMany({
      where: { tenantId: '00000000-0000-0000-0000-000000000000' },
    });
    expect(results.find((e) => e.id === eval1.id)).toBeUndefined();

    await prisma.evaluation.delete({ where: { id: eval1.id } });
  });

  it('평가 복사', async () => {
    const original = await prisma.evaluation.create({
      data: {
        tenantId,
        name: '원본 평가',
        type: 'C',
        config: { type: 'C', committeeCount: 2, questions: [], totalFailThreshold: null },
        pipelineConfig: { blocks: [{ type: 'normalize_to_max', params: {}, decimal: null }] },
        status: 'configured',
        needsRecalculation: false,
      },
    });

    const copy = await prisma.evaluation.create({
      data: {
        tenantId,
        name: `${original.name} (복사)`,
        type: original.type,
        config: original.config ?? {},
        pipelineConfig: original.pipelineConfig ?? {},
        status: 'draft',
        needsRecalculation: false,
        copiedFromId: original.id,
      },
    });

    expect(copy.name).toBe('원본 평가 (복사)');
    expect(copy.copiedFromId).toBe(original.id);
    expect(copy.status).toBe('draft');

    await prisma.evaluation.deleteMany({ where: { id: { in: [original.id, copy.id] } } });
  });
});
