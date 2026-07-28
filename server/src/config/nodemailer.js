import nodemailer from 'nodemailer';

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT || '2525', 10),
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

// Helper function to send email
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Dental Clinic" <no-reply@dentalcare.com>',
      to,
      subject,
      text,
      html,
    });
    console.log(`Email sent successfully. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Nodemailer send email failure:', error);
    return { success: false, error: error.message };
  }
};

export default transporter;
