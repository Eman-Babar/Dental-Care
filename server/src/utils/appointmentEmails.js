import { sendEmail } from "../config/nodemailer.js";

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

  let subject;
  let text;

  switch (status) {
    case "APPROVED":
      subject = "Your DentalCare appointment is confirmed";
      text = [
        `Hello ${patientName},`,
        "",
        "Good news — your appointment request has been approved.",
        "",
        `Service: ${service}`,
        `Doctor: ${doctor}`,
        `Date & time: ${when}`,
        `Reason for visit: ${problem}`,
        "",
        "Please arrive a few minutes early. If you need to reschedule, contact the clinic.",
        "",
        "— DentalCare Clinic",
      ].join("\n");
      break;

    case "REJECTED":
      subject = "Update on your DentalCare appointment request";
      text = [
        `Hello ${patientName},`,
        "",
        "We could not confirm your requested appointment at this time.",
        "",
        `Service: ${service}`,
        `Requested: ${when}`,
        appointment.rejectionReason
          ? `Note: ${appointment.rejectionReason}`
          : "Please contact the clinic or submit a new request with a different date.",
        "",
        "— DentalCare Clinic",
      ].join("\n");
      break;

    case "COMPLETED":
      subject = "Thank you for visiting DentalCare";
      text = [
        `Hello ${patientName},`,
        "",
        "Your recent appointment has been marked as completed.",
        "",
        `Service: ${service}`,
        `Doctor: ${doctor}`,
        `Visit: ${when}`,
        "",
        "We hope to see you again. Leave a review from your patient dashboard if you would like.",
        "",
        "— DentalCare Clinic",
      ].join("\n");
      break;

    default:
      return { success: false, error: `No patient email for status: ${status}` };
  }

  const result = await sendEmail({
    to: patientEmail,
    subject,
    text,
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap;line-height:1.5">${text}</pre>`,
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
  const subject = `New appointment request #${appointment.id}`;
  const text = [
    "A new appointment request was submitted on DentalCare.",
    "",
    `Patient: ${appointment.patient?.name || "—"}`,
    `Email: ${appointment.patient?.email || "—"}`,
    `Phone: ${appointment.patient?.phone || "—"}`,
    `Service: ${appointment.service?.title || "—"}`,
    `Doctor: ${appointment.doctor?.name || "Unassigned"}`,
    `When: ${when}`,
    `Problem: ${appointment.currentProblem}`,
    `Status: ${appointment.status}`,
    `Submitted: ${new Date(appointment.createdAt).toLocaleString()}`,
  ].join("\n");

  const result = await sendEmail({
    to: clinicEmail,
    subject,
    text,
    html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${text}</pre>`,
  });

  if (!result.success) {
    console.error("Clinic notification failed:", result.error);
  }
  return result;
}
