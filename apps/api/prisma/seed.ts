import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'owner@relay.local';
  const passwordHash = await bcrypt.hash('password', 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Relay Owner',
      passwordHash,
      isSuperAdmin: true,
    },
  });

  console.log(`Seeded user ${email} / password (is_super_admin=true)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
