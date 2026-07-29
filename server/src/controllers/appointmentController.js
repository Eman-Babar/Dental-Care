import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from '../config/prisma.js';
import { validateDentalProblem } from '../utils/dentalProblem.js';
import { writeAuditLog } from '../utils/auditLog.js';
import {
  isSlotInDoctorSchedule,
  SLOT_MINUTES,
} from '../utils/doctorAvailability.js';
import { doctorOffersService } from '../utils/doctorServices.js';
import {
  notifyClinicNewRequest,
  notifyPatientStatusChange,
} from '../utils/appointmentEmails.js';

const CLINIC_OPEN_HOUR = 9; // 9:00 AM
const CLINIC_CLOSE_HOUR = 17; // 5:00 PM

async function notifyClinicInbox(appointment) {
  return notifyClinicNewRequest(appointment);
}

async function findOrCreateGuestPatient({ name, email, phone }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    if (existing.role !== "PATIENT") {
      return {
        error: "This email belongs to a staff account. Please use a different email.",
      };
    }
    const data = {};
    if (name && name !== existing.name) data.name = name;
    if (phone && phone !== existing.phone) data.phone = phone;
    if (Object.keys(data).length) {
      return {
        patient: await prisma.user.update({
          where: { id: existing.id },
          data,
        }),
      };
    }
    return { patient: existing };
  }

  const tempPassword = crypto.randomBytes(16).toString("hex");
  const patient = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      phone: phone ? String(phone).trim() : null,
      password: await bcrypt.hash(tempPassword, 10),
      role: "PATIENT",
    },
  });
  return { patient };
}

// @desc    Public appointment request (no login required)
// @route   POST /api/appointments/public
// @access  Public
export const createPublicAppointment = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      serviceId,
      doctorId,
      appointmentDate,
      appointmentTime,
      currentProblem,
      notes,
    } = req.body;

    if (
      !name ||
      !email ||
      !serviceId ||
      !appointmentDate ||
      !appointmentTime ||
      !currentProblem
    ) {
      return res.status(400).json({
        message:
          "Please fill name, email, service, preferred date, time, and reason for visit.",
      });
    }

    const dentalCheck = validateDentalProblem(currentProblem);
    if (!dentalCheck.ok) {
      return res.status(400).json({ message: dentalCheck.message });
    }

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    const timeParts = String(appointmentTime).split(":");
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1] || 0);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return res.status(400).json({ message: "Invalid appointment time." });
    }

    const appointmentDateTime = new Date(appointmentDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    if (Number.isNaN(appointmentDateTime.getTime())) {
      return res.status(400).json({ message: "Invalid appointment date." });
    }
    if (appointmentDateTime.getTime() <= Date.now()) {
      return res.status(400).json({
        message: "Please choose a future date and time.",
      });
    }

    let resolvedDoctorId = null;
    if (doctorId) {
      const doctor = await prisma.user.findFirst({
        where: { id: Number(doctorId), role: "DOCTOR" },
        include: {
          doctorProfile: {
            include: { services: { select: { id: true } } },
          },
        },
      });
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found." });
      }
      if (!doctorOffersService(doctor.doctorProfile, serviceId)) {
        return res.status(400).json({
          message: "This doctor does not offer the selected service.",
        });
      }
      if (
        doctor.doctorProfile?.availability &&
        !isSlotInDoctorSchedule(
          doctor.doctorProfile.availability,
          appointmentDate,
          appointmentTime
        )
      ) {
        return res.status(400).json({
          message:
            "This time is outside the doctor's available schedule for that day.",
        });
      }

      const existingSlot = await prisma.appointment.findFirst({
        where: {
          doctorId: Number(doctorId),
          appointmentDate: new Date(appointmentDate),
          appointmentTime,
          status: { in: ["PENDING", "APPROVED"] },
        },
      });
      if (existingSlot) {
        return res.status(409).json({
          message:
            "This doctor already has an appointment at this time. Please choose another slot.",
        });
      }
      resolvedDoctorId = Number(doctorId);
    }

    const guest = await findOrCreateGuestPatient({ name, email, phone });
    if (guest.error) {
      return res.status(400).json({ message: guest.error });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: guest.patient.id,
        doctorId: resolvedDoctorId,
        serviceId: Number(serviceId),
        appointmentDate: new Date(appointmentDate),
        appointmentTime: String(appointmentTime),
        currentProblem: String(currentProblem).trim(),
        notes: notes ? String(notes).trim() : null,
        status: "PENDING",
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        service: true,
      },
    });

    await writeAuditLog({
      actorId: guest.patient.id,
      actorRole: "PATIENT",
      actorEmail: guest.patient.email,
      action: "PUBLIC_APPOINTMENT_REQUEST",
      entity: "Appointment",
      entityId: appointment.id,
      details: `Public booking: ${appointment.service?.title}`,
    });

    // Non-blocking clinic inbox notification
    notifyClinicInbox(appointment).catch((err) =>
      console.error("Clinic email notification failed:", err)
    );

    return res.status(201).json({
      success: true,
      message:
        "Appointment request received. The clinic will confirm shortly.",
      appointment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Create Appointment
// @route   POST /api/appointments
// @access  Private (PATIENT)

export const createAppointment = async (req, res) => {
  try {
    const {
      serviceId,
      doctorId,
      appointmentDate,
      appointmentTime,
      currentProblem,
      medicalHistory,
      notes,
    } = req.body;

    if (
      !serviceId ||
      !doctorId ||
      !appointmentDate ||
      !appointmentTime ||
      !currentProblem
    ) {
      return res.status(400).json({
        message: "Please fill all required fields (service, doctor, date, time, problem).",
      });
    }

    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });

    if (!service) {
      return res.status(404).json({ message: "Service not found." });
    }

    const doctor = await prisma.user.findFirst({
      where: { id: Number(doctorId), role: "DOCTOR" },
      include: {
        doctorProfile: {
          include: {
            services: { select: { id: true } },
          },
        },
      },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    if (!doctorOffersService(doctor.doctorProfile, serviceId)) {
      return res.status(400).json({
        message: "This doctor does not offer the selected service.",
      });
    }

    // Block past date / time bookings
    const timeParts = String(appointmentTime).split(":");
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1] || 0);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return res.status(400).json({ message: "Invalid appointment time." });
    }
    if (hours < CLINIC_OPEN_HOUR) {
      return res.status(400).json({
        message: "Clinic booking starts from 9:00 AM.",
      });
    }
    if (hours > CLINIC_CLOSE_HOUR || (hours === CLINIC_CLOSE_HOUR && minutes > 0)) {
      return res.status(400).json({
        message: "Clinic booking time is only allowed until 5:00 PM.",
      });
    }
    if (minutes % SLOT_MINUTES !== 0) {
      return res.status(400).json({
        message: "Appointments are available in fixed 30-minute slots only.",
      });
    }

    if (
      !isSlotInDoctorSchedule(
        doctor.doctorProfile?.availability,
        appointmentDate,
        appointmentTime
      )
    ) {
      return res.status(400).json({
        message: "This time is outside the doctor's available schedule for that day.",
      });
    }

    const appointmentDateTime = new Date(appointmentDate);
    appointmentDateTime.setHours(hours, minutes, 0, 0);

    if (Number.isNaN(appointmentDateTime.getTime())) {
      return res.status(400).json({ message: "Invalid appointment date." });
    }

    if (appointmentDateTime.getTime() <= Date.now()) {
      return res.status(400).json({
        message: "You cannot book an appointment for a past date or time.",
      });
    }

    const dentalCheck = validateDentalProblem(currentProblem);
    if (!dentalCheck.ok) {
      return res.status(400).json({ message: dentalCheck.message });
    }

    const existingSlot = await prisma.appointment.findFirst({
      where: {
        doctorId: Number(doctorId),
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        status: { in: ["PENDING", "APPROVED"] },
      },
    });
    if (existingSlot) {
      return res.status(409).json({
        message: "This doctor already has an appointment at this time. Please choose another slot.",
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId: req.user.id,
        doctorId: Number(doctorId),
        serviceId: Number(serviceId),
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        currentProblem,
        medicalHistory: medicalHistory || null,
        notes: notes || null,
        status: "PENDING",
      },
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        service: true,
      },
    });

    await writeAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      action: "APPOINTMENT_CREATED",
      entity: "Appointment",
      entityId: appointment.id,
      details: `Patient booked ${appointment.service?.title} with doctor #${doctorId}`,
    });

    notifyClinicInbox(appointment).catch((err) =>
      console.error("Clinic email notification failed:", err)
    );

    return res.status(201).json({
      success: true,
      message: "Appointment booked successfully. Waiting for doctor review.",
      appointment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get appointments for the authenticated patient
// @route   GET /api/appointments/mine
// @access  Private (PATIENT)
// @desc    Get My Appointments
// @route   GET /api/appointments/my
// @access  Private (PATIENT)

export const getMyAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: req.user.id,
      },

      include: {
        service: true,

        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        appointmentDate: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private (ADMIN, DENTIST)
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        service: {
          select: { title: true, description: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ appointments });
  } catch (error) {
    console.error('Get all appointments error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Get single appointment details
// @route   GET /api/appointments/:id
// @access  Private (ADMIN, DENTIST, or Patient who owns it)
export const getAppointmentById = async (req, res) => {
  const { id } = req.params;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        service: {
          select: { title: true, description: true },
        },
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Access check: allow admins, dentists, or the owner (by email match)
    if (req.user.role !== 'ADMIN' && req.user.role !== 'DENTIST' && req.user.email !== appointment.email) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json({ appointment });
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const ALLOWED_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
];

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (ADMIN, DOCTOR)
export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  try {
    const normalized = String(status || "").toUpperCase();
    if (!ALLOWED_STATUSES.includes(normalized)) {
      return res.status(400).json({
        message: `Invalid status. Use one of: ${ALLOWED_STATUSES.join(", ")}`,
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id, 10) },
      include: { service: true },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const previousStatus = appointment.status;

    const data = { status: normalized };
    if (normalized === "REJECTED" && rejectionReason) {
      data.rejectionReason = String(rejectionReason);
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id, 10) },
      data,
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true },
        },
        doctor: { select: { id: true, name: true, email: true } },
        service: true,
      },
    });

    await writeAuditLog({
      actorId: req.user?.id,
      actorRole: req.user?.role,
      actorEmail: req.user?.email,
      action: "APPOINTMENT_STATUS_UPDATED",
      entity: "Appointment",
      entityId: updatedAppointment.id,
      details: `Status set to ${normalized}`,
    });

    if (
      previousStatus !== normalized &&
      ["APPROVED", "REJECTED", "COMPLETED"].includes(normalized)
    ) {
      notifyPatientStatusChange(updatedAppointment, normalized).catch((err) =>
        console.error("Patient status email failed:", err)
      );
    }

    return res.json({
      success: true,
      message: `Appointment status updated to ${normalized}.`,
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Update appointment status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private (ADMIN)
export const deleteAppointment = async (req, res) => {
  const { id } = req.params;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    await prisma.appointment.delete({
      where: { id: parseInt(id, 10) },
    });

    return res.json({ message: 'Appointment record deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
