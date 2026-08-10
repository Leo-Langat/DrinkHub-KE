import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './env';
import { logger } from './logger';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`🔌 Realtime client connected: ${socket.id}`);

    socket.on('join_tenant', (tenantId: string) => {
      socket.join(`tenant:${tenantId}`);
      logger.info(`Socket ${socket.id} joined tenant room: tenant:${tenantId}`);
    });

    socket.on('join_kitchen', (tenantId: string) => {
      socket.join(`tenant:${tenantId}:kitchen`);
      logger.info(`Socket ${socket.id} joined kitchen room: tenant:${tenantId}:kitchen`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Realtime client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized!');
  }
  return io;
};
