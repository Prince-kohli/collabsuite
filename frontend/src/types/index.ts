export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt?: string;
}

export interface WorkspaceMember {
  userId: User | string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joinedAt: string;
}

export interface Workspace {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: User | string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface Card {
  _id: string;
  title: string;
  description?: string;
  listId: string;
  boardId: string;
  position: number;
  labels?: string[];
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface List {
  _id: string;
  title: string;
  boardId: string;
  position: number;
  cards?: Card[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Board {
  _id: string;
  title: string;
  description?: string;
  workspaceId: string;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocTreeNode {
  _id: string;
  title: string;
  icon?: string;
  parentDocId?: string | null;
  children: DocTreeNode[];
  createdAt: string;
  updatedAt: string;
}

export interface Doc {
  _id: string;
  workspaceId: string;
  authorId: User | string;
  title: string;
  content?: string;
  icon?: string;
  coverImage?: string;
  parentDocId?: string | null;
  isArchived?: boolean;
  isPublic?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  _id: string;
  workspaceId: string;
  name: string;
  topic?: string;
  isPrivate?: boolean;
  members?: string[];
  createdAt?: string;
  updatedAt?: string;
  type?: 'channel' | 'dm';
createdBy?: string | { _id: string; name?: string };
}

export interface Message {
  _id: string;
  channelId: string;
  senderId: User | string;
  content: string;
  attachments?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CardAttachment {
  _id?: string;
  name: string;
  url: string;
  size?: number;
  uploadedAt?: string;
}

export interface Card {
  _id: string;
  title: string;
  description?: string;
  listId: string;
  boardId: string;
  position: number;
  labels?: string[];
  dueDate?: string;
  assignees?: Array<User | string | { _id: string; name: string; email: string; avatar?: string }>;
  attachments?: CardAttachment[];
  createdAt?: string;
  updatedAt?: string;
}