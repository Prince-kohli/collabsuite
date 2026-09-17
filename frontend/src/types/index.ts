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
  name: string;
  boardId: string;
  position: number;
  cards?: Card[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Board {
  _id: string;
  name: string;
  description?: string;
  workspaceId: string;
  lists?: List[];
  createdAt?: string;
  updatedAt?: string;
}