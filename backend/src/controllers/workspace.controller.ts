import { Request, Response, NextFunction } from 'express';
import { WorkspaceService } from '../services/workspace.service';
import { WorkspaceRole } from '../models/workspace.model';

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

export const updateWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const workspace = await WorkspaceService.updateWorkspace(id, { name, description });

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workspace updated successfully',
      data: { workspace }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    await WorkspaceService.deleteWorkspace(id, userId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workspace deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

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

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const { role } = req.body as { role: WorkspaceRole };
    const requesterId = req.user!.userId;

    const workspace = await WorkspaceService.updateMemberRole(id, memberId, role, requesterId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Member role updated successfully',
      data: { workspace }
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id, memberId } = req.params;
    const requesterId = req.user!.userId;

    const workspace = await WorkspaceService.removeMember(id, memberId, requesterId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Member removed from workspace successfully',
      data: { workspace }
    });
  } catch (error) {
    next(error);
  }
};