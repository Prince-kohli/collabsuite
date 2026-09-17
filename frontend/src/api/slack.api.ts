import { apiClient } from './axios';
import type { ApiResponse, Channel, Message } from '../types';

export interface CreateChannelPayload {
  workspaceId: string;
  name: string;
  topic?: string;
  isPrivate?: boolean;
}

export interface SendMessagePayload {
  channelId: string;
  content: string;
  attachments?: any[];
}

export interface CursorPaginatedMessagesResponse {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Create a new channel in a workspace.
 */
export const createChannelApi = async (
  payload: CreateChannelPayload
): Promise<ApiResponse<{ channel: Channel }>> => {
  const response = await apiClient.post<ApiResponse<{ channel: Channel }>>('/slack/channels', payload);
  return response.data;
};

/**
 * Get all channels accessible by the user in a workspace.
 */
export const getWorkspaceChannelsApi = async (
  workspaceId: string
): Promise<ApiResponse<{ channels: Channel[] }>> => {
  const response = await apiClient.get<ApiResponse<{ channels: Channel[] }>>(
    `/slack/workspace/${workspaceId}/channels`
  );
  return response.data;
};

/**
 * Send a chat message to a channel.
 */
export const sendMessageApi = async (
  payload: SendMessagePayload
): Promise<ApiResponse<{ message: Message }>> => {
  const response = await apiClient.post<ApiResponse<{ message: Message }>>('/slack/messages', payload);
  return response.data;
};

/**
 * Get channel messages with cursor pagination.
 */
export const getChannelMessagesApi = async (
  channelId: string,
  cursor?: string,
  limit: number = 30
): Promise<ApiResponse<CursorPaginatedMessagesResponse>> => {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (cursor) {
    params.append('cursor', cursor);
  }

  const response = await apiClient.get<ApiResponse<CursorPaginatedMessagesResponse>>(
    `/slack/channels/${channelId}/messages?${params.toString()}`
  );
  return response.data;
};