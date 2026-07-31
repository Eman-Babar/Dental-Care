import Stripe from "stripe";
import prisma from "../config/prisma.js";
import { sendEmail } from "../config/nodemailer.js";
import { buildBrandedEmail } from "../utils/emailTemplates.js";
import { getClientUrl } from "../utils/brand.js";
import { writeAuditLog } from "../utils/auditLog.js";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key || key.includes("your_stripe")) return null;
  return new Stripe(key);
}

export function isStripeConfigured() {
  return Boolean(getStripe());
}

async function loadAppointmentForPayment(id, patientId = null) {
  return prisma.appointment.findFirst({
    where: {
      id: Number(id),
      ...(patientId ? { patientId } : {}),
    },
    include: {
      patient: { select: { id: true, name: true, email: true, phone: true } },
      doctor: { select: { id: true, name: true } },
      service: true,
    },
  });
}

/**
 * POST /api/payments/checkout
 * Create Stripe Checkout session for appointment deposit (optional).
 */
export const createCheckoutSession = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        message:
          "Online card payments are not configured. Use bank/JazzCash instructions instead.",
        stripeEnabled: false,
      });
    }

    const appointmentId = Number(req.body.appointmentId);
    const appointment = await loadAppointmentForPayment(
      appointmentId,
      req.user.role === "PATIENT" ? req.user.id : null
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const amount = Number(appointment.depositAmount);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "No deposit amount set for this appointment.",
      });
    }

    if (["DEPOSIT_PAID", "PAID", "WAIVED"].includes(appointment.paymentStatus)) {
      return res.status(400).json({ message: "This visit is already paid or waived." });
    }

    const currencyRow = await prisma.siteContent.findUnique({
      where: { key: "payment.currency" },
    });
    const currency = (currencyRow?.value || "pkr").toLowerCase();

    // Stripe expects smallest currency unit (e.g. paisa for PKR)
    const unitAmount = Math.round(amount * 100);
    const clientUrl = getClientUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: appointment.patient?.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: unitAmount,
            product_data: {
              name: `Deposit — ${appointment.service?.title || "Dental visit"}`,
              description: `Appointment #${appointment.id}`,
            },
          },
        },
      ],
      metadata: {
        appointmentId: String(appointment.id),
      },
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/patient`,
    });

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { stripeSessionId: session.id },
    });

    return res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      stripeEnabled: true,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return res.status(500).json({
      message: error.message || "Could not start checkout",
    });
  }
};

/**
 * GET /api/payments/confirm?session_id=
 * Confirm Stripe session and mark deposit paid.
 */
export const confirmCheckoutSession = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ message: "Stripe is not configured." });
    }

    const sessionId = String(req.query.session_id || "").trim();
    if (!sessionId) {
      return res.status(400).json({ message: "session_id is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return res.status(400).json({
        message: "Payment is not completed yet.",
        payment_status: session.payment_status,
      });
    }

    const appointmentId = Number(
      session.metadata?.appointmentId || 0
    );
    if (!appointmentId) {
      return res.status(400).json({ message: "Missing appointment metadata." });
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        paymentStatus: "DEPOSIT_PAID",
        amountPaid: (session.amount_total || 0) / 100,
        stripeSessionId: sessionId,
        paymentNote: "Paid via Stripe Checkout",
        paymentClaimedAt: new Date(),
      },
      include: {
        patient: { select: { name: true, email: true } },
        service: true,
      },
    });

    await writeAuditLog({
      actorId: req.user?.id,
      actorRole: req.user?.role || "PATIENT",
      action: "STRIPE_DEPOSIT_PAID",
      entity: "Appointment",
      entityId: appointmentId,
      details: `Stripe session ${sessionId}`,
    });

    return res.json({
      success: true,
      message: "Deposit payment confirmed.",
      appointment,
    });
  } catch (error) {
    console.error("Confirm checkout error:", error);
    return res.status(500).json({ message: "Could not confirm payment" });
  }
};

/**
 * POST /api/payments/:appointmentId/claim
 * Patient reports they paid via bank/JazzCash.
 */
export const claimPayment = async (req, res) => {
  try {
    const id = Number(req.params.appointmentId);
    const note = String(req.body.note || "").trim();

    const appointment = await loadAppointmentForPayment(id, req.user.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (["DEPOSIT_PAID", "PAID", "WAIVED"].includes(appointment.paymentStatus)) {
      return res.status(400).json({ message: "Already marked as paid." });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        paymentClaimedAt: new Date(),
        paymentNote: note || "Patient reported payment (awaiting verification)",
        paymentStatus:
          appointment.paymentStatus === "UNPAID"
            ? "DEPOSIT_DUE"
            : appointment.paymentStatus,
      },
      include: {
        patient: { select: { name: true, email: true, phone: true } },
        service: true,
        doctor: { select: { name: true } },
      },
    });

    const clinicEmail =
      process.env.CLINIC_EMAIL ||
      process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ||
      process.env.EMAIL_USER;

    if (clinicEmail) {
      const { brand, html, text } = await buildBrandedEmail({
        title: "Payment claim to verify",
        intro: `${updated.patient?.name || "A patient"} says they paid the deposit. Please verify and update payment status.`,
        rows: [
          { label: "Appointment", value: `#${updated.id}` },
          { label: "Service", value: updated.service?.title || "—" },
          { label: "Deposit", value: `Rs ${updated.depositAmount ?? "—"}` },
          { label: "Patient note", value: updated.paymentNote || "—" },
          { label: "Email", value: updated.patient?.email || "—" },
          { label: "Phone", value: updated.patient?.phone || "—" },
        ],
        cta: {
          label: "Open admin appointments",
          url: `${getClientUrl()}/admin/appointments`,
        },
      });
      await sendEmail({
        to: clinicEmail,
        subject: `${brand}: verify payment claim #${updated.id}`,
        text,
        html,
      });
    }

    await writeAuditLog({
      actorId: req.user.id,
      actorRole: req.user.role,
      actorEmail: req.user.email,
      action: "PAYMENT_CLAIMED",
      entity: "Appointment",
      entityId: id,
      details: note || "Patient claimed payment",
    });

    return res.json({
      success: true,
      message: "Thanks — we will verify your payment shortly.",
      appointment: updated,
    });
  } catch (error) {
    console.error("Claim payment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/payments/status
 * Whether Stripe is enabled (for UI).
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
    stripeEnabled: isStripeConfigured(),
    paymentEnabled: (map["payment.enabled"] || "true") !== "false",
    heading: map["payment.heading"] || "How to pay your deposit",
    instructions: map["payment.instructions"] || "",
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
