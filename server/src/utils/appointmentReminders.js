import { buildBrandedEmail } from "./emailTemplates.js";
import { sendEmail } from "../config/nodemailer.js";
import { getClientUrl } from "./brand.js";
import prisma from "../config/prisma.js";

function visitWhen(appointment) {
  return `${new Date(appointment.appointmentDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })} at ${appointment.appointmentTime}`;
}

export function buildWhatsAppReminderUrl(appointment, whatsappDigits) {
  if (!whatsappDigits) return null;
  const when = visitWhen(appointment);
  const text = [
    `Hi ${appointment.patient?.name || "there"},`,
    `Reminder: your dental appointment is on ${when}.`,
    `Service: ${appointment.service?.title || "Visit"}`,
    appointment.doctor?.name ? `Doctor: ${appointment.doctor.name}` : null,
    "Please arrive a few minutes early.",
  ]
    .filter(Boolean)
    .join("\n");
  return `https://wa.me/${String(whatsappDigits).replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/**
 * Send branded email reminder for an approved appointment.
 */
export async function sendAppointmentReminder(appointment) {
  const email = appointment.patient?.email;
  if (!email) {
    return { success: false, error: "Patient email missing" };
  }

  const when = visitWhen(appointment);
  const { brand, html, text } = await buildBrandedEmail({
    title: "Appointment reminder",
    intro: `Hello ${appointment.patient?.name || "there"}, this is a friendly reminder about your upcoming visit.`,
    rows: [
      { label: "When", value: when },
      { label: "Service", value: appointment.service?.title || "Dental visit" },
      { label: "Doctor", value: appointment.doctor?.name || "To be assigned" },
      {
        label: "Payment",
        value: formatPaymentLabel(appointment),
      },
    ],
    cta: {
      label: "View my appointments",
      url: `${getClientUrl()}/login`,
    },
    footerNote: "Need to reschedule? Sign in to your patient portal or WhatsApp the clinic.",
  });

  const result = await sendEmail({
    to: email,
    subject: `Reminder: your ${brand} visit on ${when}`,
    text,
    html,
  });

  if (result.success) {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { reminderSentAt: new Date() },
    });
  }

  return result;
}

export function formatPaymentLabel(appointment) {
  const status = appointment.paymentStatus || "UNPAID";
  const deposit = appointment.depositAmount;
  const paid = appointment.amountPaid;
  const bits = [status.replace(/_/g, " ")];
  if (deposit != null) bits.push(`deposit Rs ${deposit}`);
  if (paid != null && paid > 0) bits.push(`paid Rs ${paid}`);
  return bits.join(" · ");
}

/**
 * Find APPROVED visits in the next ~24 hours that haven't been reminded.
 */
export async function runDueReminders() {
  const now = new Date();
  const inAboutADay = new Date(now.getTime() + 26 * 60 * 60 * 1000);
  const soonWindowStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const due = await prisma.appointment.findMany({
    where: {
      status: "APPROVED",
      reminderSentAt: null,
      appointmentDate: {
        gte: new Date(now.toDateString()),
        lte: inAboutADay,
      },
    },
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
      doctor: { select: { id: true, name: true } },
      service: true,
    },
    take: 50,
  });

  let sent = 0;
  for (const appt of due) {
    // Combine date + time roughly: skip if visit already passed today
    const [h, m] = String(appt.appointmentTime || "09:00")
      .split(":")
      .map(Number);
    const visitAt = new Date(appt.appointmentDate);
    visitAt.setHours(h || 9, m || 0, 0, 0);
    if (visitAt < soonWindowStart || visitAt > inAboutADay) continue;

    const result = await sendAppointmentReminder(appt);
    if (result.success) sent += 1;
  }

  if (sent > 0) {
    console.log(`Reminders sent: ${sent}`);
  }
  return { checked: due.length, sent };
}

/** Suggested deposit = 20% of service price (rounded), or null if no price */
export function suggestDeposit(servicePrice) {
  if (servicePrice == null || Number.isNaN(Number(servicePrice))) return null;
  return Math.round(Number(servicePrice) * 0.2);
}
