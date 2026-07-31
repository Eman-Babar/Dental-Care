import { sendEmail } from "../config/nodemailer.js";
import { buildBrandedEmail } from "./emailTemplates.js";
import { getClientUrl } from "./brand.js";

function visitSummary(appointment) {
  const when = `${new Date(appointment.appointmentDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })} at ${appointment.appointmentTime}`;
  return {
    when,
    patientName: appointment.patient?.name || "Patient",
    patientEmail: appointment.patient?.email,
    service: appointment.service?.title || "Dental visit",
    doctor: appointment.doctor?.name || "To be assigned",
    problem: appointment.currentProblem || "—",
  };
}

/**
 * Email the patient when their appointment status changes.
 */
export async function notifyPatientStatusChange(appointment, status) {
  const { when, patientName, patientEmail, service, doctor, problem } =
    visitSummary(appointment);

  if (!patientEmail) {
    console.warn("Patient email missing — skipping status notification.");
    return { success: false, error: "Patient email missing" };
  }

  let title;
  let intro;
  let rows;

  switch (status) {
    case "APPROVED":
      title = "Appointment confirmed";
      intro = `Hello ${patientName}, good news — your appointment request has been approved. Please arrive a few minutes early.`;
      rows = [
        { label: "Service", value: service },
        { label: "Doctor", value: doctor },
        { label: "Date & time", value: when },
        { label: "Reason", value: problem },
      ];
      break;

    case "REJECTED":
      title = "Appointment update";
      intro = `Hello ${patientName}, we could not confirm your requested appointment at this time.`;
      rows = [
        { label: "Service", value: service },
        { label: "Requested", value: when },
        {
          label: "Note",
          value:
            appointment.rejectionReason ||
            "Please contact the clinic or submit a new request with a different date.",
        },
      ];
      break;

    case "COMPLETED":
      title = "Thanks for visiting";
      intro = `Hello ${patientName}, your recent appointment has been marked as completed. We hope to see you again — and we'd love a short review when you have a moment.`;
      rows = [
        { label: "Service", value: service },
        { label: "Doctor", value: doctor },
        { label: "Visit", value: when },
      ];
      break;

    default:
      return { success: false, error: `No patient email for status: ${status}` };
  }

  const reviewUrl =
    status === "COMPLETED"
      ? `${getClientUrl()}/patient/reviews`
      : `${getClientUrl()}/login`;

  const { brand, html, text } = await buildBrandedEmail({
    title,
    intro,
    rows,
    cta: {
      label: status === "COMPLETED" ? "Leave a review" : "Open patient portal",
      url: reviewUrl,
    },
    footerNote: `Questions? Reply to this email or contact ${brand}.`,
  });

  const result = await sendEmail({
    to: patientEmail,
    subject: `${title} — ${brand}`,
    text,
    html,
  });

  if (!result.success) {
    console.error(`Patient email (${status}) failed:`, result.error);
  } else {
    console.log(`Patient notified (${status}) → ${patientEmail}`);
  }

  return result;
}

export async function notifyClinicNewRequest(appointment) {
  const clinicEmail =
    process.env.CLINIC_EMAIL ||
    process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ||
    process.env.EMAIL_USER;

  if (!clinicEmail) {
    console.warn("CLINIC_EMAIL not set — skipping clinic notification email.");
    return { success: false, error: "CLINIC_EMAIL not set" };
  }

  const when = `${new Date(appointment.appointmentDate).toLocaleDateString("en-GB")} at ${appointment.appointmentTime}`;

  const { brand, html, text } = await buildBrandedEmail({
    title: `New appointment request #${appointment.id}`,
    intro: "A new appointment request was submitted on the website.",
    rows: [
      { label: "Patient", value: appointment.patient?.name || "—" },
      { label: "Email", value: appointment.patient?.email || "—" },
      { label: "Phone", value: appointment.patient?.phone || "—" },
      { label: "Service", value: appointment.service?.title || "—" },
      { label: "Doctor", value: appointment.doctor?.name || "Unassigned" },
      { label: "When", value: when },
      { label: "Problem", value: appointment.currentProblem || "—" },
      { label: "Status", value: appointment.status },
      {
        label: "Submitted",
        value: new Date(appointment.createdAt).toLocaleString(),
      },
    ],
    cta: {
      label: "Open admin appointments",
      url: `${getClientUrl()}/admin/appointments`,
    },
  });

  const result = await sendEmail({
    to: clinicEmail,
    subject: `New appointment request #${appointment.id} — ${brand}`,
    text,
    html,
  });

  if (!result.success) {
    console.error("Clinic notification failed:", result.error);
  }
  return result;
}

function clinicInbox() {
  return (
    process.env.CLINIC_EMAIL ||
    process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ||
    process.env.EMAIL_USER ||
    null
  );
}

/**
 * Notify clinic when a patient cancels or reschedules.
 */
export async function notifyClinicPatientChange(appointment, kind) {
  const clinicEmail = clinicInbox();
  if (!clinicEmail) {
    return { success: false, error: "CLINIC_EMAIL not set" };
  }

  const when = `${new Date(appointment.appointmentDate).toLocaleDateString("en-GB")} at ${appointment.appointmentTime}`;
  const isCancel = kind === "CANCELLED";
  const title = isCancel
    ? `Patient cancelled #${appointment.id}`
    : `Patient rescheduled #${appointment.id}`;
  const intro = isCancel
    ? "A patient cancelled an upcoming appointment."
    : "A patient requested a new date/time — review and confirm in admin.";

  const rows = [
    { label: "Patient", value: appointment.patient?.name || "—" },
    { label: "Email", value: appointment.patient?.email || "—" },
    { label: "Phone", value: appointment.patient?.phone || "—" },
    { label: "Service", value: appointment.service?.title || "—" },
    { label: "Doctor", value: appointment.doctor?.name || "Unassigned" },
    { label: "When", value: when },
    { label: "Status", value: appointment.status },
  ];

  if (isCancel && appointment.cancellationReason) {
    rows.push({ label: "Reason", value: appointment.cancellationReason });
  }

  const { brand, html, text } = await buildBrandedEmail({
    title,
    intro,
    rows,
    cta: {
      label: "Open admin appointments",
      url: `${getClientUrl()}/admin/appointments`,
    },
  });

  const result = await sendEmail({
    to: clinicEmail,
    subject: `${title} — ${brand}`,
    text,
    html,
  });

  if (!result.success) {
    console.error(`Clinic ${kind} notify failed:`, result.error);
  }
  return result;
}
