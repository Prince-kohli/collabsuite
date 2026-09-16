import { Request, Response, NextFunction } from 'express';
import { Workspace, WorkspaceRole } from '../models/workspace.model';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '../errors/AppError';

/**
 * Middleware factory to authorize user access based on Workspace roles.
 * @param allowedRoles Array of WorkspaceRoles permitted to access the resource.
 */
export const requireWorkspaceRole = (allowedRoles: WorkspaceRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User authentication context missing');
      }

      const workspaceId = req.params.workspaceId || req.params.id || req.body.workspaceId;
      if (!workspaceId) {
        throw new ForbiddenError('Workspace identifier is required for access verification');
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new NotFoundError('Workspace not found');
      }

      const member = workspace.members.find(
        (m) => m.userId.toString() === req.user!.userId
      );

      if (!member) {
        throw new ForbiddenError('You are not a member of this workspace');
      }

      if (!allowedRoles.includes(member.role)) {
        throw new ForbiddenError(`Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`);
      }

      // Attach workspace context to the request object
      req.workspace = workspace;
      req.userWorkspaceRole = member.role;

      next();
    } catch (error) {
      next(error);
    }
  };
};