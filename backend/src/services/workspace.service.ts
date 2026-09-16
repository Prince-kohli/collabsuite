import { Workspace, IWorkspace, WorkspaceRole } from '../models/workspace.model';
import { User } from '../models/user.model';
import { NotFoundError, ConflictError } from '../errors/AppError';
import { logger } from '../utils/logger';

export class WorkspaceService {
  /**
   * Helper function to generate slug from name.
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now().toString().slice(-4);
  }

  /**
   * Create a new workspace and make creator the owner.
   */
  public static async createWorkspace(userId: string, name: string, description?: string): Promise<IWorkspace> {
    const slug = this.generateSlug(name);

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
    return workspace;
  }

  /**
   * Get all workspaces accessible by user.
   */
  public static async getUserWorkspaces(userId: string): Promise<IWorkspace[]> {
    return Workspace.find({ 'members.userId': userId })
      .populate('ownerId', 'name email avatar')
      .sort({ updatedAt: -1 });
  }

  /**
   * Get workspace details by ID.
   */
  public static async getWorkspaceById(workspaceId: string): Promise<IWorkspace> {
    const workspace = await Workspace.findById(workspaceId)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    return workspace;
  }

  /**
   * Add a member to a workspace.
   */
  public static async addMember(workspaceId: string, email: string, role: WorkspaceRole): Promise<IWorkspace> {
    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      throw new NotFoundError(`User with email ${email} not found`);
    }

    const workspace = await Workspace.findById(workspaceId);
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

    return workspace;
  }
}