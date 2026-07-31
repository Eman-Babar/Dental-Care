import crypto from "crypto";
import prisma from "../config/prisma.js";
import { sendEmail } from "../config/nodemailer.js";
import { getClientUrl } from "./brand.js";
import { buildBrandedEmail } from "./emailTemplates.js";

const RESET_HOURS = 24;

/**
 * Create a one-time reset token and email a set/reset password link.
 * @param {object} user - Prisma user
 * @param {"reset"|"welcome"} kind
 */
export async function sendPasswordSetupEmail(user, kind = "reset") {
  if (!user?.email) {
    return { success: false, error: "No email" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + RESET_HOURS * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    },
  });

  const link = `${getClientUrl()}/reset-password?token=${token}`;
  const isWelcome = kind === "welcome";

  const { brand, html, text } = await buildBrandedEmail({
    title: isWelcome ? "Your patient account" : "Reset your password",
    intro: isWelcome
      ? `Hello ${user.name || "there"}, thanks for booking with us. We created a patient account for you — set a password to sign in (link expires in 24 hours).`
      : `Hello ${user.name || "there"}, we received a request to reset your password. Use the button below (expires in 24 hours). If you did not request this, ignore this email.`,
    cta: {
      label: isWelcome ? "Set password" : "Reset password",
      url: link,
    },
    footerNote: isWelcome
      ? "After setting a password you can view appointments and leave reviews."
      : undefined,
  });

  return sendEmail({
    to: user.email,
    subject: isWelcome
      ? `Your ${brand} patient account`
      : `Reset your ${brand} password`,
    text,
    html,
  });
}
