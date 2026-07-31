import prisma from "../config/prisma.js";

function isTruthy(value) {
  return ["true", "1", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

/**
 * CMS-driven site maintenance. When enabled, public booking should be blocked.
 */
export async function getMaintenanceState() {
  try {
    const rows = await prisma.siteContent.findMany({
      where: {
        key: { in: ["site.maintenance", "site.maintenance_message"] },
      },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const enabled = isTruthy(map["site.maintenance"]);
    return {
      enabled,
      message:
        map["site.maintenance_message"]?.trim() ||
        "Online booking is temporarily paused. Please call or WhatsApp the clinic.",
    };
  } catch {
    return { enabled: false, message: "" };
  }
}
