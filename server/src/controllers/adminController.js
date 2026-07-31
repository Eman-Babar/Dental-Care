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
      select: {
        serviceId: true,
        status: true,
        paymentStatus: true,
        amountPaid: true,
        depositAmount: true,
      },
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

    const paymentStats = {
      unpaid: appointments.filter((a) => a.paymentStatus === "UNPAID").length,
      depositDue: appointments.filter((a) => a.paymentStatus === "DEPOSIT_DUE")
        .length,
      depositPaid: appointments.filter(
        (a) => a.paymentStatus === "DEPOSIT_PAID"
      ).length,
      paid: appointments.filter((a) => a.paymentStatus === "PAID").length,
      waived: appointments.filter((a) => a.paymentStatus === "WAIVED").length,
      totalCollected: appointments.reduce(
        (sum, a) => sum + (Number(a.amountPaid) || 0),
        0
      ),
    };

    // Last 14 calendar days: bookings created + completed visits
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - 13);

    const recent = await prisma.appointment.findMany({
      where: {
        OR: [
          { createdAt: { gte: dayStart } },
          {
            status: "COMPLETED",
            updatedAt: { gte: dayStart },
          },
        ],
      },
      select: {
        createdAt: true,
        updatedAt: true,
        status: true,
        amountPaid: true,
      },
    });

    const dailyTrend = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(dayStart);
      d.setDate(dayStart.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const created = recent.filter(
        (a) => a.createdAt && a.createdAt.toISOString().slice(0, 10) === key
      ).length;
      const completed = recent.filter(
        (a) =>
          a.status === "COMPLETED" &&
          a.updatedAt &&
          a.updatedAt.toISOString().slice(0, 10) === key
      ).length;
      const collected = recent
        .filter(
          (a) =>
            a.status === "COMPLETED" &&
            a.updatedAt &&
            a.updatedAt.toISOString().slice(0, 10) === key
        )
        .reduce((sum, a) => sum + (Number(a.amountPaid) || 0), 0);
      dailyTrend.push({
        date: key,
        label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        created,
        completed,
        collected,
      });
    }

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
        paymentStats,
        dailyTrend,
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

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// @desc Export appointments as CSV
// @route GET /api/admin/appointments/export
// @access Private (ADMIN)
export const exportAppointmentsCsv = async (req, res) => {
  try {
    const rows = await prisma.appointment.findMany({
      include: {
        patient: { select: { name: true, email: true, phone: true } },
        doctor: { select: { name: true } },
        service: { select: { title: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const header = [
      "id",
      "status",
      "paymentStatus",
      "depositAmount",
      "amountPaid",
      "patientName",
      "patientEmail",
      "patientPhone",
      "doctorName",
      "service",
      "servicePrice",
      "appointmentDate",
      "appointmentTime",
      "problem",
      "createdAt",
      "reminderSentAt",
    ];

    const lines = [header.join(",")];
    for (const a of rows) {
      lines.push(
        [
          a.id,
          a.status,
          a.paymentStatus,
          a.depositAmount,
          a.amountPaid,
          a.patient?.name,
          a.patient?.email,
          a.patient?.phone,
          a.doctor?.name || "",
          a.service?.title,
          a.service?.price,
          a.appointmentDate
            ? new Date(a.appointmentDate).toISOString().slice(0, 10)
            : "",
          a.appointmentTime,
          a.currentProblem,
          a.createdAt?.toISOString?.() || a.createdAt,
          a.reminderSentAt?.toISOString?.() || "",
        ]
          .map(csvEscape)
          .join(",")
      );
    }

    const csv = lines.join("\n");
    const filename = `appointments-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error("Export CSV error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Publish or hide a review
// @route PUT /api/admin/reviews/:id/visibility
// @access Private (ADMIN)
export const setReviewVisibility = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isPublished } = req.body;

    if (typeof isPublished !== "boolean") {
      return res.status(400).json({
        message: "isPublished (boolean) is required.",
      });
    }

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Review not found." });
    }

    const review = await prisma.review.update({
      where: { id },
      data: { isPublished },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        doctor: {
          select: {
            id: true,
            name: true,
            doctorProfile: { select: { specialization: true } },
          },
        },
        appointment: { include: { service: true } },
      },
    });

    return res.json({
      success: true,
      message: isPublished ? "Review published on the website." : "Review hidden from the website.",
      review,
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

// @desc Full clinic snapshot for handover / backup (no passwords)
// @route GET /api/admin/backup
// @access Private (ADMIN)
export const exportClinicBackup = async (req, res) => {
  try {
    const [siteContent, services, doctors, patients, appointmentCounts, reviews] =
      await Promise.all([
        prisma.siteContent.findMany({ orderBy: { key: "asc" } }),
        prisma.service.findMany({ orderBy: { id: "asc" } }),
        prisma.user.findMany({
          where: { role: "DOCTOR" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            doctorProfile: true,
          },
          orderBy: { id: "asc" },
        }),
        prisma.user.findMany({
          where: { role: "PATIENT" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
          orderBy: { id: "asc" },
        }),
        prisma.appointment.groupBy({
          by: ["status", "paymentStatus"],
          _count: { _all: true },
        }),
        prisma.review.findMany({
          select: {
            id: true,
            rating: true,
            comment: true,
            isPublished: true,
            createdAt: true,
            doctorId: true,
            patientId: true,
          },
          orderBy: { id: "asc" },
        }),
      ]);

    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      siteContent,
      services,
      doctors,
      patients,
      appointmentCounts,
      reviews,
    };

    const filename = `clinic-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("Clinic backup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Upload image for CMS / branding (returns public /uploads URL)
// @route POST /api/admin/upload
// @access Private (ADMIN)
export const uploadSiteImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required." });
    }
    const url = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      url,
      message: "Image uploaded. Paste this URL into Site content.",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc Send daily digest now (ops / testing)
// @route POST /api/admin/digest/send
// @access Private (ADMIN)
export const sendDigestNow = async (req, res) => {
  try {
    const { sendDailyClinicDigest } = await import("../utils/dailyDigest.js");
    const result = await sendDailyClinicDigest();
    if (!result?.success) {
      return res.status(400).json({
        message: result?.error || "Digest could not be sent. Check CLINIC_EMAIL / SMTP.",
      });
    }
    return res.json({
      success: true,
      message: `Daily digest emailed to ${process.env.CLINIC_EMAIL || "clinic inbox"}.`,
    });
  } catch (error) {
    console.error("Digest send error:", error);
    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
};

// @desc Lightweight ops counts for admin nav badges
// @route GET /api/admin/alerts
// @access Private (ADMIN)
export const getAdminAlerts = async (req, res) => {
  try {
    const [pending, paymentClaims] = await Promise.all([
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.appointment.count({
        where: {
          paymentClaimedAt: { not: null },
          paymentStatus: { in: ["UNPAID", "DEPOSIT_DUE"] },
        },
      }),
    ]);

    return res.json({
      success: true,
      pending,
      paymentClaims,
      totalAttention: pending + paymentClaims,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};