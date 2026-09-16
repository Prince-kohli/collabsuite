import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env';
import { verifyAccessToken } from '../utils/jwt.util';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

export const initializeSocketIO = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true
    }
  });

  // Socket Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication token missing in socket handshake'));
      }

      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.email = payload.email;
      next();
    } catch (error) {
      next(new Error('Authentication failed for socket connection'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket client connected: ${socket.id} (User: ${socket.userId})`);

    // Channel Chat Rooms
    socket.on('join:channel', (channelId: string) => {
      socket.join(`channel:${channelId}`);
      logger.debug(`Socket ${socket.id} joined channel room: channel:${channelId}`);
    });

    socket.on('leave:channel', (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on('typing:start', ({ channelId, userName }: { channelId: string; userName: string }) => {
      socket.to(`channel:${channelId}`).emit('typing:status', {
        userId: socket.userId,
        userName,
        isTyping: true
      });
    });

    socket.on('typing:stop', ({ channelId }: { channelId: string }) => {
      socket.to(`channel:${channelId}`).emit('typing:status', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Trello Board Live Drag-and-Drop Sync
    socket.on('join:board', (boardId: string) => {
      socket.join(`board:${boardId}`);
      logger.debug(`Socket ${socket.id} joined board room: board:${boardId}`);
    });

    socket.on('leave:board', (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });

    socket.on('card:moved', (data: { boardId: string; cardId: string; targetListId: string; newPosition: number }) => {
      socket.to(`board:${data.boardId}`).emit('card:sync', data);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id} (User: ${socket.userId})`);
    });
  });

  return io;
};