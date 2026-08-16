import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import { prisma } from '../../config/prisma';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Access token required');
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;

    // Asynchronously touch user's active session to keep online status fresh
    if (payload.userId) {
      prisma.userSession.updateMany({
        where: {
          userUuid: payload.userId,
          isValid: true,
          expiresAt: { gt: new Date() },
        },
        data: {
          updatedAt: new Date(),
        },
      }).catch(() => {});
    }

    next();
  } catch (_err) {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions for this resource');
    }
    next();
  };
};
