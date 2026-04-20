/**
 * Prisma seed script — 개발 환경 초기 데이터 생성용
 *
 * !! 경고: 이 스크립트의 비밀번호는 개발 전용입니다.
 * !! 프로덕션 환경에서는 실행되지 않습니다 (NODE_ENV=production 체크).
 *
 * 실행: npx prisma db seed  또는  npm run seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// 개발용 기본 비밀번호 — 환경변수로 오버라이드 가능
// NEVER use these values in production
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';
const SEED_TENANT_PASSWORD = process.env.SEED_TENANT_PASSWORD ?? 'Tenant1234!';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[seed] NODE_ENV=production 감지 — 시드 실행을 중단합니다.');
    return;
  }

  console.log('[seed] 데이터베이스 시딩 시작...');

  // 1. Platform Admin
  const adminEmail = 'admin@tallia.kr';
  const adminPasswordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      name: '플랫폼 관리자',
      role: 'platform_admin',
      emailVerified: true,
    },
  });
  console.log(`[seed] Seeded: platform_admin (${adminEmail})`);

  // 2. Test Tenant — 고려대학교
  const tenantInviteCode = 'KU2026';
  const tenant = await prisma.tenant.upsert({
    where: { inviteCode: tenantInviteCode },
    update: {},
    create: {
      name: '고려대학교',
      allowedDomains: ['korea.ac.kr'],
      inviteCode: tenantInviteCode,
      dataRetentionYears: 5,
    },
  });
  console.log(`[seed] Seeded: tenant (${tenant.name}, invite: ${tenantInviteCode})`);

  // 3. Tenant Admin
  const tenantAdminEmail = 'admin@korea.ac.kr';
  const tenantPasswordHash = await bcrypt.hash(SEED_TENANT_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: tenantAdminEmail },
    update: {},
    create: {
      email: tenantAdminEmail,
      passwordHash: tenantPasswordHash,
      name: '입학처 관리자',
      role: 'tenant_admin',
      tenantId: tenant.id,
      emailVerified: true,
    },
  });
  console.log(`[seed] Seeded: tenant_admin (${tenantAdminEmail})`);

  console.log('[seed] 시딩 완료.');
}

main()
  .catch((e) => {
    console.error('[seed] 오류:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
