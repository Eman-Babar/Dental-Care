import prisma from "../config/prisma.js";

// @desc    Public clinic reviews for marketing pages
// @route   GET /api/reviews
// @access  Public
export const getPublicReviews = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 12, 30);
    const reviews = await prisma.review.findMany({
      where: { isPublished: true },
      take: limit,
      include: {
        patient: { select: { name: true } },
        doctor: {
          select: {
            name: true,
            doctorProfile: { select: { specialization: true } },
          },
        },
        appointment: {
          include: { service: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyReviews = async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { patientId: req.user.id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            doctorProfile: { select: { specialization: true } },
          },
        },
        appointment: {
          include: { service: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, reviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getReviewableAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: req.user.id,
        status: "COMPLETED",
        review: null,
        doctorId: { not: null },
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            doctorProfile: { select: { specialization: true } },
          },
        },
        service: true,
      },
      orderBy: { appointmentDate: "desc" },
    });

    return res.json({ success: true, appointments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createReview = async (req, res) => {
  try {
    const { appointmentId, rating, comment } = req.body;

    if (!appointmentId || !rating || !comment?.trim()) {
      return res.status(400).json({
        message: "Appointment, rating, and comment are required",
      });
    }

    const stars = Number(rating);
    if (stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: Number(appointmentId),
        patientId: req.user.id,
        status: "COMPLETED",
      },
    });

    if (!appointment || !appointment.doctorId) {
      return res.status(404).json({
        message: "Completed appointment not found",
      });
    }

    const existing = await prisma.review.findUnique({
      where: { appointmentId: appointment.id },
    });

    if (existing) {
      return res.status(400).json({ message: "You already reviewed this visit" });
    }

    const review = await prisma.review.create({
      data: {
        patientId: req.user.id,
        doctorId: appointment.doctorId,
        appointmentId: appointment.id,
        rating: stars,
        comment: comment.trim(),
        isPublished: false,
      },
      include: {
        doctor: { select: { id: true, name: true } },
        appointment: { include: { service: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted — it will appear after clinic approval",
      review,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
