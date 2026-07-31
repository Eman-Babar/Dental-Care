import { sendEmail } from "../config/nodemailer.js";
import { writeAuditLog } from "../utils/auditLog.js";
import { buildBrandedEmail } from "../utils/emailTemplates.js";

/**
 * Public contact / enquiry form
 * POST /api/contact
 */
export const submitContactEnquiry = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        message: "Name, email, and message are required.",
      });
    }

    if (String(message).trim().length < 10) {
      return res.status(400).json({
        message: "Please write a slightly longer message (at least 10 characters).",
      });
    }

    const clinicEmail =
      process.env.CLINIC_EMAIL ||
      process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1] ||
      process.env.EMAIL_USER;

    if (!clinicEmail) {
      return res.status(503).json({
        message: "Clinic inbox is not configured. Please call or WhatsApp us.",
      });
    }

    const { brand, html, text } = await buildBrandedEmail({
      title: "Website enquiry",
      intro: "A visitor sent a message from the contact form.",
      rows: [
        { label: "Name", value: String(name).trim() },
        { label: "Email", value: String(email).trim() },
        { label: "Phone", value: phone ? String(phone).trim() : "—" },
        { label: "Message", value: String(message).trim() },
      ],
    });

    const result = await sendEmail({
      to: clinicEmail,
      subject: `${brand} website enquiry from ${String(name).trim()}`,
      text,
      html,
    });

    if (!result.success) {
      return res.status(502).json({
        message:
          "Could not send your message right now. Please try WhatsApp or call the clinic.",
      });
    }

    await writeAuditLog({
      actorEmail: String(email).trim(),
      action: "CONTACT_ENQUIRY",
      entity: "Contact",
      details: `Enquiry from ${String(name).trim()} <${String(email).trim()}>`,
    });

    return res.status(200).json({
      success: true,
      message: "Thanks — your message was sent. We will get back to you soon.",
    });
  } catch (error) {
    console.error("Contact enquiry error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
