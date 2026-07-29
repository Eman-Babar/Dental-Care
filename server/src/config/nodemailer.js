import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT || "587", 10);
  const user = (process.env.EMAIL_USER || "").replace(/^["']|["']$/g, "");
  const pass = (process.env.EMAIL_PASS || "").replace(/^["']|["']$/g, "");

  return { host, port, user, pass };
}

function credentialsLookPlaceholder(user, pass) {
  const bad = [
    "",
    "your_smtp_user",
    "your_smtp_password",
    "changeme",
    "paste_mailtrap_username_here",
    "paste_mailtrap_password_here",
    "your_gmail@gmail.com",
    "your_16_char_app_password",
  ];
  return bad.includes(user) || bad.includes(pass);
}

/** Create transporter when sending so .env is already loaded */
function createTransporter() {
  const { host, port, user, pass } = getSmtpConfig();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    requireTLS: port === 587,
    auth: { user, pass },
  });
}

/**
 * Send an email via SMTP (Gmail App Password / Mailtrap / etc.)
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const { host, user, pass } = getSmtpConfig();

  if (credentialsLookPlaceholder(user, pass)) {
    const message =
      "Email not sent: set real EMAIL_USER and EMAIL_PASS in server/.env (Gmail App Password recommended).";
    console.error(message);
    return { success: false, error: message };
  }

  if (!to) {
    const message = "Email not sent: missing recipient (CLINIC_EMAIL).";
    console.error(message);
    return { success: false, error: message };
  }

  try {
    const transporter = createTransporter();
    const from =
      process.env.EMAIL_FROM ||
      `"Dental Clinic" <${user}>`;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    console.log(
      `Email sent via ${host} → ${to}. Message ID: ${info.messageId}`
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Nodemailer send email failure:", error.message || error);
    if (error.code === "EAUTH") {
      console.error(
        "→ Gmail login failed. Use a Google App Password (not your normal Gmail password), then restart the server."
      );
    }
    return { success: false, error: error.message };
  }
};

export default { sendEmail };
