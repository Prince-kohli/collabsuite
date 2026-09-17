import { apiClient } from './axios';
import type { ApiResponse } from '../types';

export interface SearchResultItem {
  id: string;
  title: string;
  type: 'board' | 'card' | 'doc' | 'channel' | 'message';
  snippet?: string;
  url: string;
}

export interface GlobalSearchResponse {
  results: SearchResultItem[];
}

/**
 * Execute global aggregation search across workspace resources.
 */
export const globalSearchApi = async (
  workspaceId: string,
  query: string
): Promise<ApiResponse<GlobalSearchResponse>> => {
  const response = await apiClient.get<ApiResponse<GlobalSearchResponse>>('/search', {
    params: { workspaceId, q: query },
  });
  return response.data;
};