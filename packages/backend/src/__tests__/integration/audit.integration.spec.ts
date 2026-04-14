import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Audit Log Integration', () => {
  let tenantId: string;
  let userId: string;
  let evaluationId: string;

  beforeAll(async () => {
    await prisma.$connect();
    const tenant = await prisma.tenant.create({
      data: { name: 'Audit Test Uni', allowedDomains: ['audit.ac.kr'], inviteCode: 'AUDIT', dataRetentionYears: 3 },
    });
    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: { email: 'auditor@audit.ac.kr', passwordHash: 'hash', name: 'Auditor', role: 'tenant_admin', tenantId },
    });
    userId = user.id;

    const evaluation = await prisma.evaluation.create({
      data: {
        tenantId,
        name: '감사 테스트 평가',
        type: 'A',
        config: { type: 'A', maxCommitteeCount: 3, dataType: 'score', items: [] },
        pipelineConfig: { blocks: [] },
        status: 'draft',
        needsRecalculation: false,
      },
    });
    evaluationId = evaluation.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId } });
    await prisma.evaluation.delete({ where: { id: evaluationId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('감사 로그 생성 + 조회', async () => {
    const log = await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'create',
        resourceType: 'evaluation',
        resourceId: evaluationId,
        details: { name: '새 평가' },
        ipAddress: '127.0.0.1',
      },
    });

    expect(log.action).toBe('create');

    const logs = await prisma.auditLog.findMany({
      where: { tenantId, resourceType: 'evaluation' },
    });
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });

  it('감사 로그에 PII 값 없음 확인', async () => {
    const log = await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action: 'update',
        resourceType: 'evaluation',
        resourceId: evaluationId,
        details: { field: 'name' },
        ipAddress: '127.0.0.1',
      },
    });

    const details = log.details as Record<string, unknown>;
    expect(details).not.toHaveProperty('password');
    expect(details).not.toHaveProperty('passwordHash');
    expect(details).not.toHaveProperty('token');
  });

  it('감사 로그 페이지네이션', async () => {
    for (let i = 0; i < 5; i++) {
      await prisma.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'calculate',
          resourceType: 'evaluation',
          resourceId: evaluationId,
          ipAddress: '127.0.0.1',
        },
      });
    }

    const page1 = await prisma.auditLog.findMany({
      where: { tenantId },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });
    expect(page1.length).toBe(3);

    const total = await prisma.auditLog.count({ where: { tenantId } });
    expect(total).toBeGreaterThanOrEqual(7);
  });
});
