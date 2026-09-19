import { apiClient } from './axios';
import type { ApiResponse, Workspace } from '../types';

export interface CreateWorkspacePayload {
  name: string;
  description?: string;
}

export interface UpdateWorkspacePayload {
  name?: string;
  description?: string;
}

export interface AddMemberPayload {
  email: string;
  role: 'member' | 'viewer';
}

export interface UpdateMemberRolePayload {
  role: 'owner' | 'member' | 'viewer';
}

export interface WorkspaceDetailsResponse {
  workspace: Workspace;
  currentUserRole: 'owner' | 'member' | 'viewer';
}

export const getUserWorkspacesApi = async (): Promise<
  ApiResponse<{ workspaces: Workspace[] }>
> => {
  const response = await apiClient.get<ApiResponse<{ workspaces: Workspace[] }>>('/workspaces');
  return response.data;
};

export const getWorkspaceByIdApi = async (
  workspaceId: string
): Promise<ApiResponse<WorkspaceDetailsResponse>> => {
  const response = await apiClient.get<ApiResponse<WorkspaceDetailsResponse>>(
    `/workspaces/${workspaceId}`
  );
  return response.data;
};

export const createWorkspaceApi = async (
  payload: CreateWorkspacePayload
): Promise<ApiResponse<{ workspace: Workspace }>> => {
  const response = await apiClient.post<ApiResponse<{ workspace: Workspace }>>(
    '/workspaces',
    payload
  );
  return response.data;
};

export const updateWorkspaceApi = async (
  workspaceId: string,
  payload: UpdateWorkspacePayload
): Promise<ApiResponse<{ workspace: Workspace }>> => {
  const response = await apiClient.patch<ApiResponse<{ workspace: Workspace }>>(
    `/workspaces/${workspaceId}`,
    payload
  );
  return response.data;
};

export const deleteWorkspaceApi = async (
  workspaceId: string
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/workspaces/${workspaceId}`);
  return response.data;
};

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

export const updateWorkspaceMemberRoleApi = async (
  workspaceId: string,
  memberId: string,
  payload: UpdateMemberRolePayload
): Promise<ApiResponse<{ workspace: Workspace }>> => {
  const response = await apiClient.patch<ApiResponse<{ workspace: Workspace }>>(
    `/workspaces/${workspaceId}/members/${memberId}`,
    payload
  );
  return response.data;
};

export const removeWorkspaceMemberApi = async (
  workspaceId: string,
  memberId: string
): Promise<ApiResponse<{ workspace: Workspace }>> => {
  const response = await apiClient.delete<ApiResponse<{ workspace: Workspace }>>(
    `/workspaces/${workspaceId}/members/${memberId}`
  );
  return response.data;
};