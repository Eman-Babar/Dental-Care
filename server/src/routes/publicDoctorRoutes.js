import express from "express";
import prisma from "../config/prisma.js";
import { getDoctorAvailableSlots } from "../controllers/slotController.js";

const router = express.Router();

// Available slots for a doctor on a specific date
router.get("/:id/slots", getDoctorAvailableSlots);

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
