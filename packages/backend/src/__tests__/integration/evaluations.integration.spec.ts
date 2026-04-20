import { PrismaClient } from '@prisma/client';
import { EvaluationsPrismaRepository } from '../../evaluations/repository-impl/evaluations.prisma.repository';
import { PrismaService } from '../../prisma/prisma.service';

const prisma = new PrismaClient();

// PrismaService 인터페이스를 PrismaClient로 위임하는 어댑터
const prismaService = prisma as unknown as PrismaService;
const repo = new EvaluationsPrismaRepository(prismaService);

describe('Evaluations Integration', () => {
  let tenantId: string;

  beforeAll(async () => {
    await prisma.$connect();
    // 이전 테스트 잔여 데이터 정리 (inviteCode 충돌 방지)
    const stale = await prisma.tenant.findFirst({ where: { inviteCode: 'INTTEST' } });
    if (stale) {
      const staleEvals = await prisma.evaluation.findMany({
        where: { tenantId: stale.id },
        select: { id: true },
      });
      const staleIds = staleEvals.map((e) => e.id);
      if (staleIds.length > 0) {
        const staleTables = await prisma.mappingTable.findMany({
          where: { evaluationId: { in: staleIds } },
          select: { id: true },
        });
        if (staleTables.length > 0) {
          await prisma.mappingTableEntry.deleteMany({
            where: { mappingTableId: { in: staleTables.map((t) => t.id) } },
          });
          await prisma.mappingTable.deleteMany({ where: { id: { in: staleTables.map((t) => t.id) } } });
        }
        await prisma.evaluation.deleteMany({ where: { tenantId: stale.id } });
      }
      await prisma.tenant.delete({ where: { id: stale.id } });
    }
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
    // 테스트 데이터 정리 (외래키 순서: entries → mappingTable → evaluation → tenant)
    const evals = await prisma.evaluation.findMany({ where: { tenantId }, select: { id: true } });
    const evalIds = evals.map((e) => e.id);
    if (evalIds.length > 0) {
      const tables = await prisma.mappingTable.findMany({
        where: { evaluationId: { in: evalIds } },
        select: { id: true },
      });
      const tableIds = tables.map((t) => t.id);
      if (tableIds.length > 0) {
        await prisma.mappingTableEntry.deleteMany({ where: { mappingTableId: { in: tableIds } } });
        await prisma.mappingTable.deleteMany({ where: { id: { in: tableIds } } });
      }
      await prisma.evaluation.deleteMany({ where: { tenantId } });
    }
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

  describe('평가 복사 (repository copy())', () => {
    it('원본/사본 ID가 다르고 config·pipelineConfig 내용이 동일하다', async () => {
      const sourceConfig = { type: 'C', committeeCount: 2, questions: [{ id: 'q1', maxScore: 10 }], totalFailThreshold: null };
      const sourcePipeline = { blocks: [{ type: 'normalize_to_max', params: {}, decimal: 2 }] };

      const original = await prisma.evaluation.create({
        data: {
          tenantId,
          name: '원본 C유형',
          type: 'C',
          config: sourceConfig,
          pipelineConfig: sourcePipeline,
          status: 'configured',
          needsRecalculation: false,
        },
      });

      const copied = await repo.copy(original.id, tenantId);

      // ID는 달라야 함
      expect(copied.id).not.toBe(original.id);
      // copiedFromId는 원본을 가리켜야 함
      expect(copied.copiedFromId).toBe(original.id);
      // config 내용 동일 (깊은 비교)
      expect(copied.config).toEqual(sourceConfig);
      // pipelineConfig 내용 동일
      expect(copied.pipelineConfig).toEqual(sourcePipeline);
      // status는 draft로 리셋
      expect(copied.status).toBe('draft');
      // needsRecalculation은 true
      expect(copied.needsRecalculation).toBe(true);
    });

    it('사본에 scores/score_uploads가 없다', async () => {
      const original = await prisma.evaluation.create({
        data: {
          tenantId,
          name: '점수있는 평가',
          type: 'A',
          config: { type: 'A', maxCommitteeCount: 3, dataType: 'score', items: [] },
          pipelineConfig: { blocks: [] },
          status: 'done',
          needsRecalculation: false,
        },
      });

      const copied = await repo.copy(original.id, tenantId);

      // 사본에 연결된 score_uploads 없음
      const uploads = await prisma.scoreUpload.findMany({ where: { evaluationId: copied.id } });
      expect(uploads).toHaveLength(0);

      // 사본에 연결된 scores 없음
      const scores = await prisma.score.findMany({ where: { evaluationId: copied.id } });
      expect(scores).toHaveLength(0);
    });

    it('D유형: mapping_table과 entries가 사본에 새로 생성된다', async () => {
      const original = await prisma.evaluation.create({
        data: {
          tenantId,
          name: 'D유형 원본',
          type: 'D',
          config: { type: 'D', mappingType: 'custom', inputColumns: ['col1'], maxScore: 100, totalFailThreshold: null },
          pipelineConfig: { blocks: [] },
          status: 'configured',
          needsRecalculation: false,
        },
      });

      // 원본 mapping_table 생성
      const originalTable = await prisma.mappingTable.create({
        data: {
          tenantId,
          evaluationId: original.id,
          mappingType: 'custom',
          columnsDef: [{ name: 'col1', type: 'number' }],
          entries: {
            create: [
              { conditions: { col1: { gte: 90 } }, score: 100, sortOrder: 1 },
              { conditions: { col1: { gte: 80 } }, score: 90, sortOrder: 2 },
            ],
          },
        },
        include: { entries: true },
      });

      const copied = await repo.copy(original.id, tenantId);

      // 사본 mapping_table 존재
      const copiedTable = await prisma.mappingTable.findUnique({
        where: { evaluationId: copied.id },
        include: { entries: true },
      });

      expect(copiedTable).not.toBeNull();
      // 원본 테이블과 ID가 달라야 함
      expect(copiedTable!.id).not.toBe(originalTable.id);
      // mappingType, columnsDef 동일
      expect(copiedTable!.mappingType).toBe(originalTable.mappingType);
      expect(copiedTable!.columnsDef).toEqual(originalTable.columnsDef);
      // entries 수 동일
      expect(copiedTable!.entries).toHaveLength(2);
      // entries ID는 다름 (새로 생성)
      const originalEntryIds = new Set(originalTable.entries.map((e) => e.id));
      copiedTable!.entries.forEach((e) => {
        expect(originalEntryIds.has(e.id)).toBe(false);
      });
      // entries 내용 동일
      const sortedOriginal = [...originalTable.entries].sort((a, b) => a.sortOrder - b.sortOrder);
      const sortedCopied = [...copiedTable!.entries].sort((a, b) => a.sortOrder - b.sortOrder);
      sortedOriginal.forEach((orig, i) => {
        expect(sortedCopied[i].conditions).toEqual(orig.conditions);
        expect(Number(sortedCopied[i].score)).toBe(Number(orig.score));
        expect(sortedCopied[i].sortOrder).toBe(orig.sortOrder);
      });
    });

    it('같은 테넌트 내 이름 중복 방지 — 두 번 복사하면 "(복사 2)"가 생성된다', async () => {
      const original = await prisma.evaluation.create({
        data: {
          tenantId,
          name: '중복 테스트 평가',
          type: 'B',
          config: { type: 'B', subjects: [], totalFailThreshold: null },
          pipelineConfig: { blocks: [] },
          status: 'draft',
          needsRecalculation: false,
        },
      });

      // 첫 번째 복사
      const copy1 = await repo.copy(original.id, tenantId);
      expect(copy1.name).toBe('중복 테스트 평가 (복사)');

      // 두 번째 복사 — 이미 "(복사)"가 존재하므로 "(복사 2)"가 되어야 함
      const copy2 = await repo.copy(original.id, tenantId);
      expect(copy2.name).toBe('중복 테스트 평가 (복사 2)');

      // 세 번째 복사 — "(복사 3)"
      const copy3 = await repo.copy(original.id, tenantId);
      expect(copy3.name).toBe('중복 테스트 평가 (복사 3)');
    });

    it('다른 테넌트에 같은 이름이 있어도 현재 테넌트에서 중복 없으면 "(복사)" 사용', async () => {
      // 다른 테넌트 생성
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Uni',
          allowedDomains: ['other.ac.kr'],
          inviteCode: 'OTHERINV',
          dataRetentionYears: 3,
        },
      });

      try {
        // 다른 테넌트에 같은 이름 평가 생성
        await prisma.evaluation.create({
          data: {
            tenantId: otherTenant.id,
            name: '크로스 테넌트 평가 (복사)',
            type: 'A',
            config: { type: 'A', maxCommitteeCount: 3, dataType: 'score', items: [] },
            pipelineConfig: { blocks: [] },
            status: 'draft',
            needsRecalculation: false,
          },
        });

        // 현재 테넌트 원본
        const original = await prisma.evaluation.create({
          data: {
            tenantId,
            name: '크로스 테넌트 평가',
            type: 'A',
            config: { type: 'A', maxCommitteeCount: 3, dataType: 'score', items: [] },
            pipelineConfig: { blocks: [] },
            status: 'draft',
            needsRecalculation: false,
          },
        });

        // 복사 — 현재 테넌트에 "(복사)" 없으므로 그대로 사용
        const copied = await repo.copy(original.id, tenantId);
        expect(copied.name).toBe('크로스 테넌트 평가 (복사)');
      } finally {
        await prisma.evaluation.deleteMany({ where: { tenantId: otherTenant.id } });
        await prisma.tenant.delete({ where: { id: otherTenant.id } });
      }
    });
  });
});
