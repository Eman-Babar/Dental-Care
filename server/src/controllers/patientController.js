import prisma from "../config/prisma.js";
import { writeAuditLog } from "../utils/auditLog.js";
import { validateAppointmentSlot } from "../utils/appointmentValidation.js";
import { notifyClinicPatientChange } from "../utils/appointmentEmails.js";
// @desc Patient Dashboard
// @route GET /api/patient/dashboard
// @access Private (PATIENT)
export const patientDashboard = async (req, res) => {
  try {

    const totalAppointments = await prisma.appointment.count({
      where: {
        patientId: req.user.id,
      },
    });

    const pendingAppointments = await prisma.appointment.count({
      where: {
        patientId: req.user.id,
        status: "PENDING",
      },
    });

    const approvedAppointments = await prisma.appointment.count({
      where: {
        patientId: req.user.id,
        status: "APPROVED",
      },
    });

    const completedAppointments = await prisma.appointment.count({
      where: {
        patientId: req.user.id,
        status: "COMPLETED",
      },
    });

    return res.json({
      success: true,
      dashboard: {
        totalAppointments,
        pendingAppointments,
        approvedAppointments,
        completedAppointments,
      },
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Internal server error",
    });

  }
};
export const getMyProfile = async (req, res) => {

  try {

    const patient = await prisma.user.findUnique({

      where: {
        id: req.user.id,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
      },
    });
    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
export const updateMyProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const image = req.file
      ? `/uploads/${req.file.filename}`
      : undefined;
    const updated = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        name,
        phone,
        ...(image && { image }),
      },
    });
    res.json({
      success: true,
      patient: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
// @desc Get My Appointments
// @route GET /api/patient/appointments
export const getMyAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                patientId: req.user.id
            },
            include: {
                doctor: {
                    include: {
                        doctorProfile: true
                    }
                },
                service: true
            },
            orderBy: {
                appointmentDate: "desc"
            }
        });
        return res.json({
            success: true,
            count: appointments.length,
            appointments
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};
export const upcomingAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                patientId: req.user.id,
                status: {
                    in: ["PENDING", "APPROVED"],
                },
            },
            include: {
                doctor: {
                    include: { doctorProfile: true },
                },
                service: true,
            },
            orderBy: {
                appointmentDate: "asc",
            },
        });
        return res.json({
            success: true,
            appointments,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
export const appointmentHistory = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                patientId: req.user.id,
                status: {
                    in: ["COMPLETED", "CANCELLED", "REJECTED"],
                },
            },
            include: {
                doctor: {
                    include: { doctorProfile: true },
                },
                service: true,
            },
            orderBy: {
                appointmentDate: "desc",
            },
        });
        return res.json({
            success: true,
            appointments,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const cancelMyAppointment = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { cancellationReason } = req.body;

    if (!cancellationReason?.trim()) {
      return res.status(400).json({
        message: "Please provide a reason for cancellation.",
      });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId: req.user.id,
        status: { in: ["PENDING", "APPROVED"] },
      }
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Active appointment not found.",
      });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        cancellationReason: cancellationReason.trim(),
      },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        doctor: { select: { id: true, name: true, email: true } },
        service: true,
      },
    });

    await writeAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: "APPOINTMENT_CANCELLED_BY_PATIENT",
      entity: "Appointment",
      entityId: updated.id,
      details: `Patient cancelled: ${updated.service?.title || "appointment"}`,
    });

    notifyClinicPatientChange(updated, "CANCELLED").catch((err) =>
      console.error("Cancel notify failed:", err.message || err)
    );

    return res.json({
      success: true,
      message: "Appointment cancelled successfully.",
      appointment: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const rescheduleMyAppointment = async (req, res) => {
  try {
    const appointmentId = Number(req.params.id);
    const { appointmentDate, appointmentTime } = req.body;

    if (!appointmentDate || !appointmentTime) {
      return res.status(400).json({
        message: "New date and time are required.",
      });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        patientId: req.user.id,
        status: { in: ["PENDING", "APPROVED"] },
      }
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Active appointment not found.",
      });
    }

    const slotCheck = await validateAppointmentSlot({
      doctorId: appointment.doctorId,
      appointmentDate,
      appointmentTime,
      excludeAppointmentId: appointment.id,
    });

    if (!slotCheck.ok) {
      return res.status(400).json({ message: slotCheck.message });
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: "PENDING",
        rejectionReason: null,
        cancellationReason: null,
      },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        doctor: {
          include: { doctorProfile: true },
        },
        service: true,
      },
    });

    await writeAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: "APPOINTMENT_RESCHEDULED_BY_PATIENT",
      entity: "Appointment",
      entityId: updated.id,
      details: `Rescheduled to ${appointmentDate} ${appointmentTime}`,
    });

    notifyClinicPatientChange(updated, "RESCHEDULED").catch((err) =>
      console.error("Reschedule notify failed:", err.message || err)
    );

    return res.json({
      success: true,
      message:
        "Appointment rescheduled. It is pending doctor review for the new time.",
      appointment: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};