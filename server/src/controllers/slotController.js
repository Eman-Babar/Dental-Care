import prisma from "../config/prisma.js";
import {
  getDoctorSlotsForDate,
  filterSlotsAgainstBookings,
  formatDateOnly,
  toDateOnly,
  SLOT_MINUTES,
} from "../utils/doctorAvailability.js";

function toLocalDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toLocalTimeInput(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export async function getDoctorAvailableSlots(req, res) {
  try {
    const doctorId = Number(req.params.id);
    const date = String(req.query.date || "").trim();
    const serviceId = req.query.serviceId ? Number(req.query.serviceId) : null;

    if (!doctorId || !date) {
      return res.status(400).json({ message: "Doctor id and date are required." });
    }

    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, role: "DOCTOR" },
      include: { doctorProfile: true },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    const leave = await prisma.doctorLeave.findUnique({
      where: {
        doctorId_date: {
          doctorId,
          date: toDateOnly(date),
        },
      },
    });

    let durationMinutes = SLOT_MINUTES;
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { duration: true },
      });
      if (service?.duration) durationMinutes = service.duration;
    }

    const schedule = getDoctorSlotsForDate(doctor.doctorProfile?.availability, date, {
      durationMinutes,
      onLeave: Boolean(leave),
    });

    if (!schedule.slots.length) {
      return res.json({
        success: true,
        date,
        dayKey: schedule.dayKey,
        slots: [],
        booked: [],
        breaks: schedule.breaks || [],
        onLeave: Boolean(leave),
        leaveReason: leave?.reason || null,
        durationMinutes,
        message: schedule.message || "Doctor is not available on this day.",
      });
    }

    const bookedRows = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: toDateOnly(date),
        status: { in: ["PENDING", "APPROVED"] },
      },
      select: { appointmentTime: true },
    });
    const booked = bookedRows.map((row) => row.appointmentTime);

    let slots = filterSlotsAgainstBookings(
      schedule.slots,
      booked,
      durationMinutes
    );

    const today = toLocalDateInput(new Date());
    if (date === today) {
      const minTime = toLocalTimeInput(new Date());
      slots = slots.filter((slot) => slot >= minTime);
    }

    return res.json({
      success: true,
      date,
      dayKey: schedule.dayKey,
      slots,
      booked,
      breaks: schedule.breaks || [],
      onLeave: false,
      durationMinutes,
      schedule: {
        start: schedule.start,
        end: schedule.end,
      },
      message: slots.length
        ? null
        : "All slots are booked or unavailable for this day.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
