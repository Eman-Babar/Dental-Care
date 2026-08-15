import prisma from "../config/prisma.js";
import {
  isSlotInDoctorSchedule,
  SLOT_MINUTES,
  formatDateOnly,
  toDateOnly,
} from "./doctorAvailability.js";

const CLINIC_OPEN_HOUR = 9;
const CLINIC_CLOSE_HOUR = 17;

export async function validateAppointmentSlot({
  doctorId,
  appointmentDate,
  appointmentTime,
  excludeAppointmentId,
  serviceId,
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

  const dateStr = formatDateOnly(appointmentDate);
  const leave = await prisma.doctorLeave.findUnique({
    where: {
      doctorId_date: {
        doctorId: Number(doctorId),
        date: toDateOnly(dateStr),
      },
    },
  });

  if (leave) {
    return { ok: false, message: "Doctor is on leave on this date." };
  }

  let durationMinutes = SLOT_MINUTES;
  if (serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
      select: { duration: true },
    });
    if (service?.duration) durationMinutes = service.duration;
  }

  if (
    !isSlotInDoctorSchedule(
      doctor.doctorProfile?.availability,
      dateStr,
      appointmentTime,
      { durationMinutes, onLeave: false }
    )
  ) {
    return {
      ok: false,
      message:
        "This time is outside the doctor's available schedule for that day (hours/breaks).",
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

  // Block overlapping appointments for this doctor
  const dayStart = toDateOnly(dateStr);
  const existing = await prisma.appointment.findMany({
    where: {
      doctorId: Number(doctorId),
      appointmentDate: dayStart,
      status: { in: ["PENDING", "APPROVED"] },
      ...(excludeAppointmentId
        ? { id: { not: Number(excludeAppointmentId) } }
        : {}),
    },
    select: { appointmentTime: true },
  });

  const start = hours * 60 + minutes;
  const end = start + Math.max(durationMinutes, SLOT_MINUTES);
  for (const row of existing) {
    const [bh, bm] = String(row.appointmentTime).split(":").map(Number);
    if (Number.isNaN(bh)) continue;
    const bookedStart = bh * 60 + (bm || 0);
    const bookedEnd = bookedStart + SLOT_MINUTES;
    if (start < bookedEnd && end > bookedStart) {
      return {
        ok: false,
        message:
          "This doctor already has an appointment overlapping this time. Please choose another slot.",
      };
    }
  }

  // Clinic closed dates from CMS
  try {
    const closedRow = await prisma.siteContent.findUnique({
      where: { key: "clinic.closedDates" },
    });
    if (closedRow?.value) {
      const closed = JSON.parse(closedRow.value);
      if (Array.isArray(closed) && closed.includes(dateStr)) {
        return {
          ok: false,
          message: "The clinic is closed on this date. Please choose another day.",
        };
      }
    }
  } catch {
    // ignore invalid CMS JSON
  }

  return { ok: true };
}
