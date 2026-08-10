import { Router } from 'express';
import { ReportingService } from './reporting.service';
import { ReportingController } from './reporting.controller';
import { validateRequest } from '../../common/middlewares/validate.middleware';
import { authenticate, authorize } from '../../common/middlewares/auth.middleware';
import { getReportSchema } from './reporting.schema';

const reportingService = new ReportingService();
const reportingController = new ReportingController(reportingService);

export const reportingRouter = Router();

/**
 * @openapi
 * /reports/analytics:
 *   get:
 *     summary: Generate multi-dimensional sales, orders, payment methods, products & waiter analytics report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [DAILY, WEEKLY, MONTHLY, YEARLY] }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [JSON, CSV, EXCEL, PDF] }
 *     responses:
 *       200:
 *         description: Report generated or file stream downloaded
 */
reportingRouter.get(
  '/analytics',
  authenticate,
  authorize(['PLATFORM_ADMIN', 'CLUB_ADMIN', 'MANAGER']),
  validateRequest(getReportSchema),
  reportingController.getAnalytics,
);
