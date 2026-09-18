import { Request, Response, NextFunction } from 'express';
import { DocService } from '../services/doc.service';
import { DocModel } from '../models/doc.model';
import { Workspace, WorkspaceRole } from '../models/workspace.model';
import { NotFoundError, ForbiddenError } from '../errors/AppError';

/**
 * Helper to verify user permissions for a specific document ID.
 */
const verifyDocWorkspaceAccess = async (
  docId: string,
  userId: string,
  allowedRoles: WorkspaceRole[]
) => {
  const doc = await DocModel.findById(docId);
  if (!doc || doc.isArchived) {
    throw new NotFoundError('Document not found');
  }

  const workspace = await Workspace.findById(doc.workspaceId);
  if (!workspace) {
    throw new NotFoundError('Workspace not found');
  }

  const member = workspace.members.find((m) => m.userId.toString() === userId);
  if (!member) {
    throw new ForbiddenError('You are not a member of this workspace');
  }

  if (!allowedRoles.includes(member.role)) {
    throw new ForbiddenError(
      `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`
    );
  }

  return doc;
};

export const createDoc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workspaceId, title, parentDocId } = req.body;
    const authorId = req.user!.userId;
    const doc = await DocService.createDoc(workspaceId, authorId, title, parentDocId);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Document created successfully',
      data: { doc }
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceDocsTree = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workspaceId } = req.params;
    const tree = await DocService.getWorkspaceDocsTree(workspaceId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Workspace documents tree retrieved successfully',
      data: { tree }
    });
  } catch (error) {
    next(error);
  }
};

export const getDocById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Verify workspace membership for viewer, member, and owner
    await verifyDocWorkspaceAccess(id, userId, ['owner', 'member', 'viewer']);

    const doc = await DocService.getDocById(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Document retrieved successfully',
      data: { doc }
    });
  } catch (error) {
    next(error);
  }
};

export const updateDoc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Verify workspace membership (only owner and member can update)
    await verifyDocWorkspaceAccess(id, userId, ['owner', 'member']);

    const doc = await DocService.updateDoc(id, req.body);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Document updated successfully',
      data: { doc }
    });
  } catch (error) {
    next(error);
  }
};

export const archiveDoc = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    // Verify workspace membership (only owner and member can archive)
    await verifyDocWorkspaceAccess(id, userId, ['owner', 'member']);

    await DocService.archiveDoc(id);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Document archived successfully'
    });
  } catch (error) {
    next(error);
  }
};