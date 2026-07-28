import prisma from '../config/prisma.js';
import { sendEmail } from '../config/nodemailer.js';
import { validateDentalProblem } from '../utils/dentalProblem.js';
import { writeAuditLog } from '../utils/auditLog.js';
import {
  isSlotInDoctorSchedule,
  SLOT_MINUTES,
} from '../utils/doctorAvailability.js';
import { doctorOffersService } from '../utils/doctorServices.js';

const CLINIC_OPEN_HOUR = 9; // 9:00 AM
const CLINIC_CLOSE_HOUR = 17; // 5:00 PM

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Public (or authenticated Patient)
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

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private (ADMIN, DENTIST)
export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!status || !['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(id, 10) },
      include: { service: true },
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(id, 10) },
      data: { status },
    });

    // Send email update notification
    await sendEmail({
      to: appointment.email,
      subject: `Dental Appointment ${status.toUpperCase()}`,
      text: `Dear ${appointment.patientName},\n\nYour appointment request for ${appointment.service.title} on ${appointment.appointmentDate} at ${appointment.appointmentTime} has been ${status}.\n\nBest regards,\nDental Care Clinic`,
      html: `
        <h3>Dear ${appointment.patientName},</h3>
        <p>Your appointment status has been updated:</p>
        <ul>
          <li><strong>Service:</strong> ${appointment.service.title}</li>
          <li><strong>Date:</strong> ${appointment.appointmentDate}</li>
          <li><strong>Time:</strong> ${appointment.appointmentTime}</li>
          <li><strong>Status:</strong> <span style="text-transform: capitalize; font-weight: bold;">${status}</span></li>
        </ul>
        <p>If you have any questions, please contact our support.</p>
      `,
    });

    return res.json({
      message: `Appointment status updated to ${status} and email notification sent.`,
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
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
