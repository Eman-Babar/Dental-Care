import prisma from "../config/prisma.js";

export async function writeAuditLog({
  actorId = null,
  actorRole = null,
  actorEmail = null,
  action,
  entity = null,
  entityId = null,
  details = null,
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        actorRole,
        actorEmail,
        action,
        entity,
        entityId: entityId != null ? String(entityId) : null,
        details,
      },
    });
  } catch (error) {
    console.error("Audit log write failed:", error.message);
  }
}
