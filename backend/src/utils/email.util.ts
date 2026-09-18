import nodemailer from 'nodemailer';
import { logger } from './logger';
import { getOtpEmailTemplate } from './email-templates/otp.template';
import { getWorkspaceInviteEmailTemplate } from './email-templates/workspace-invite.template';

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
    html: getOtpEmailTemplate(userName, otp),
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP email sent successfully to: ${toEmail}`);
  } catch (error) {
    logger.error('Failed to send OTP email', { error, toEmail });
    throw error;
  }
};

/**
 * Send invitation email to member added to a workspace.
 */
export const sendWorkspaceInviteEmail = async (
  toEmail: string,
  workspaceName: string,
  role: string
): Promise<void> => {
  if (process.env.NODE_ENV === 'test') {
    logger.info(`[Test Mode] Workspace invite email skipped for: ${toEmail}`);
    return;
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const mailOptions = {
    from: `"CollabSuite" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `CollabSuite - You have been added to ${workspaceName}`,
    html: getWorkspaceInviteEmailTemplate(workspaceName, role, clientUrl),
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Workspace invite email sent successfully to: ${toEmail}`);
  } catch (error) {
    logger.error('Failed to send workspace invite email', { error, toEmail });
  }
};