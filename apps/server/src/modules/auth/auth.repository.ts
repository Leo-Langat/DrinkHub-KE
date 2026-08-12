import { User, UserSession, RefreshToken, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { IAuthRepository } from './auth.interface';

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { email, deletedAt: null, isActive: true },
    });
  }

  async findById(userUuid: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { userUuid, deletedAt: null, isActive: true },
    });
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { emailVerificationToken: token, deletedAt: null },
    });
  }

  async findByResetPasswordToken(token: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() },
        deletedAt: null,
      },
    });
  }

  async createUser(data: Partial<User>): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email!,
        passwordHash: data.passwordHash!,
        fullName: data.fullName!,
        phone: data.phone,
        role: data.role || UserRole.WAITER,
        clubUuid: data.clubUuid,
        mustChangePassword: data.mustChangePassword || false,
        emailVerificationToken: data.emailVerificationToken,
      },
    });
  }

  async updateUser(userUuid: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { userUuid },
      data,
    });
  }

  async createSession(
    userUuid: string,
    clubUuid?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserSession> {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    return prisma.userSession.create({
      data: {
        userUuid,
        clubUuid,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });
  }

  async invalidateSession(sessionUuid: string): Promise<void> {
    await prisma.userSession.update({
      where: { sessionUuid },
      data: { isValid: false },
    });
  }

  async createRefreshToken(
    sessionUuid: string,
    userUuid: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data: {
        sessionUuid,
        userUuid,
        tokenHash,
        expiresAt,
      },
    });
  }

  async findRefreshToken(tokenHash: string): Promise<(RefreshToken & { session: UserSession; user: User }) | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        session: true,
        user: true,
      },
    });
  }

  async revokeRefreshToken(tokenUuid: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { tokenUuid },
      data: { isRevoked: true },
    });
  }

  async listStaffByClub(clubUuid: string, role?: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        clubUuid,
        deletedAt: null,
        ...(role ? { role: role as UserRole } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { club: true } as any,
    });
  }

  async listAllStaff(role?: string): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(role ? { role: role as UserRole } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: { club: true } as any,
    });
  }
}
