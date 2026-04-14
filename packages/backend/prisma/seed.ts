import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234!';
  const tenantPassword = process.env.SEED_TENANT_PASSWORD ?? 'Tenant1234!';

  // 1. Platform Admin
  const adminEmail = 'admin@tallia.kr';
  const existingAdmin = await prisma.user.findFirst({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: '플랫폼 관리자',
        role: 'platform_admin',
        emailVerified: true,
      },
    });
    console.log(`  ✓ Platform admin created: ${adminEmail}`);
  } else {
    console.log('  - Platform admin already exists');
  }

  // 2. Test Tenant
  const testTenantName = '한국대학교';
  let tenant = await prisma.tenant.findFirst({ where: { name: testTenantName } });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: testTenantName,
        allowedDomains: ['korea.ac.kr'],
        inviteCode: 'KU2026',
        dataRetentionYears: 5,
      },
    });
    console.log(`  ✓ Test tenant created: ${testTenantName} (invite: KU2026)`);
  } else {
    console.log('  - Test tenant already exists');
  }

  // 3. Tenant Admin
  const tenantAdminEmail = 'admin@korea.ac.kr';
  const existingTenantAdmin = await prisma.user.findFirst({ where: { email: tenantAdminEmail } });

  if (!existingTenantAdmin) {
    const passwordHash = await bcrypt.hash(tenantPassword, 12);
    await prisma.user.create({
      data: {
        email: tenantAdminEmail,
        passwordHash,
        name: '입학처 관리자',
        role: 'tenant_admin',
        tenantId: tenant.id,
        emailVerified: true,
      },
    });
    console.log(`  ✓ Tenant admin created: ${tenantAdminEmail}`);
  } else {
    console.log('  - Tenant admin already exists');
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
