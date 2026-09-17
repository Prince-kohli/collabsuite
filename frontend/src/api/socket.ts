import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

let socket: Socket | null = null;

/**
 * Initialize or retrieve the global Socket.io client connection.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:5000/api/v1';
    // Extract base origin (e.g. http://localhost:5000)
    const socketUrl = new URL(API_BASE_URL).origin;

    socket = io(socketUrl, {
      autoConnect: false,
      withCredentials: true,
      auth: (cb) => {
        const token = useAuthStore.getState().accessToken;
        cb({ token: token ? `Bearer ${token}` : '' });
      },
    });
  }

  return socket;
};

/**
 * Connect socket instance if authenticated.
 */
export const connectSocket = (): void => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
};

/**
 * Disconnect active socket connection.
 */
export const disconnectSocket = (): void => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};