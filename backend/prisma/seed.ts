import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const hash = await bcrypt.hash(adminPassword, 10);

  const email = adminEmail.trim().toLowerCase();
  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash: hash,
      role: UserRole.PLATFORM_ADMIN,
      emailVerifiedAt: new Date(),
    },
    update: {
      passwordHash: hash,
      role: UserRole.PLATFORM_ADMIN,
      emailVerifiedAt: new Date(),
    },
  });

  console.log(`Seeded platform admin: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
