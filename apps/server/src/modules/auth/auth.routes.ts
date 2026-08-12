import { Router } from 'express';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../common/middlewares/validate.middleware';
import { authenticate, authorize } from '../../common/middlewares/auth.middleware';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  firstLoginPasswordChangeSchema,
} from './auth.schema';

const authRepository = new AuthRepository();
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

export const authRouter = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: User Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               rememberMe: { type: boolean }
 *     responses:
 *       200:
 *         description: JWT Access and Refresh tokens
 */
authRouter.post('/login', validateRequest(loginSchema), authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Rotate refresh token & return new access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Token pair
 */
authRouter.post('/refresh', validateRequest(refreshTokenSchema), authController.refreshToken);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token session
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Logged out
 */
authRouter.post('/logout', validateRequest(refreshTokenSchema), authController.logout);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new venue staff user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, fullName]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               fullName: { type: string }
 *               role: { type: string, enum: [PLATFORM_ADMIN, CLUB_ADMIN, MANAGER, WAITER] }
 *               clubUuid: { type: string }
 *               mustChangePassword: { type: boolean }
 *     responses:
 *       201:
 *         description: Registered user details
 */
// SECURITY: Only authenticated PLATFORM_ADMIN, CLUB_ADMIN, or MANAGER may register new users
// MANAGER can only create WAITER accounts (enforced in the controller)
authRouter.post(
  '/register',
  authenticate,
  authorize(['PLATFORM_ADMIN', 'CLUB_ADMIN', 'MANAGER']),
  validateRequest(registerSchema),
  authController.register,
);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     summary: Verify email using verification token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Email verified successfully
 */
authRouter.post('/verify-email', validateRequest(verifyEmailSchema), authController.verifyEmail);

/**
 * @openapi
 * /auth/request-password-reset:
 *   post:
 *     summary: Request password reset email token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Instructions sent
 */
authRouter.post('/request-password-reset', validateRequest(requestPasswordResetSchema), authController.requestPasswordReset);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successful
 */
authRouter.post('/reset-password', validateRequest(resetPasswordSchema), authController.resetPassword);

/**
 * @openapi
 * /auth/change-first-password:
 *   post:
 *     summary: Force password change on first login
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
authRouter.post('/change-first-password', authenticate, validateRequest(firstLoginPasswordChangeSchema), authController.changeFirstLoginPassword);

/**
 * @openapi
 * /auth/staff:
 *   get:
 *     summary: List all staff users belonging to the authenticated manager's club
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [WAITER, MANAGER, CLUB_ADMIN] }
 *     responses:
 *       200:
 *         description: Array of staff user objects
 */
authRouter.get('/staff', authenticate, authorize(['MANAGER', 'CLUB_ADMIN', 'PLATFORM_ADMIN']), authController.listStaff);

/**
 * @openapi
 * /auth/users/{uuid}/status:
 *   patch:
 *     summary: Toggle a user's active/inactive status
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: User status updated
 */
authRouter.patch('/users/:uuid/status', authenticate, authorize(['PLATFORM_ADMIN', 'CLUB_ADMIN', 'MANAGER']), authController.toggleUserStatus);
