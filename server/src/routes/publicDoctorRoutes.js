import express from "express";
import prisma from "../config/prisma.js";
import {
  getDoctorSlotsForDate,
} from "../utils/doctorAvailability.js";

const router = express.Router();

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

// Available slots for a doctor on a specific date
router.get("/:id/slots", async (req, res) => {
  try {
    const doctorId = Number(req.params.id);
    const date = String(req.query.date || "").trim();

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

    const schedule = getDoctorSlotsForDate(
      doctor.doctorProfile?.availability,
      date
    );

    if (!schedule.slots.length) {
      return res.json({
        success: true,
        date,
        dayKey: schedule.dayKey,
        slots: [],
        booked: [],
        message:
          schedule.message || "Doctor is not available on this day.",
      });
    }

    const bookedRows = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: new Date(date),
        status: { in: ["PENDING", "APPROVED"] },
      },
      select: { appointmentTime: true },
    });
    const booked = bookedRows.map((row) => row.appointmentTime);

    let slots = schedule.slots.filter((slot) => !booked.includes(slot));

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
});

// Public list of doctors for booking forms
router.get("/", async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        doctorProfile: {
          select: {
            specialization: true,
            qualification: true,
            experience: true,
            bio: true,
            workingDays: true,
            workingHours: true,
            availability: true,
            services: {
              select: {
                id: true,
                title: true,
                duration: true,
                price: true,
                isGlobal: true,
              },
              orderBy: { title: "asc" },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return res.json({ success: true, count: doctors.length, doctors });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
