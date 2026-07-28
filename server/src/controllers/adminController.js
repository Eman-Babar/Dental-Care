import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
// @desc Assign Doctor
// @route PUT /api/admin/appointments/:id/assign
// @access Private (ADMIN)
export const assignDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorId } = req.body;
        const appointment = await prisma.appointment.findUnique({
            where: {
                id: Number(id)
            }
        });
        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found."
            });
        }
        const doctor = await prisma.user.findFirst({
            where: {
                id: Number(doctorId),
                role: "DOCTOR"
            }
        });
        if (!doctor) {
            return res.status(404).json({
                message: "Doctor not found."
            });
        }
        const updatedAppointment = await prisma.appointment.update({
            where: {
                id: Number(id)
            },
            data: {
                doctorId: Number(doctorId)
            },
            include: {
                patient: true,
                doctor: true,
                service: true
            }
        });
        return res.json({
            success: true,
            message: "Doctor assigned successfully.",
            appointment: updatedAppointment
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};
// @desc Create Doctor
// @route POST /api/admin/doctors
// @access Private (ADMIN)
export const createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      image,
      specialization,
      qualification,
      experience,
      bio,
      workingDays,
      workingHours,
    } = req.body;

    // Required fields
    if (!name || !email || !password || !specialization) {
      return res.status(400).json({
        message: "Name, email, password and specialization are required.",
      });
    }
    // Check if email already exists
    const existingDoctor = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (existingDoctor) {
      return res.status(400).json({
        message: "Doctor with this email already exists.",
      });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create Doctor + Profile
    const doctor = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "DOCTOR",
        phone,
        image,
        doctorProfile: {
          create: {
            specialization,
            qualification,
            experience: experience ? Number(experience) : null,
            bio,
            workingDays,
            workingHours,
          },
        },
      },
      include: {
        doctorProfile: true,
      },
    });
    return res.status(201).json({
      success: true,
      message: "Doctor created successfully.",
      doctor,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
// @desc Admin Dashboard
// @route GET /api/admin/dashboard
// @access Private (ADMIN)

export const adminDashboard = async (req, res) => {
  try {

    const totalPatients = await prisma.user.count({
      where: {
        role: "PATIENT",
      },
    });

    const totalDoctors = await prisma.user.count({
      where: {
        role: "DOCTOR",
      },
    });

    const totalAppointments = await prisma.appointment.count();

    const pendingAppointments = await prisma.appointment.count({
      where: {
        status: "PENDING",
      },
    });

    const approvedAppointments = await prisma.appointment.count({
      where: {
        status: "APPROVED",
      },
    });

    const completedAppointments = await prisma.appointment.count({
      where: {
        status: "COMPLETED",
      },
    });

    const cancelledAppointments = await prisma.appointment.count({
      where: {
        status: "CANCELLED",
      },
    });

    const rejectedAppointments = await prisma.appointment.count({
      where: {
        status: "REJECTED",
      },
    });

    const services = await prisma.service.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });

    const appointments = await prisma.appointment.findMany({
      select: { serviceId: true, status: true },
    });

    const serviceStats = services.map((service) => {
      const rows = appointments.filter((a) => a.serviceId === service.id);
      return {
        serviceId: service.id,
        service: service.title,
        total: rows.length,
        pending: rows.filter((a) => a.status === "PENDING").length,
        approved: rows.filter((a) => a.status === "APPROVED").length,
        rejected: rows.filter((a) => a.status === "REJECTED").length,
        completed: rows.filter((a) => a.status === "COMPLETED").length,
        cancelled: rows.filter((a) => a.status === "CANCELLED").length,
      };
    });

    return res.json({
      success: true,
      dashboard: {
        totalPatients,
        totalDoctors,
        totalAppointments,
        pendingAppointments,
        approvedAppointments,
        completedAppointments,
        cancelledAppointments,
        rejectedAppointments,
        serviceStats,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
export const getAllDoctors = async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: "DOCTOR",
      },
      include: {
        doctorProfile: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
// @desc Get All Appointments
// @route GET /api/admin/appointments
// @access Private (ADMIN)
export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        service: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.json({
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
// @desc Get Single Doctor
// @route GET /api/admin/doctors/:id
// @access Private (ADMIN)
export const getDoctorById = async (req, res) => {
  try {
    const doctor = await prisma.user.findFirst({
      where: {
        id: Number(req.params.id),
        role: "DOCTOR",
      },
      include: {
        doctorProfile: true,
      },
    });
    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found.",
      });
    }
    return res.json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};// @desc Update Doctor
// @route PUT /api/admin/doctors/:id
// @access Private (ADMIN)
export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      image,
      specialization,
      qualification,
      experience,
      bio,
      workingDays,
      workingHours,
    } = req.body;
    const doctor = await prisma.user.findFirst({
      where: {
        id: Number(id),
        role: "DOCTOR",
      },
      include: {
        doctorProfile: true,
      },
    });
    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found.",
      });
    }
    const updatedDoctor = await prisma.user.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        phone,
        image,
        doctorProfile: {
          update: {
            specialization,
            qualification,
            experience: experience ? Number(experience) : null,
            bio,
            workingDays,
            workingHours,
          },
        },
      },
      include: {
        doctorProfile: true,
      },
    });
    return res.json({
      success: true,
      message: "Doctor updated successfully.",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};// @desc Delete Doctor
// @route DELETE /api/admin/doctors/:id
// @access Private (ADMIN)
export const deleteDoctor = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const doctor = await prisma.user.findFirst({
      where: {
        id,
        role: "DOCTOR",
      },
    });
    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found.",
      });
    }
    const assignedAppointments = await prisma.appointment.count({
      where: {
        doctorId: id,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });
    if (assignedAppointments > 0) {
      return res.status(400).json({
        message: "Doctor has active appointments. Reassign them before deleting.",
      });
    }
    await prisma.user.delete({
      where: {
        id,
      },
    });
    return res.json({
      success: true,
      message: "Doctor deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
// @desc Get All Patients
// @route GET /api/admin/patients
// @access Private (ADMIN)
export const getAllPatients = async (req, res) => {
  try {
    const patients = await prisma.user.findMany({
      where: {
        role: "PATIENT",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            patientAppointments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};// @desc Get Patient By ID
// @route GET /api/admin/patients/:id
export const getPatientById = async (req, res) => {
    try {
        const patient = await prisma.user.findFirst({
            where: {
                id: Number(req.params.id),
                role: "PATIENT"
            },
            include: {
                patientAppointments: {
                    include: {
                        service: true,
                        doctor: {
                            include: {
                                doctorProfile: true
                            }
                        }
                    }
                }
            }
        });
        if (!patient) {
            return res.status(404).json({
                message: "Patient not found."
            });
        }
        return res.json({
            success: true,
            patient
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};
// @desc Update Patient
export const updatePatient = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { name, phone, image } = req.body;
        const patient = await prisma.user.findFirst({
            where: {
                id,
                role: "PATIENT"
            }
        });
        if (!patient) {
            return res.status(404).json({
                message: "Patient not found."
            });
        }
        const updated = await prisma.user.update({
            where: {
                id
            },
            data: {
                name,
                phone,
                image
            }
        });
        return res.json({
            success: true,
            patient: updated
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};
// @desc Delete Patient
export const deletePatient = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const patient = await prisma.user.findFirst({
            where: {
                id,
                role: "PATIENT"
            }
        });
        if (!patient) {
            return res.status(404).json({
                message: "Patient not found."
            });
        }
        await prisma.user.delete({
            where: {
                id
            }
        });
        return res.json({
            success: true,
            message: "Patient deleted successfully."
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// @desc Get all reviews
// @route GET /api/admin/reviews
// @access Private (ADMIN)
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        patient: {
          select: { id: true, name: true, email: true, phone: true },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            doctorProfile: { select: { specialization: true } },
          },
        },
        appointment: {
          include: { service: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Get audit logs
// @route GET /api/admin/audit-logs
// @access Private (ADMIN)
export const getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};