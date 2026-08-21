import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

import { OrgRole } from '../src/constants/org.js';

const prisma = new PrismaClient();

async function main() {
  const email = 'owner@relay.local';
  const passwordHash = await bcrypt.hash('password', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Relay Owner',
      passwordHash,
      isSuperAdmin: true,
    },
  });

  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo',
      slug: 'demo',
    },
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: user.id,
      },
    },
    update: { role: OrgRole.ADMIN },
    create: {
      organizationId: org.id,
      userId: user.id,
      role: OrgRole.ADMIN,
    },
  });

  console.log(`Seeded user ${email} / password (is_super_admin=true)`);
  console.log(`Seeded org slug=demo with ${email} as ${OrgRole.ADMIN}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
