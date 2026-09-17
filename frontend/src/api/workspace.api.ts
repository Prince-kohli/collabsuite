import { apiClient } from './axios';
import type { ApiResponse, Workspace } from '../types';

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
}

export interface AddMemberPayload {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface WorkspaceDetailsResponse {
  workspace: Workspace;
  currentUserRole: 'owner' | 'admin' | 'member' | 'viewer';
}

/**
 * Fetch all workspaces accessible by the current authenticated user.
 */
export const getUserWorkspacesApi = async (): Promise<ApiResponse<{ workspaces: Workspace[] }>> => {
  const response = await apiClient.get<ApiResponse<{ workspaces: Workspace[] }>>('/workspaces');
  return response.data;
};

/**
 * Fetch a single workspace by ID with member details and current user role.
 */
export const getWorkspaceByIdApi = async (
  workspaceId: string
): Promise<ApiResponse<WorkspaceDetailsResponse>> => {
  const response = await apiClient.get<ApiResponse<WorkspaceDetailsResponse>>(`/workspaces/${workspaceId}`);
  return response.data;
};

/**
 * Create a new workspace.
 */
export const createWorkspaceApi = async (
  payload: CreateWorkspacePayload
): Promise<ApiResponse<{ workspace: Workspace }>> => {
  const response = await apiClient.post<ApiResponse<{ workspace: Workspace }>>('/workspaces', payload);
  return response.data;
};

/**
 * Invite or add a member to an existing workspace.
 */
export const addWorkspaceMemberApi = async (
  workspaceId: string,
  payload: AddMemberPayload
): Promise<ApiResponse<{ workspace: Workspace }>> => {
  const response = await apiClient.post<ApiResponse<{ workspace: Workspace }>>(
    `/workspaces/${workspaceId}/members`,
    payload
  );
  return response.data;
};