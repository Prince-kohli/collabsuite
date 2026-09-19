import { Workspace, IWorkspace, WorkspaceRole } from '../models/workspace.model';
import { User } from '../models/user.model';
import { Board } from '../models/board.model';
import { List } from '../models/list.model';
import { Card } from '../models/card.model';
import { Channel } from '../models/channel.model';
import { Message } from '../models/message.model';
import { DocModel } from '../models/doc.model';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError
} from '../errors/AppError';
import { sendWorkspaceInviteEmail } from '../utils/email.util';
import { logger } from '../utils/logger';

export class WorkspaceService {
  private static generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Date.now().toString().slice(-4)
    );
  }

  public static async createWorkspace(
    userId: string,
    name: string,
    description?: string
  ): Promise<IWorkspace> {
    const slug = this.generateSlug(name);

    const workspace = await Workspace.create({
      name,
      slug,
      description,
      ownerId: userId,
      members: [{ userId, role: 'owner', joinedAt: new Date() }]
    });

    await workspace.populate('ownerId', 'name email avatar');
    await workspace.populate('members.userId', 'name email avatar');

    logger.info(`Workspace created: ${workspace.name} (${workspace._id}) by user ${userId}`);
    return workspace;
  }

  public static async getUserWorkspaces(userId: string): Promise<IWorkspace[]> {
    return Workspace.find({ 'members.userId': userId })
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar')
      .sort({ updatedAt: -1 });
  }

  public static async getWorkspaceById(workspaceId: string): Promise<IWorkspace> {
    const workspace = await Workspace.findById(workspaceId)
      .populate('ownerId', 'name email avatar')
      .populate('members.userId', 'name email avatar');

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    return workspace;
  }

  public static async updateWorkspace(
    workspaceId: string,
    data: { name?: string; description?: string }
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    if (data.name && data.name.trim()) {
      workspace.name = data.name.trim();
    }

    if (typeof data.description === 'string') {
      workspace.description = data.description;
    }

    await workspace.save();
    await workspace.populate('ownerId', 'name email avatar');
    await workspace.populate('members.userId', 'name email avatar');

    logger.info(`Workspace updated: ${workspace._id}`);
    return workspace;
  }

  public static async deleteWorkspace(
    workspaceId: string,
    requesterId: string
  ): Promise<void> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    const requester = workspace.members.find((m) => m.userId.toString() === requesterId);
    if (!requester || requester.role !== 'owner') {
      throw new ForbiddenError('Only a workspace owner can delete this workspace');
    }

    const boards = await Board.find({ workspaceId }).select('_id');
    const boardIds = boards.map((b) => b._id);

    if (boardIds.length > 0) {
      const lists = await List.find({ boardId: { $in: boardIds } }).select('_id');
      const listIds = lists.map((l) => l._id);
      await Card.deleteMany({ boardId: { $in: boardIds } });
      await List.deleteMany({ _id: { $in: listIds } });
      await Board.deleteMany({ _id: { $in: boardIds } });
    }

    const channels = await Channel.find({ workspaceId }).select('_id');
    const channelIds = channels.map((c) => c._id);
    if (channelIds.length > 0) {
      await Message.deleteMany({ channelId: { $in: channelIds } });
      await Channel.deleteMany({ _id: { $in: channelIds } });
    }

    await DocModel.deleteMany({ workspaceId });
    await Workspace.findByIdAndDelete(workspaceId);

    logger.info(`Workspace deleted: ${workspaceId} by ${requesterId}`);
  }

  public static async addMember(
    workspaceId: string,
    email: string,
    role: WorkspaceRole
  ): Promise<IWorkspace> {
    if (role === 'owner') {
      throw new BadRequestError('Invite with member or viewer only. Promote to owner from settings.');
    }

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
    await workspace.populate('ownerId', 'name email avatar');
    await workspace.populate('members.userId', 'name email avatar');

    logger.info(`User ${targetUser.email} added to workspace ${workspace._id} as ${role}`);
    await sendWorkspaceInviteEmail(targetUser.email, workspace.name, role);

    return workspace;
  }

  /**
   * Owner can set role to owner | member | viewer.
   * Primary creator (ownerId) role cannot be changed.
   */
  public static async updateMemberRole(
    workspaceId: string,
    memberUserId: string,
    newRole: WorkspaceRole,
    requesterId: string
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    const requester = workspace.members.find((m) => m.userId.toString() === requesterId);
    if (!requester || requester.role !== 'owner') {
      throw new ForbiddenError('Only a workspace owner can change member roles');
    }

    const target = workspace.members.find((m) => m.userId.toString() === memberUserId);
    if (!target) {
      throw new NotFoundError('Member not found in this workspace');
    }

    // Protect primary workspace creator
    if (workspace.ownerId.toString() === memberUserId) {
      throw new ForbiddenError('Cannot change the primary workspace owner role');
    }

    target.role = newRole;
    await workspace.save();
    await workspace.populate('ownerId', 'name email avatar');
    await workspace.populate('members.userId', 'name email avatar');

    logger.info(
      `Member ${memberUserId} role set to ${newRole} in workspace ${workspaceId} by ${requesterId}`
    );
    return workspace;
  }

  /**
   * Owner can remove members. Cannot remove primary creator (ownerId).
   */
  public static async removeMember(
    workspaceId: string,
    memberUserId: string,
    requesterId: string
  ): Promise<IWorkspace> {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    const requester = workspace.members.find((m) => m.userId.toString() === requesterId);
    if (!requester || requester.role !== 'owner') {
      throw new ForbiddenError('Only a workspace owner can remove members');
    }

    if (workspace.ownerId.toString() === memberUserId) {
      throw new ForbiddenError('Cannot remove the primary workspace owner');
    }

    if (memberUserId === requesterId) {
      throw new BadRequestError('You cannot remove yourself');
    }

    const target = workspace.members.find((m) => m.userId.toString() === memberUserId);
    if (!target) {
      throw new NotFoundError('Member not found in this workspace');
    }

    workspace.members = workspace.members.filter(
      (m) => m.userId.toString() !== memberUserId
    );

    await workspace.save();
    await workspace.populate('ownerId', 'name email avatar');
    await workspace.populate('members.userId', 'name email avatar');

    logger.info(
      `Member ${memberUserId} removed from workspace ${workspaceId} by ${requesterId}`
    );
    return workspace;
  }
}