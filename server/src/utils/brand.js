import prisma from "../config/prisma.js";

const FALLBACK_BRAND = "DentalCare";

/** Clinic display name from CMS (SiteContent), with safe fallback. */
export async function getClinicBrand() {
  try {
    const row = await prisma.siteContent.findUnique({
      where: { key: "home.brand" },
    });
    const name = row?.value?.trim();
    return name || FALLBACK_BRAND;
  } catch {
    return FALLBACK_BRAND;
  }
}

export function getClientUrl() {
  return (
    process.env.CLIENT_URL?.replace(/\/$/, "") ||
    "http://localhost:5173"
  );
}
