import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '../services/workspace.service';

/**
 * Controller handler to create a workspace.
 */
export const createWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = req.user!.userId;
    const workspace = await WorkspaceService.createWorkspace(userId, name, description);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Workspace created successfully',
      data: { workspace }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handler to fetch all user workspaces.
 */
export const getUserWorkspaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const workspaces = await WorkspaceService.getUserWorkspaces(userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'User workspaces retrieved successfully',
      data: { workspaces }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handler to fetch workspace details by ID.
 */
export const getWorkspaceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const workspace = await WorkspaceService.getWorkspaceById(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workspace retrieved successfully',
      data: {
        workspace,
        currentUserRole: req.userWorkspaceRole
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handler to add a member to a workspace.
 */
export const addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const workspace = await WorkspaceService.addMember(id, email, role);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Member added to workspace successfully',
      data: { workspace }
    });
  } catch (error) {
    next(error);
  }
};