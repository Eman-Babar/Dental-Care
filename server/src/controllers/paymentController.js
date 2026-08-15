import prisma from "../config/prisma.js";

/**
 * POST /api/payments/checkout
 * Online card checkout is disabled — patients pay at the clinic only.
 */
export const createCheckoutSession = async (_req, res) => {
  return res.status(403).json({
    message:
      "Online payments are disabled. Please pay at the clinic reception.",
    stripeEnabled: false,
  });
};

/**
 * GET /api/payments/confirm?session_id=
 * Disabled — online Stripe checkout is off; pay at clinic only.
 */
export const confirmCheckoutSession = async (_req, res) => {
  return res.status(403).json({
    message:
      "Online payments are disabled. Please pay at the clinic reception.",
  });
};

/**
 * POST /api/payments/:appointmentId/claim
 * Disabled — patients pay at the clinic; admin updates payment status.
 */
export const claimPayment = async (_req, res) => {
  return res.status(403).json({
    message:
      "Online payment claims are disabled. Please pay at the clinic reception.",
  });
};

/**
 * GET /api/payments/config
 * Clinic-only payments — online Stripe is always off for patients.
 */
export const getPaymentConfig = async (_req, res) => {
  const instructions = await prisma.siteContent.findMany({
    where: {
      key: {
        in: [
          "payment.enabled",
          "payment.heading",
          "payment.instructions",
          "payment.currency",
        ],
      },
    },
  });
  const map = {};
  for (const row of instructions) map[row.key] = row.value;

  return res.json({
    stripeEnabled: false,
    onlinePaymentsEnabled: false,
    paymentEnabled: (map["payment.enabled"] || "true") !== "false",
    heading: map["payment.heading"] || "Pay at the clinic",
    instructions:
      map["payment.instructions"] ||
      "Please pay your visit / deposit at the clinic reception. Online payments are not available.",
    currency: map["payment.currency"] || "pkr",
  });
};

/**
 * GET /api/payments/receipt/:appointmentId
 * Receipt payload for print view (patient owns it, or admin).
 */
export const getReceipt = async (req, res) => {
  try {
    const id = Number(req.params.appointmentId);
    const where =
      req.user.role === "ADMIN"
        ? { id }
        : { id, patientId: req.user.id };

    const appointment = await prisma.appointment.findFirst({
      where,
      include: {
        patient: { select: { name: true, email: true, phone: true } },
        doctor: { select: { name: true } },
        service: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const brandRow = await prisma.siteContent.findUnique({
      where: { key: "home.brand" },
    });
    const addressRow = await prisma.siteContent.findUnique({
      where: { key: "contact.address" },
    });

    return res.json({
      success: true,
      brand: brandRow?.value || "DentalCare",
      address: addressRow?.value || "",
      appointment,
    });
  } catch (error) {
    console.error("Receipt error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
