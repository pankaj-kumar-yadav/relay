import { prisma } from '@/db.js';

export async function createKeyStore(
  userId: string,
  primaryKey: string,
  secondaryKey: string,
) {
  return prisma.keyStore.create({
    data: { userId, primaryKey, secondaryKey },
  });
}

export async function findActiveKeyStore(userId: string, primaryKey: string) {
  return prisma.keyStore.findFirst({
    where: { userId, primaryKey, status: true },
  });
}

export async function findKeyStoreByKeys(
  userId: string,
  primaryKey: string,
  secondaryKey: string,
) {
  return prisma.keyStore.findFirst({
    where: { userId, primaryKey, secondaryKey },
  });
}

export async function deleteKeyStoreById(id: string) {
  return prisma.keyStore.delete({ where: { id } });
}
