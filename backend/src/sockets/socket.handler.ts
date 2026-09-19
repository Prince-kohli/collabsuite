import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config/env';
import { verifyAccessToken } from '../utils/jwt.util';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  email?: string;
}

let ioInstance: Server | null = null;
const onlineUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized');
  }
  return ioInstance;
};

export const getOnlineUserIds = (): string[] => {
  return Array.from(onlineUsers.keys());
};

export const initializeSocketIO = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true
    }
  });

  ioInstance = io;

  // Socket Authentication Middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      let token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization;

      if (!token) {
        return next(new Error('Authentication token missing in socket handshake'));
      }

      // Strip 'Bearer ' prefix if present
      if (token.startsWith('Bearer ')) {
        token = token.substring(7);
      }

      const payload = verifyAccessToken(token);
      socket.userId = payload.userId;
      socket.email = payload.email;
      next();
    } catch (error) {
      logger.error(`Socket auth failed: ${error instanceof Error ? error.message : error}`);
      next(new Error('Authentication failed for socket connection'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`Socket client connected: ${socket.id} (User: ${socket.userId})`);

    // Personal room for notifications & online status tracking
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      logger.info(`User ${socket.userId} joined personal socket room: user:${socket.userId}`);

      const userSockets = onlineUsers.get(socket.userId) || new Set<string>();
      const isFirstConnection = userSockets.size === 0;
      userSockets.add(socket.id);
      onlineUsers.set(socket.userId, userSockets);

      if (isFirstConnection) {
        io.emit('user:status', { userId: socket.userId, status: 'online' });
      }

      // Send initial list of all online users to the connected client
      socket.emit('users:online', Array.from(onlineUsers.keys()));
    }

    socket.on('get:online_users', () => {
      socket.emit('users:online', Array.from(onlineUsers.keys()));
    });

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

    socket.on('join:board', (boardId: string) => {
      socket.join(`board:${boardId}`);
      logger.debug(`Socket ${socket.id} joined board room: board:${boardId}`);
    });

    socket.on('leave:board', (boardId: string) => {
      socket.leave(`board:${boardId}`);
    });

    socket.on('join:card', (cardId: string) => {
      socket.join(`card:${cardId}`);
    });

    socket.on('leave:card', (cardId: string) => {
      socket.leave(`card:${cardId}`);
    });

    socket.on(
      'card:moved',
      (data: { boardId: string; cardId: string; targetListId: string; newPosition: number }) => {
        socket.to(`board:${data.boardId}`).emit('card:sync', data);
      }
    );

    socket.on('disconnect', () => {
      logger.info(`Socket client disconnected: ${socket.id} (User: ${socket.userId})`);

      if (socket.userId && onlineUsers.has(socket.userId)) {
        const userSockets = onlineUsers.get(socket.userId)!;
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(socket.userId);
          io.emit('user:status', { userId: socket.userId, status: 'offline' });
        }
      }
    });
  });

  return io;
};

/**
 * Emit notification event to a specific user room.
 */
export const emitToUser = (userId: string, event: string, payload: unknown): void => {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

/**
 * Emit event to everyone viewing a card.
 */
export const emitToCard = (cardId: string, event: string, payload: unknown): void => {
  if (!ioInstance) return;
  ioInstance.to(`card:${cardId}`).emit(event, payload);
};