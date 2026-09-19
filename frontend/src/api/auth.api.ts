import { apiClient } from './axios';
import type { ApiResponse } from '../types';

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

/**
 * Send password reset OTP to user email.
 */
export const forgotPasswordApi = async (
  email: string
): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>('/auth/forgot-password', {
    email,
  });
  return response.data;
};

/**
 * Reset password using OTP and new password.
 */
export const resetPasswordApi = async (
  payload: ResetPasswordPayload
): Promise<ApiResponse<null>> => {
  const response = await apiClient.post<ApiResponse<null>>(
    '/auth/reset-password',
    payload
  );
  return response.data;
};