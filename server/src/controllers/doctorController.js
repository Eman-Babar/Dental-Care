import prisma from '../config/prisma.js';
import {
  normalizeAvailability,
  summarizeAvailability,
} from '../utils/doctorAvailability.js';
import { parseServiceIds } from '../utils/doctorServices.js';
// @desc Doctor Dashboard
// @route GET /api/doctor/dashboard
// @access Private (DOCTOR)
export const doctorDashboard = async (req, res) => {
    try {
        const doctorId = req.user.id;
        const pending = await prisma.appointment.count({
            where: {
                doctorId,
                status: "PENDING"
            }
        });
        const approved = await prisma.appointment.count({
            where: {
                doctorId,
                status: "APPROVED"
            }
        });
        const completed = await prisma.appointment.count({
            where: {
                doctorId,
                status: "COMPLETED"
            }
        });
        const today = new Date();
        const todayAppointments = await prisma.appointment.count({
            where: {
                doctorId,
                appointmentDate: {
                    gte: new Date(today.setHours(0,0,0,0)),
                    lte: new Date(today.setHours(23,59,59,999))
                }
            }
        });
        return res.json({
            pending,
            approved,
            completed,
            todayAppointments
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"

        });
    }
};
// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json({ doctors });
  } catch (error) {
    console.error('Get all doctors error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Get a single doctor
// @route   GET /api/doctors/:id
// @access  Public
export const getDoctorById = async (req, res) => {
  const { id } = req.params;

  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    return res.json({ doctor });
  } catch (error) {
    console.error('Get doctor by ID error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
// @desc    Create a new doctor record
// @route   POST /api/doctors
// @access  Private (ADMIN)
export const createDoctor = async (req, res) => {
  const { name, designation, bio } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';
  try {
    if (!name || !designation || !bio) {
      return res.status(400).json({ message: 'Name, designation, and bio are required' });
    }
    const doctor = await prisma.doctor.create({
      data: {
        name,
        designation,
        bio,
        image,
      },
    });

    return res.status(201).json({
      message: 'Doctor profile created successfully',
      doctor,
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};// @desc    Update an existing doctor profile
// @route   PUT /api/doctors/:id
// @access  Private (ADMIN)
export const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const { name, designation, bio } = req.body;

  try {
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (designation !== undefined) updateData.designation = designation;
    if (bio !== undefined) updateData.bio = bio;
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    const updatedDoctor = await prisma.doctor.update({
      where: { id: parseInt(id, 10) },
      data: updateData,
    });

    return res.json({
      message: 'Doctor profile updated successfully',
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};// @desc    Delete a doctor profile
// @route   DELETE /api/doctors/:id
// @access  Private (ADMIN)
export const deleteDoctor = async (req, res) => {
  const { id } = req.params;
  try {
    const existingDoctor = await prisma.doctor.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!existingDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    await prisma.doctor.delete({
      where: { id: parseInt(id, 10) },
    });
    return res.json({ message: 'Doctor profile deleted successfully' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
// @desc Get Assigned Appointments
// @route GET /api/doctor/appointments
// @access Private (DOCTOR)
export const getAssignedAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId: req.user.id
            },
            include: {
                patient: true,
                service: true
            },
            orderBy: {
                appointmentDate: "asc"
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
// @desc Approve Appointment
export const approveAppointment = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const appointment = await prisma.appointment.findFirst({
            where: {
                id,
                doctorId: req.user.id
            }
        });
        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found."
            });
        }
        const updated = await prisma.appointment.update({
            where: {
                id
            },
            data: {
                status: "APPROVED"
            }
        });

        return res.json({
            success: true,
            message: "Appointment approved.",
            appointment: updated
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};// @desc Reject Appointment
export const rejectAppointment = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { rejectionReason } = req.body;
        const appointment = await prisma.appointment.findFirst({
            where: {
                id,
                doctorId: req.user.id
            }
        });
        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found."
            });
        }
        const updated = await prisma.appointment.update({
            where: {
                id
            },
            data: {
                status: "REJECTED",
                rejectionReason
            }
        });

        return res.json({
            success: true,
            message: "Appointment rejected.",
            appointment: updated
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const completeAppointment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const appointment = await prisma.appointment.findFirst({
      where: { id, doctorId: req.user.id, status: "APPROVED" },
    });

    if (!appointment) {
      return res.status(404).json({
        message: "Approved appointment not found.",
      });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "COMPLETED" },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true } },
        service: true,
      },
    });

    return res.json({
      success: true,
      message: "Appointment marked as completed.",
      appointment: updated,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyPatients = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: req.user.id },
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const map = new Map();
    for (const item of appointments) {
      if (!item.patient) continue;
      const key = item.patient.id;
      if (!map.has(key)) {
        map.set(key, {
          ...item.patient,
          visits: 1,
          lastVisit: item.appointmentDate,
          lastStatus: item.status,
        });
      } else {
        const current = map.get(key);
        current.visits += 1;
        if (new Date(item.appointmentDate) > new Date(current.lastVisit)) {
          current.lastVisit = item.appointmentDate;
          current.lastStatus = item.status;
        }
      }
    }

    return res.json({
      success: true,
      patients: Array.from(map.values()),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDoctorReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { doctorId: req.user.id },
      include: {
        patient: { select: { id: true, name: true } },
        appointment: { include: { service: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, reviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const upcomingAppointments = async (req, res) => {
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                doctorId: req.user.id,
                status: "APPROVED"
            },
            include: {
                patient: true,
                service: true
            },
            orderBy: {
                appointmentDate: "asc"
            }
        });
        return res.json({
            appointments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};
// @desc Get Completed Appointments
// @route GET /api/doctor/completed
// @access Private (DOCTOR)

export const completedAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: req.user.id,
        status: "COMPLETED",
      },
      include: {
        patient: true,
        service: true,
      },
      orderBy: {
        appointmentDate: "desc",
      },
    });

    return res.json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Completed appointments error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
// @desc Get own doctor profile
// @route GET /api/doctor/profile
export const getDoctorProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        doctorProfile: {
          include: {
            services: {
              select: {
                id: true,
                title: true,
                description: true,
                duration: true,
                price: true,
                isGlobal: true,
              },
              orderBy: { title: "asc" },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Doctor not found." });
    }

    return res.json({ success: true, user, doctorProfile: user.doctorProfile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Update Doctor Profile
// @route PUT /api/doctor/profile
// @access Private (DOCTOR)

export const updateDoctorProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      specialization,
      qualification,
      experience,
      bio,
      workingDays,
      workingHours,
      availability,
      serviceIds,
    } = req.body;

    const existingProfile = await prisma.doctorProfile.findUnique({
      where: {
        userId: req.user.id,
      },
      include: { services: true },
    });

    const availabilityData = availability
      ? normalizeAvailability(availability)
      : normalizeAvailability(existingProfile?.availability);

    const parsedServiceIds = parseServiceIds(serviceIds);
    const customServiceIds = (existingProfile?.services || [])
      .filter((service) => service.isGlobal === false)
      .map((service) => service.id);
    const mergedServiceIds =
      parsedServiceIds !== null
        ? [...new Set([...parsedServiceIds, ...customServiceIds])]
        : null;

    const summary = summarizeAvailability(availabilityData);
    const [derivedDays, derivedHours] = summary.includes(" · ")
      ? summary.split(" · ")
      : [summary, workingHours || "09:00 - 17:00"];

    // Update User table
    const user = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(req.file && { image: `/uploads/${req.file.filename}` }),
      },
    });

    // Check if Doctor Profile exists
    let doctorProfile;

    const profileData = {
      specialization,
      qualification,
      experience: experience ? Number(experience) : null,
      bio,
      workingDays: workingDays || derivedDays,
      workingHours: workingHours || derivedHours,
      availability: availabilityData,
      ...(mergedServiceIds !== null && {
        services: {
          set: mergedServiceIds.map((id) => ({ id })),
        },
      }),
    };

    if (existingProfile) {
      // Update existing profile
      doctorProfile = await prisma.doctorProfile.update({
        where: {
          userId: req.user.id,
        },
        data: profileData,
        include: {
          services: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
              price: true,
              isGlobal: true,
            },
            orderBy: { title: "asc" },
          },
        },
      });
    } else {
      // Create profile if it doesn't exist
      doctorProfile = await prisma.doctorProfile.create({
        data: {
          userId: req.user.id,
          ...profileData,
        },
        include: {
          services: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
              price: true,
              isGlobal: true,
            },
            orderBy: { title: "asc" },
          },
        },
      });
    }

    return res.json({
      success: true,
      message: "Doctor profile updated successfully.",
      user,
      doctorProfile,
    });
  } catch (error) {
    console.error("Update doctor profile error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const createDoctorService = async (req, res) => {
  try {
    const { title, description, duration, price } = req.body;

    if (!String(title || "").trim() || !String(description || "").trim()) {
      return res.status(400).json({
        message: "Service title and description are required.",
      });
    }

    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }

    const service = await prisma.service.create({
      data: {
        title: String(title).trim(),
        description: String(description).trim(),
        duration: duration ? Number(duration) : null,
        price: price ? Number(price) : null,
        isGlobal: false,
        ownerDoctorProfileId: profile.id,
        doctorProfiles: {
          connect: { id: profile.id },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Custom service added.",
      service,
    });
  } catch (error) {
    console.error("Create doctor service error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteDoctorService = async (req, res) => {
  try {
    const serviceId = Number(req.params.id);

    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.status(404).json({ message: "Doctor profile not found." });
    }

    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        ownerDoctorProfileId: profile.id,
        isGlobal: false,
      },
    });

    if (!service) {
      return res.status(404).json({ message: "Custom service not found." });
    }

    const appointmentCount = await prisma.appointment.count({
      where: { serviceId },
    });

    if (appointmentCount > 0) {
      return res.status(400).json({
        message: "This service cannot be removed because it has appointments.",
      });
    }

    await prisma.service.delete({ where: { id: serviceId } });

    return res.json({
      success: true,
      message: "Custom service removed.",
    });
  } catch (error) {
    console.error("Delete doctor service error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};