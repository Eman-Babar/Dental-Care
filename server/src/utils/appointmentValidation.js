import prisma from "../config/prisma.js";
import {
  isSlotInDoctorSchedule,
  SLOT_MINUTES,
} from "./doctorAvailability.js";

const CLINIC_OPEN_HOUR = 9;
const CLINIC_CLOSE_HOUR = 17;

export async function validateAppointmentSlot({
  doctorId,
  appointmentDate,
  appointmentTime,
  excludeAppointmentId,
}) {
  const timeParts = String(appointmentTime).split(":");
  const hours = Number(timeParts[0]);
  const minutes = Number(timeParts[1] || 0);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return { ok: false, message: "Invalid appointment time." };
  }

  if (hours < CLINIC_OPEN_HOUR) {
    return { ok: false, message: "Clinic booking starts from 9:00 AM." };
  }

  if (hours > CLINIC_CLOSE_HOUR || (hours === CLINIC_CLOSE_HOUR && minutes > 0)) {
    return {
      ok: false,
      message: "Clinic booking time is only allowed until 5:00 PM.",
    };
  }

  if (minutes % SLOT_MINUTES !== 0) {
    return {
      ok: false,
      message: "Appointments are available in fixed 30-minute slots only.",
    };
  }

  const doctor = await prisma.user.findFirst({
    where: { id: Number(doctorId), role: "DOCTOR" },
    include: { doctorProfile: true },
  });

  if (!doctor) {
    return { ok: false, message: "Doctor not found." };
  }

  if (
    !isSlotInDoctorSchedule(
      doctor.doctorProfile?.availability,
      appointmentDate,
      appointmentTime
    )
  ) {
    return {
      ok: false,
      message: "This time is outside the doctor's available schedule for that day.",
    };
  }

  const appointmentDateTime = new Date(appointmentDate);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  if (Number.isNaN(appointmentDateTime.getTime())) {
    return { ok: false, message: "Invalid appointment date." };
  }

  if (appointmentDateTime.getTime() <= Date.now()) {
    return {
      ok: false,
      message: "You cannot book an appointment for a past date or time.",
    };
  }

  const existingSlot = await prisma.appointment.findFirst({
    where: {
      doctorId: Number(doctorId),
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { in: ["PENDING", "APPROVED"] },
      ...(excludeAppointmentId
        ? { id: { not: Number(excludeAppointmentId) } }
        : {}),
    },
  });

  if (existingSlot) {
    return {
      ok: false,
      message:
        "This doctor already has an appointment at this time. Please choose another slot.",
    };
  }

  return { ok: true };
}
