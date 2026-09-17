import { apiClient } from './axios';
import type { ApiResponse, Doc, DocTreeNode } from '../types';

export interface CreateDocPayload {
  workspaceId: string;
  title?: string;
  parentDocId?: string | null;
}

export interface UpdateDocPayload {
  title?: string;
  content?: string;
  icon?: string;
  coverImage?: string;
  isPublic?: boolean;
}

/**
 * Create a new document or sub-document.
 */
export const createDocApi = async (
  payload: CreateDocPayload
): Promise<ApiResponse<{ doc: Doc }>> => {
  const response = await apiClient.post<ApiResponse<{ doc: Doc }>>('/docs', payload);
  return response.data;
};

/**
 * Get workspace document hierarchy tree for Notion sidebar.
 */
export const getDocsTreeApi = async (
  workspaceId: string
): Promise<ApiResponse<{ tree: DocTreeNode[] }>> => {
  const response = await apiClient.get<ApiResponse<{ tree: DocTreeNode[] }>>(
    `/docs/workspace/${workspaceId}/tree`
  );
  return response.data;
};

/**
 * Get document details by ID.
 */
export const getDocByIdApi = async (
  docId: string
): Promise<ApiResponse<{ doc: Doc }>> => {
  const response = await apiClient.get<ApiResponse<{ doc: Doc }>>(`/docs/${docId}`);
  return response.data;
};

/**
 * Update document title/content (Auto-save trigger).
 */
export const updateDocApi = async (
  docId: string,
  payload: UpdateDocPayload
): Promise<ApiResponse<{ doc: Doc }>> => {
  const response = await apiClient.patch<ApiResponse<{ doc: Doc }>>(`/docs/${docId}`, payload);
  return response.data;
};

/**
 * Archive document by ID.
 */
export const archiveDocApi = async (
  docId: string
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/docs/${docId}`);
  return response.data;
};