import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './config/swagger';
import { tenantMiddleware } from './common/middlewares/tenant.middleware';
import { errorHandler } from './common/middlewares/error.middleware';

import { tenantRouter } from './modules/tenant/tenant.routes';
import { authRouter } from './modules/auth/auth.routes';
import { menuRouter } from './modules/menu/menu.routes';
import { orderRouter } from './modules/order/order.routes';
import { paymentRouter } from './modules/payment/payment.routes';
import { notificationRouter } from './modules/notification/notification.routes';
import { reportingRouter } from './modules/reporting/reporting.routes';

export const createApp = (): Application => {
  const app = express();

  // ── CORS: allow all registered frontend origins ──────────────────────────
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, health checks)
        if (!origin) return callback(null, true);
        // Support wildcard '*' or exact origin match
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
    }),
  );

  // ── Helmet: security headers ──────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(express.json({ limit: '10kb' }));           // reject giant payloads
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use('/uploads', express.static('uploads'));

  // ── Global rate limiter (all routes) ─────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } },
  });
  app.use(globalLimiter);

  // ── Strict auth rate limiter (login / password-reset) ─────────────────────
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // 15 min window
    max: 10,                     // max 10 attempts per IP
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // only count failures
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many login attempts. Please wait 15 minutes before trying again.',
      },
    },
  });

  // ── Multi-Tenant Context Resolver ─────────────────────────────────────────
  app.use(tenantMiddleware);

  // ── Swagger (dev only) ────────────────────────────────────────────────────
  if (env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  // ── Health Check ──────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), environment: env.NODE_ENV });
  });

  // ── API v1 Router ─────────────────────────────────────────────────────────
  const v1Router = express.Router();

  // Auth routes get their own strict rate limiter on sensitive endpoints
  v1Router.use('/auth/login', authLimiter);
  v1Router.use('/auth/request-password-reset', authLimiter);
  v1Router.use('/auth/reset-password', authLimiter);

  v1Router.use('/tenants', tenantRouter);
  v1Router.use('/auth', authRouter);
  v1Router.use('/menu', menuRouter);
  v1Router.use('/orders', orderRouter);
  v1Router.use('/payments', paymentRouter);
  v1Router.use('/notifications', notificationRouter);
  v1Router.use('/reports', reportingRouter);

  app.use('/api/v1', v1Router);

  // ── Global Error Handler ──────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};
