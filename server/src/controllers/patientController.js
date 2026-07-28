import prisma from "../config/prisma.js";
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