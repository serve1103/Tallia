import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Scores Integration', () => {
  let tenantId: string;
  let evaluationId: string;
  let uploadId: string;
  let userId: string;

  beforeAll(async () => {
    await prisma.$connect();

    const tenant = await prisma.tenant.create({
      data: { name: 'Score Test Uni', allowedDomains: ['scoretest.ac.kr'], inviteCode: 'SCORE', dataRetentionYears: 3 },
    });
    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: { email: 'scoretest@scoretest.ac.kr', passwordHash: 'hash', name: 'Test', role: 'tenant_admin', tenantId },
    });
    userId = user.id;

    const evaluation = await prisma.evaluation.create({
      data: {
        tenantId,
        name: '점수 테스트',
        type: 'A',
        config: { type: 'A', maxCommitteeCount: 3, dataType: 'score', items: [] },
        pipelineConfig: { blocks: [] },
        status: 'draft',
        needsRecalculation: false,
      },
    });
    evaluationId = evaluation.id;

    const upload = await prisma.scoreUpload.create({
      data: {
        tenantId,
        evaluationId,
        fileName: 'test.xlsx',
        fileSize: 1024,
        rowCount: 2,
        rawData: [{ examineeNo: '001', examineeName: '홍길동', data: {} }],
        validationErrors: [],
        uploadedBy: userId,
        status: 'active',
        isCurrent: true,
      },
    });
    uploadId = upload.id;
  });

  afterAll(async () => {
    await prisma.score.deleteMany({ where: { evaluationId } });
    await prisma.scoreUpload.deleteMany({ where: { evaluationId } });
    await prisma.evaluation.delete({ where: { id: evaluationId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('점수 생성 + 조회', async () => {
    const score = await prisma.score.create({
      data: {
        tenantId,
        evaluationId,
        uploadId,
        examineeNo: '001',
        examineeName: '홍길동',
        rawScore: 85.5,
        convertedScore: 90.0,
        failFlag: false,
        failReasons: [],
        intermediateResults: [{ blockIndex: 0, blockType: 'normalize_to_max', label: '만점환산', output: 85.5 }],
        errorFlag: false,
        calculatedAt: new Date(),
      },
    });

    expect(Number(score.rawScore)).toBe(85.5);

    const found = await prisma.score.findFirst({
      where: { evaluationId, examineeNo: '001', tenantId },
    });
    expect(found).not.toBeNull();
    expect(found!.examineeName).toBe('홍길동');
    expect(Number(found!.convertedScore)).toBe(90.0);
  });

  it('과락 플래그 점수', async () => {
    const failScore = await prisma.score.create({
      data: {
        tenantId,
        evaluationId,
        uploadId,
        examineeNo: '002',
        examineeName: '김영희',
        rawScore: 30,
        convertedScore: 35,
        failFlag: true,
        failReasons: [{ type: 'item', name: '면접', value: 30, threshold: 40 }],
        intermediateResults: [],
        errorFlag: false,
        calculatedAt: new Date(),
      },
    });

    expect(failScore.failFlag).toBe(true);

    const results = await prisma.score.findMany({
      where: { evaluationId, tenantId, failFlag: true },
    });
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('업로드 이력 + isCurrent 관리', async () => {
    const uploads = await prisma.scoreUpload.findMany({
      where: { evaluationId, tenantId },
      orderBy: { uploadedAt: 'desc' },
    });
    expect(uploads.length).toBeGreaterThanOrEqual(1);
    expect(uploads.find((u) => u.isCurrent)).toBeTruthy();
  });
});
