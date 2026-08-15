import prisma from "../config/prisma.js";
import { toDateOnly, formatDateOnly } from "../utils/doctorAvailability.js";

const ACTIVE = ["WAITING", "CALLED", "IN_PROGRESS"];

function tokenLabel(tokenNo) {
  return `T-${String(tokenNo).padStart(3, "0")}`;
}

function serializeTicket(t) {
  return {
    ...t,
    date: formatDateOnly(t.date),
    tokenLabel: tokenLabel(t.tokenNo),
  };
}

async function nextTokenNo(date) {
  const last = await prisma.ticket.findFirst({
    where: { date },
    orderBy: { tokenNo: "desc" },
    select: { tokenNo: true },
  });
  return (last?.tokenNo || 0) + 1;
}

/** Admin / reception: issue a walk-in ticket */
export async function createTicket(req, res) {
  try {
    const patientName = String(req.body.patientName || "").trim();
    const phone = req.body.phone ? String(req.body.phone).trim() : null;
    const notes = req.body.notes ? String(req.body.notes).trim() : null;
    const doctorId = req.body.doctorId ? Number(req.body.doctorId) : null;
    const serviceId = req.body.serviceId ? Number(req.body.serviceId) : null;
    const dateStr = req.body.date
      ? String(req.body.date).trim()
      : formatDateOnly(new Date());

    if (!patientName) {
      return res.status(400).json({ message: "Patient name is required." });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ message: "Invalid date." });
    }

    if (doctorId) {
      const doctor = await prisma.user.findFirst({
        where: { id: doctorId, role: "DOCTOR" },
      });
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found." });
      }
    }

    const date = toDateOnly(dateStr);
    const tokenNo = await nextTokenNo(date);

    const ticket = await prisma.ticket.create({
      data: {
        tokenNo,
        date,
        patientName,
        phone,
        notes,
        doctorId,
        serviceId,
        status: "WAITING",
      },
      include: {
        doctor: { select: { id: true, name: true } },
        service: { select: { id: true, title: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Ticket ${tokenLabel(tokenNo)} issued.`,
      ticket: serializeTicket(ticket),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/** List tickets for a date (admin all, or filter by doctor) */
export async function listTickets(req, res) {
  try {
    const dateStr = req.query.date
      ? String(req.query.date).trim()
      : formatDateOnly(new Date());
    const doctorId = req.query.doctorId ? Number(req.query.doctorId) : null;

    const tickets = await prisma.ticket.findMany({
      where: {
        date: toDateOnly(dateStr),
        ...(doctorId ? { doctorId } : {}),
      },
      include: {
        doctor: { select: { id: true, name: true } },
        service: { select: { id: true, title: true } },
      },
      orderBy: [{ tokenNo: "asc" }],
    });

    return res.json({
      success: true,
      date: dateStr,
      tickets: tickets.map(serializeTicket),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/** Doctor: today's queue for me (+ unassigned walk-ins) */
export async function listMyQueue(req, res) {
  try {
    const doctorId = Number(req.user?.id);
    if (!doctorId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    const dateStr = req.query.date
      ? String(req.query.date).trim()
      : formatDateOnly(new Date());

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ message: "Invalid date." });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        date: toDateOnly(dateStr),
        status: { notIn: ["CANCELLED"] },
        OR: [{ doctorId }, { doctorId: null }],
      },
      include: {
        service: { select: { id: true, title: true } },
        doctor: { select: { id: true, name: true } },
      },
      orderBy: [{ tokenNo: "asc" }],
    });

    return res.json({
      success: true,
      date: dateStr,
      waiting: tickets.filter((t) => t.status === "WAITING").length,
      tickets: tickets.map(serializeTicket),
    });
  } catch (error) {
    console.error("listMyQueue error:", error);
    return res.status(500).json({
      message: error.message || "Could not load queue",
    });
  }
}

export async function updateTicketStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || "").toUpperCase();
    const allowed = [
      "WAITING",
      "CALLED",
      "IN_PROGRESS",
      "DONE",
      "SKIPPED",
      "CANCELLED",
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Use: ${allowed.join(", ")}`,
      });
    }

    const existing = await prisma.ticket.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    const data = { status };
    if (status === "CALLED") data.calledAt = new Date();
    if (status === "IN_PROGRESS") data.startedAt = new Date();
    if (status === "DONE" || status === "SKIPPED") {
      data.completedAt = new Date();
    }

    // Doctors may update their tickets or claim unassigned ones
    if (req.user.role === "DOCTOR") {
      const doctorId = Number(req.user.id);
      if (existing.doctorId && existing.doctorId !== doctorId) {
        return res.status(403).json({ message: "Not your ticket." });
      }
      if (!existing.doctorId) {
        data.doctorId = doctorId;
      }
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        doctor: { select: { id: true, name: true } },
        service: { select: { id: true, title: true } },
      },
    });

    return res.json({
      success: true,
      message: `Ticket ${tokenLabel(ticket.tokenNo)} → ${status}`,
      ticket: serializeTicket(ticket),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/** Doctor: call next WAITING ticket */
export async function callNextTicket(req, res) {
  try {
    const doctorId = Number(req.user?.id);
    if (!doctorId) {
      return res.status(401).json({ message: "Not authorized." });
    }

    const dateStr = formatDateOnly(new Date());
    const day = toDateOnly(dateStr);

    // Prefer this doctor's waiting tickets, then unassigned
    let next = await prisma.ticket.findFirst({
      where: {
        date: day,
        doctorId,
        status: "WAITING",
      },
      orderBy: { tokenNo: "asc" },
    });

    if (!next) {
      next = await prisma.ticket.findFirst({
        where: {
          date: day,
          doctorId: null,
          status: "WAITING",
        },
        orderBy: { tokenNo: "asc" },
      });
    }

    if (!next) {
      return res.status(404).json({ message: "No waiting tickets in your queue." });
    }

    const ticket = await prisma.ticket.update({
      where: { id: next.id },
      data: {
        status: "CALLED",
        calledAt: new Date(),
        doctorId: next.doctorId || doctorId,
      },
      include: {
        doctor: { select: { id: true, name: true } },
        service: { select: { id: true, title: true } },
      },
    });

    return res.json({
      success: true,
      message: `Now calling ${tokenLabel(ticket.tokenNo)}`,
      ticket: serializeTicket(ticket),
    });
  } catch (error) {
    console.error("callNextTicket error:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
}

/** Public TV board */
export async function getQueueDisplay(req, res) {
  try {
    const dateStr = formatDateOnly(new Date());
    const doctorId = req.query.doctorId ? Number(req.query.doctorId) : null;

    const tickets = await prisma.ticket.findMany({
      where: {
        date: toDateOnly(dateStr),
        ...(doctorId ? { doctorId } : {}),
        status: { in: ACTIVE },
      },
      include: {
        doctor: { select: { id: true, name: true } },
        service: { select: { id: true, title: true } },
      },
      orderBy: [{ tokenNo: "asc" }],
    });

    const nowServing = tickets.filter((t) =>
      ["CALLED", "IN_PROGRESS"].includes(t.status)
    );
    const waiting = tickets.filter((t) => t.status === "WAITING");

    return res.json({
      success: true,
      date: dateStr,
      nowServing: nowServing.map(serializeTicket),
      waiting: waiting.map(serializeTicket),
      waitingCount: waiting.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
