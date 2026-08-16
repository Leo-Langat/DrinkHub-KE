import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, rememberMe } = req.body;
      const ipAddress = req.ip;
      const userAgent = req.headers['user-agent'];

      const result = await this.authService.login(email, password, rememberMe, ipAddress, userAgent);
      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const tokens = await this.authService.refreshToken(refreshToken);
      res.json({
        success: true,
        data: tokens,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }
      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const callerUserId = (req.user as any)?.userId || (req.user as any)?.id;
      const callerRole = (req.user as any)?.role;
      let callerClubUuid = (req.user as any)?.tenantId || (req.user as any)?.clubUuid;

      let body = { ...req.body };

      // SECURITY: A MANAGER or CLUB_ADMIN may only create WAITER accounts for their own club.
      if (callerRole === 'MANAGER' || callerRole === 'CLUB_ADMIN') {
        if (body.role && body.role !== 'WAITER') {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Managers can only create WAITER accounts' },
          });
          return;
        }

        // Fallback: If clubUuid wasn't in token payload, fetch from DB user record
        if (!callerClubUuid && callerUserId) {
          const callerDbUser = await this.authService.getUserById(callerUserId);
          if (callerDbUser?.clubUuid) {
            callerClubUuid = callerDbUser.clubUuid;
          }
        }

        // Guard: manager must have a club assigned in their account
        if (!callerClubUuid) {
          res.status(400).json({
            success: false,
            error: { code: 'NO_CLUB', message: 'Your account is not assigned to a club. Contact your administrator.' },
          });
          return;
        }

        // ALWAYS force role=WAITER and clubUuid=manager's club.
        // Ignore any clubUuid the client may have sent — a waiter must
        // belong to exactly the same club as the manager who created them.
        body.role = 'WAITER';
        body.clubUuid = callerClubUuid;
      }

      const user = await this.authService.registerUser(body);
      res.status(201).json({
        success: true,
        data: user,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };


  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.body;
      await this.authService.verifyEmail(token);
      res.json({
        success: true,
        data: { message: 'Email verified successfully' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      await this.authService.requestPasswordReset(email);
      // Always respond the same way to prevent user enumeration
      res.json({
        success: true,
        data: { message: 'If an account with that email exists, password reset instructions have been sent.' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      await this.authService.resetPassword(token, newPassword);
      res.json({
        success: true,
        data: { message: 'Password reset successfully' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  changeFirstLoginPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;
      await this.authService.changeFirstLoginPassword(userId!, currentPassword, newPassword);
      res.json({
        success: true,
        data: { message: 'Password changed successfully' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;
      await this.authService.changePassword(userId!, currentPassword, newPassword);
      res.json({
        success: true,
        data: { message: 'Password changed successfully' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  listStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = (req.user as any)?.role;
      const clubUuid = (req.user as any)?.tenantId ?? (req.query.clubUuid as string);
      const { role } = req.query as { role?: string };

      let staff: any[];

      if (userRole === 'PLATFORM_ADMIN' && !clubUuid) {
        // Platform admin sees all staff across all clubs
        staff = await this.authService.listAllStaff(role);
      } else {
        if (!clubUuid) {
          res.status(400).json({ success: false, error: { code: 'MISSING_CLUB', message: 'Club UUID is required' } });
          return;
        }
        staff = await this.authService.listStaff(clubUuid, role);
      }

      res.json({
        success: true,
        data: { staff },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  toggleUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uuid } = req.params;
      const { isActive } = req.body as { isActive: boolean };

      if (typeof isActive !== 'boolean') {
        res.status(400).json({ success: false, error: { code: 'INVALID_BODY', message: 'isActive must be a boolean' } });
        return;
      }

      await (this.authService as any).setUserActive(uuid, isActive);

      res.json({
        success: true,
        data: { message: `User ${isActive ? 'activated' : 'deactivated'} successfully` },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };
}
