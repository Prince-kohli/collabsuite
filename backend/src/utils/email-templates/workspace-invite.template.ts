
export const getWorkspaceInviteEmailTemplate = (
  workspaceName: string,
  role: string,
  clientUrl: string
): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #4f46e5; margin-bottom: 8px;">CollabSuite Invitation</h2>
      <p style="color: #334155; font-size: 14px; margin-bottom: 20px;">You have been added to the workspace <strong>${workspaceName}</strong> as a <strong>${role}</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${clientUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Open Workspace
        </a>
      </div>
      <p style="color: #64748b; font-size: 12px; text-align: center;">Log in to access boards, docs, and team channels.</p>
    </div>
  `;
};