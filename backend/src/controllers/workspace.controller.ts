import { Request, Response, NextFunction } from 'express';
import { Workspace } from '../models/workspace.model';
import { User } from '../models/user.model';
import { NotFoundError, BadRequestError, ConflictError } from '../errors/AppError';
import { logger } from '../utils/logger';

/**
 * Helper to generate URL slug from workspace name.
 */
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4);
};

/**
 * Create a new workspace (creator automatically becomes 'owner').
 */
export const createWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description } = req.body;
    const userId = req.user!.userId;

    const slug = generateSlug(name);

    const workspace = await Workspace.create({
      name,
      slug,
      description,
      ownerId: userId,
      members: [
        {
          userId,
          role: 'owner',
          joinedAt: new Date()
        }
      ]
    });

    logger.info(`Workspace created: ${workspace.name} (${workspace._id}) by user ${userId}`);

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
 * Get all workspaces accessible by the logged-in user.
 */
export const getUserWorkspaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const workspaces = await Workspace.find({
      'members.userId': userId
    })
      .populate('ownerId', 'name email avatar')
      .sort({ updatedAt: -1 });

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
 * Get single workspace details with member profiles.
 */
export const getWorkspaceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

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
 * Add or invite a user to workspace with a specified role.
 */
export const addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      throw new NotFoundError(`User with email ${email} not found`);
    }

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    const isMember = workspace.members.some(
      (m) => m.userId.toString() === targetUser._id.toString()
    );

    if (isMember) {
      throw new ConflictError('User is already a member of this workspace');
    }

    workspace.members.push({
      userId: targetUser._id,
      role,
      joinedAt: new Date()
    });

    await workspace.save();

    logger.info(`User ${targetUser.email} added to workspace ${workspace._id} as ${role}`);

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