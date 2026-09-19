export const getPasswordResetEmailTemplate = (
  userName: string,
  otp: string
): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Password Reset</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
          <tr>
            <td>
              <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Reset your password</h1>
              <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.5;">
                Hi ${userName}, we received a request to reset your CollabSuite password.
                Use this OTP within <strong>10 minutes</strong>:
              </p>
              <div style="text-align:center;margin:24px 0;">
                <span style="display:inline-block;letter-spacing:8px;font-size:28px;font-weight:700;color:#4f46e5;background:#eef2ff;padding:12px 20px;border-radius:12px;">
                  ${otp}
                </span>
              </div>
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};