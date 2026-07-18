import { prisma } from '../prisma';

export async function getFeeTiers() {
  return prisma.feeTier.findMany({
    include: { exchange: true }
  });
}

export async function getWithdrawalFees(asset?: string) {
  return prisma.withdrawalFee.findMany({
    where: asset ? { asset } : undefined,
    include: { exchange: true, network: true }
  });
}
