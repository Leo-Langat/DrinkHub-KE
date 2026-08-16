import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { IAuthRepository } from './auth.interface';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../common/utils/jwt';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../../common/errors/app-error';

// OWASP: bcrypt cost factor ≥ 12
const BCRYPT_ROUNDS = 12;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  mustChangePassword: boolean;
  emailVerified: boolean;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null;
    role: string;
    clubUuid?: string | null;
    club?: {
      uuid: string;
      name: string;
      slug: string;
      city?: string;
      county?: string;
      openingHours?: string;
      closingHours?: string;
      brandColor?: string;
    } | null;
  };
}

export class AuthService {
  constructor(private authRepository: IAuthRepository) {}

  async login(
    email: string,
    password: string,
    rememberMe = false,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    // Always fetch the user — even if not found, run a dummy compare to
    // prevent timing-based user enumeration attacks.
    const user = await this.authRepository.findByEmail(email);

    const dummyHash = '$2b$12$invalidhashusedfortimingprotection000000000000000000000000';
    const isMatch = await bcrypt.compare(password, user ? user.passwordHash : dummyHash);

    if (!user || !isMatch) {
      // Generic message — OWASP: do not reveal whether email exists
      throw new UnauthorizedError('Invalid email or password');
    }

    // ── Account checks ───────────────────────────────────────────────────────
    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
    }

    const session = await this.authRepository.createSession(
      user.userUuid,
      user.clubUuid || undefined,
      ipAddress,
      userAgent,
    );

    const payload = {
      userId: user.userUuid,
      tenantId: user.clubUuid || undefined,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const ttlDays = rememberMe ? 30 : 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.authRepository.createRefreshToken(session.sessionUuid, user.userUuid, tokenHash, expiresAt);

    const rawClub = (user as any).club;
    return {
      accessToken,
      refreshToken,
      mustChangePassword: user.mustChangePassword,
      emailVerified: user.emailVerified,
      user: {
        id: user.userUuid,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        clubUuid: user.clubUuid,
        club: rawClub ? {
          uuid: rawClub.clubUuid,
          name: rawClub.name,
          slug: rawClub.slug,
          city: rawClub.city,
          county: rawClub.county,
          openingHours: rawClub.openingHours,
          closingHours: rawClub.closingHours,
          brandColor: rawClub.brandColor,
        } : null,
      },
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = verifyRefreshToken(token);
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const savedToken = await this.authRepository.findRefreshToken(tokenHash);
      if (!savedToken || savedToken.isRevoked || !savedToken.session.isValid || new Date() > savedToken.expiresAt) {
        throw new UnauthorizedError('Refresh token invalid or expired');
      }

      // Rotate: revoke old token, issue new pair
      await this.authRepository.revokeRefreshToken(savedToken.tokenUuid);

      const newAccessToken = generateAccessToken({
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
      });

      const newRefreshToken = generateRefreshToken({
        userId: payload.userId,
        tenantId: payload.tenantId,
        role: payload.role,
      });

      const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.authRepository.createRefreshToken(savedToken.sessionUuid, payload.userId, newTokenHash, expiresAt);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (_err) {
      // Normalize all errors to a single generic message
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const savedToken = await this.authRepository.findRefreshToken(tokenHash);
    if (savedToken) {
      await this.authRepository.revokeRefreshToken(savedToken.tokenUuid);
      await this.authRepository.invalidateSession(savedToken.sessionUuid);
    }
    // Silently succeed even if token not found (idempotent logout)
  }

  async registerUser(data: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    role?: any;
    clubUuid?: string;
    mustChangePassword?: boolean;
  }) {
    const existing = await this.authRepository.findByEmail(data.email);
    if (existing) {
      throw new BadRequestError('An account with that email already exists');
    }

    // Enforce club membership: WAITER, MANAGER, and CLUB_ADMIN must always belong to a club.
    const roleRequiresClub = !data.role || data.role === 'WAITER' || data.role === 'MANAGER' || data.role === 'CLUB_ADMIN';
    if (roleRequiresClub && !data.clubUuid) {
      throw new BadRequestError('A club must be assigned for WAITER and MANAGER accounts');
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.authRepository.createUser({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone,
      role: data.role,
      clubUuid: data.clubUuid,
      mustChangePassword: data.mustChangePassword || false,
      emailVerificationToken,
    });

    // SECURITY: Do NOT return the raw email verification token in the response.
    // In production this should be sent via email only.
    return {
      id: user.userUuid,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      clubUuid: user.clubUuid,
      mustChangePassword: user.mustChangePassword,
      message: 'Account created. Please verify your email before logging in.',
    };
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.authRepository.findByEmailVerificationToken(token);
    if (!user) {
      throw new NotFoundError('Invalid or expired email verification link');
    }

    await this.authRepository.updateUser(user.userUuid, {
      emailVerified: true,
      emailVerificationToken: null,
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.authRepository.findByEmail(email);

    // Always respond the same way to prevent user enumeration
    if (!user) return;

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.authRepository.updateUser(user.userUuid, {
      resetPasswordToken,
      resetPasswordExpires,
    });

    // TODO: Send email with reset link containing `resetPasswordToken`
    // emailService.sendPasswordReset(user.email, resetPasswordToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.authRepository.findByResetPasswordToken(token);
    if (!user) {
      throw new BadRequestError('Password reset token is invalid or has expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.authRepository.updateUser(user.userUuid, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      mustChangePassword: false,
    });
  }

  async changeFirstLoginPassword(userUuid: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.authRepository.findById(userUuid);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestError('New password must be different from your current password');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.authRepository.updateUser(user.userUuid, {
      passwordHash,
      mustChangePassword: false,
    });
  }

  async changePassword(userUuid: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.authRepository.findById(userUuid);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestError('New password must be different from your current password');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.authRepository.updateUser(user.userUuid, {
      passwordHash,
      mustChangePassword: false,
    });
  }

  async listStaff(clubUuid: string, role?: string) {
    const users = await (this.authRepository as any).listStaffByClub(clubUuid, role);
    return users.map((u: any) => ({
      uuid: u.userUuid,
      userUuid: u.userUuid,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      clubUuid: u.clubUuid,
      club: u.club ? { name: u.club.name, uuid: u.club.uuid } : null,
    }));
  }

  async listAllStaff(role?: string) {
    const users = await (this.authRepository as any).listAllStaff(role);
    return users.map((u: any) => ({
      uuid: u.userUuid,
      userUuid: u.userUuid,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      clubUuid: u.clubUuid,
      club: u.club ? { name: u.club.name, uuid: u.club.uuid } : null,
    }));
  }

  async getUserById(userUuid: string) {
    return this.authRepository.findById(userUuid);
  }

  async setUserActive(userUuid: string, isActive: boolean): Promise<void> {
    const user = await this.authRepository.findById(userUuid);
    if (!user) throw new NotFoundError('User not found');
    await this.authRepository.updateUser(userUuid, { isActive });
  }
}
