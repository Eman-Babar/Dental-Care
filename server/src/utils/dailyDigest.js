import prisma from "../config/prisma.js";
import { sendEmail } from "../config/nodemailer.js";
import { buildBrandedEmail } from "../utils/emailTemplates.js";
import { getClientUrl, getClinicBrand } from "../utils/brand.js";

/**
 * Morning clinic digest: pending visits + payment claims to verify.
 */
export async function sendDailyClinicDigest() {
  const clinicEmail =
    process.env.CLINIC_EMAIL ||
    process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ||
    process.env.EMAIL_USER;

  if (!clinicEmail) {
    console.warn("Daily digest skipped: CLINIC_EMAIL not set");
    return { success: false, error: "CLINIC_EMAIL not set" };
  }

  const brand = await getClinicBrand();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const [pending, upcoming, claims] = await Promise.all([
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.appointment.findMany({
      where: {
        status: "APPROVED",
        appointmentDate: { gte: today, lte: in7Days },
      },
      include: {
        patient: { select: { name: true, phone: true } },
        service: { select: { title: true } },
        doctor: { select: { name: true } },
      },
      orderBy: { appointmentDate: "asc" },
      take: 15,
    }),
    prisma.appointment.findMany({
      where: {
        paymentClaimedAt: { not: null },
        paymentStatus: { in: ["UNPAID", "DEPOSIT_DUE"] },
      },
      include: {
        patient: { select: { name: true, email: true } },
        service: { select: { title: true } },
      },
      take: 20,
    }),
  ]);

  const upcomingLines = upcoming.length
    ? upcoming
        .map(
          (a) =>
            `${new Date(a.appointmentDate).toLocaleDateString("en-GB")} ${a.appointmentTime} — ${a.patient?.name} · ${a.service?.title}${a.doctor?.name ? ` · ${a.doctor.name}` : ""}`
        )
        .join("\n")
    : "None in the next 7 days.";

  const claimLines = claims.length
    ? claims
        .map(
          (a) =>
            `#${a.id} ${a.patient?.name} — ${a.service?.title} (deposit Rs ${a.depositAmount ?? "—"})`
        )
        .join("\n")
    : "No payment claims waiting.";

  const { html, text } = await buildBrandedEmail({
    title: "Daily clinic digest",
    intro: `Good morning. Here is your ${brand} snapshot for today.`,
    rows: [
      { label: "Pending requests", value: String(pending) },
      { label: "Payment claims", value: String(claims.length) },
      { label: "Upcoming (7 days)", value: upcomingLines },
      { label: "Claims detail", value: claimLines },
    ],
    cta: {
      label: "Open admin dashboard",
      url: `${getClientUrl()}/admin`,
    },
  });

  const result = await sendEmail({
    to: clinicEmail,
    subject: `${brand} daily digest — ${pending} pending, ${claims.length} claims`,
    text,
    html,
  });

  if (result.success) {
    console.log(`Daily digest sent → ${clinicEmail}`);
  } else {
    console.error("Daily digest email failed:", result.error);
  }
  return result;
}
