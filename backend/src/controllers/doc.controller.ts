import { Request, Response, NextFunction } from 'express';
import { DocService } from '../services/doc.service';

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