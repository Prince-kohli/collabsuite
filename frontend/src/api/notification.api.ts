import { apiClient } from './axios';
import type { ApiResponse } from '../types';

export interface NotificationItem {
  _id: string;
  userId: string;
  senderId?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  type: 'mention' | 'card_assign' | 'comment' | 'workspace_invite' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface GetNotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  total: number;
}

export const getMyNotificationsApi = async (
  page = 1,
  limit = 20
): Promise<ApiResponse<GetNotificationsResponse>> => {
  const response = await apiClient.get<ApiResponse<GetNotificationsResponse>>(
    `/notifications?page=${page}&limit=${limit}`
  );
  return response.data;
};

export const markNotificationReadApi = async (
  notificationId: string
): Promise<ApiResponse<{ notification: NotificationItem }>> => {
  const response = await apiClient.patch<ApiResponse<{ notification: NotificationItem }>>(
    `/notifications/${notificationId}/read`
  );
  return response.data;
};

export const markAllNotificationsReadApi = async (): Promise<ApiResponse> => {
  const response = await apiClient.patch<ApiResponse>('/notifications/read-all');
  return response.data;
};

export const deleteNotificationApi = async (id: string): Promise<ApiResponse> => {
  const response = await apiClient.delete<ApiResponse>(`/notifications/${id}`);
  return response.data;
};

export const clearAllNotificationsApi = async (): Promise<ApiResponse> => {
  const response = await apiClient.delete<ApiResponse>('/notifications/clear-all');
  return response.data;
};

export const deleteManyNotificationsApi = async (ids: string[]): Promise<ApiResponse<{ deletedCount: number }>> => {
  const response = await apiClient.post<ApiResponse<{ deletedCount: number }>>(
    '/notifications/delete-many',
    { ids }
  );
  return response.data;
};