import { apiClient } from './axios';
import type { ApiResponse, Channel, Message } from '../types';

export interface CreateChannelPayload {
  workspaceId: string;
  name: string;
  topic?: string;
  isPrivate?: boolean;
  memberIds?: string[];
}

export interface CreateDMPayload {
  workspaceId: string;
  targetUserId: string;
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

export const createChannelApi = async (
  payload: CreateChannelPayload
): Promise<ApiResponse<{ channel: Channel }>> => {
  const response = await apiClient.post<ApiResponse<{ channel: Channel }>>(
    '/slack/channels',
    payload
  );
  return response.data;
};

export const createOrGetDMApi = async (
  payload: CreateDMPayload
): Promise<ApiResponse<{ channel: Channel }>> => {
  const response = await apiClient.post<ApiResponse<{ channel: Channel }>>(
    '/slack/dms',
    payload
  );
  return response.data;
};

export const getWorkspaceChannelsApi = async (
  workspaceId: string
): Promise<ApiResponse<{ channels: Channel[] }>> => {
  const response = await apiClient.get<ApiResponse<{ channels: Channel[] }>>(
    `/slack/workspace/${workspaceId}/channels`
  );
  return response.data;
};

export const deleteChannelApi = async (
  channelId: string
): Promise<ApiResponse<null>> => {
  const response = await apiClient.delete<ApiResponse<null>>(
    `/slack/channels/${channelId}`
  );
  return response.data;
};

export const sendMessageApi = async (
  payload: SendMessagePayload
): Promise<ApiResponse<{ message: Message }>> => {
  const response = await apiClient.post<ApiResponse<{ message: Message }>>(
    '/slack/messages',
    payload
  );
  return response.data;
};

export const getChannelMessagesApi = async (
  channelId: string,
  cursor?: string,
  limit: number = 30
): Promise<ApiResponse<CursorPaginatedMessagesResponse>> => {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (cursor) params.append('cursor', cursor);

  const response = await apiClient.get<ApiResponse<CursorPaginatedMessagesResponse>>(
    `/slack/channels/${channelId}/messages?${params.toString()}`
  );
  return response.data;
};

export const addChannelMemberApi = async (
  channelId: string,
  memberId: string
): Promise<ApiResponse<{ channel: Channel }>> => {
  const response = await apiClient.post<ApiResponse<{ channel: Channel }>>(
    `/slack/channels/${channelId}/members`,
    { memberId }
  );
  return response.data;
};

export const removeChannelMemberApi = async (
  channelId: string,
  memberId: string
): Promise<ApiResponse<{ channel: Channel }>> => {
  const response = await apiClient.delete<ApiResponse<{ channel: Channel }>>(
    `/slack/channels/${channelId}/members/${memberId}`
  );
  return response.data;
};