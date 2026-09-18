/**
 * HTML template for in-app notification email.
 */
export const getNotificationEmailTemplate = (
  title: string,
  message: string,
  actionUrl: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin-bottom: 8px;">CollabSuite</h2>
      <h3 style="color: #0f172a; margin: 0 0 12px 0;">${title}</h3>
      <p style="color: #334155; font-size: 14px; margin-bottom: 20px;">${message}</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${actionUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Open in CollabSuite
        </a>
      </div>
      <p style="color: #64748b; font-size: 12px; text-align: center;">You received this because of activity in your workspace.</p>
    </div>
  `;
};