import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send 6-digit OTP verification email to newly registered user.
 */
export const sendOtpEmail = async (
  toEmail: string,
  userName: string,
  otp: string
): Promise<void> => {
  if (process.env.NODE_ENV === 'test') {
    logger.info(`[Test Mode] OTP email skipped for: ${toEmail}`);
    return;
  }

  const mailOptions = {
    from: `"CollabSuite" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'CollabSuite - Verification OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; margin-bottom: 8px;">CollabSuite Verification</h2>
        <p style="color: #334155; font-size: 14px; margin-bottom: 20px;">Hello ${userName}, use the following 6-digit OTP to complete your account registration:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center;">This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent successfully to: ${toEmail}`);
  } catch (error) {
    logger.error('Failed to send OTP email', { error, toEmail });
    throw error;
  }
};