/**
 * HTML template for 6-digit OTP verification email.
 */
export const getOtpEmailTemplate = (userName: string, otp: string): string => {
  return `
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
  `;
};