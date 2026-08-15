import prisma from "../config/prisma.js";
import { toDateOnly, formatDateOnly } from "../utils/doctorAvailability.js";

export async function listMyLeaves(req, res) {
  try {
    const from = req.query.from
      ? toDateOnly(String(req.query.from))
      : toDateOnly(new Date());
    const leaves = await prisma.doctorLeave.findMany({
      where: {
        doctorId: req.user.id,
        date: { gte: from },
      },
      orderBy: { date: "asc" },
    });
    return res.json({
      success: true,
      leaves: leaves.map((l) => ({
        ...l,
        date: formatDateOnly(l.date),
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createMyLeave(req, res) {
  try {
    const dateStr = String(req.body.date || "").trim();
    const reason = req.body.reason ? String(req.body.reason).trim() : null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ message: "date (YYYY-MM-DD) is required." });
    }

    const leave = await prisma.doctorLeave.upsert({
      where: {
        doctorId_date: {
          doctorId: req.user.id,
          date: toDateOnly(dateStr),
        },
      },
      create: {
        doctorId: req.user.id,
        date: toDateOnly(dateStr),
        reason,
      },
      update: { reason },
    });

    return res.status(201).json({
      success: true,
      message: "Leave day saved. Online booking is blocked for this date.",
      leave: { ...leave, date: formatDateOnly(leave.date) },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteMyLeave(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.doctorLeave.findFirst({
      where: { id, doctorId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ message: "Leave not found." });
    }
    await prisma.doctorLeave.delete({ where: { id } });
    return res.json({ success: true, message: "Leave removed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/** Admin: list leaves for a doctor */
export async function listDoctorLeavesAdmin(req, res) {
  try {
    const doctorId = Number(req.params.doctorId);
    const leaves = await prisma.doctorLeave.findMany({
      where: { doctorId, date: { gte: toDateOnly(new Date()) } },
      orderBy: { date: "asc" },
    });
    return res.json({
      success: true,
      leaves: leaves.map((l) => ({ ...l, date: formatDateOnly(l.date) })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
