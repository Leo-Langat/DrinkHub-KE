import { Request, Response, NextFunction } from 'express';
import { ReportingService } from './reporting.service';

export class ReportingController {
  constructor(private reportingService: ReportingService) {}

  getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = (req.user as any)?.role;
      const userClubUuid = req.user?.tenantId || (req.user as any)?.clubUuid;
      let clubUuid = (req.headers['x-tenant-id'] as string) || (req.query.clubUuid as string) || userClubUuid;

      // SECURITY: A Club Admin (Owner), Manager, or Waiter can ONLY query analytics for their specific club
      if (userRole === 'CLUB_ADMIN' || userRole === 'MANAGER' || userRole === 'WAITER') {
        clubUuid = userClubUuid || clubUuid;
      }

      if (!clubUuid) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_CLUB', message: 'Club UUID is required to fetch analytics.' },
        });
        return;
      }

      const period = (req.query.period as any) || 'MONTHLY';
      const format = (req.query.format as string) || 'JSON';

      const data = await this.reportingService.generateAnalyticsReport(clubUuid, period);

      if (format === 'CSV') {
        const csvContent = this.reportingService.generateCsvReport(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=DrinkHub_Report_${period}_${Date.now()}.csv`);
        res.send(csvContent);
        return;
      }

      res.json({
        success: true,
        data,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };
}
