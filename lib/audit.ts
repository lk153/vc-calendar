import type { Prisma, PrismaClient } from "@prisma/client";

type Tx = Prisma.TransactionClient | PrismaClient;

export async function writeAudit(
  tx: Tx,
  args: { actorId: string; entity: string; entityId: string; action: string; diff?: unknown }
) {
  await tx.auditLog.create({
    data: {
      actorId: args.actorId,
      entity: args.entity,
      entityId: args.entityId,
      action: args.action,
      diff: (args.diff ?? null) as Prisma.InputJsonValue,
    },
  });
}
