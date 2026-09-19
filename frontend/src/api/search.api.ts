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
  cards?: unknown[];
  docs?: unknown[];
  messages?: unknown[];
}

/**
 * Execute global aggregation search across workspace resources.
 * Backend route: GET /search/workspace/:workspaceId?q=
 */
export const globalSearchApi = async (
  workspaceId: string,
  query: string
): Promise<ApiResponse<GlobalSearchResponse>> => {
  const response = await apiClient.get<ApiResponse<GlobalSearchResponse>>(
    `/search/workspace/${workspaceId}`,
    {
      params: { q: query }
    }
  );
  return response.data;
};