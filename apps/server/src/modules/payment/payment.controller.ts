import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  initiateMpesa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid =
        req.businessUuid ||
        req.user?.businessUuid ||
        req.user?.tenantId ||
        req.body.businessUuid ||
        req.body.clubUuid;

      const { orderUuid, phoneNumber, amount, accountReference } = req.body;
      const result = await this.paymentService.initiateMpesaStkPush({
        businessUuid,
        orderUuid,
        phoneNumber,
        amount,
        accountReference,
      });

      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  handleMpesaCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.paymentService.handleMpesaCallback(req.body);
      res.json({
        ResultCode: 0,
        ResultDesc: 'Accept Service',
      });
    } catch (error) {
      next(error);
    }
  };

  processCard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid =
        req.businessUuid ||
        req.user?.businessUuid ||
        req.user?.tenantId ||
        req.body.businessUuid ||
        req.body.clubUuid;

      const { orderUuid, amount, tableNumber } = req.body;
      const result = await this.paymentService.processCardPayment({
        businessUuid,
        orderUuid,
        amount,
        tableNumber,
      });

      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  processCash = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid =
        req.businessUuid ||
        req.user?.businessUuid ||
        req.user?.tenantId ||
        req.body.businessUuid ||
        req.body.clubUuid;

      const { orderUuid, amount, tableNumber, exactCash, customerCashAmount } = req.body;
      const result = await this.paymentService.processCashPayment({
        businessUuid,
        orderUuid,
        amount,
        tableNumber,
        exactCash,
        customerCashAmount,
      });

      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  getPayments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = (req.user?.role || '').toUpperCase();
      let businessUuid: string;

      if (userRole === 'SUPER_ADMIN') {
        businessUuid = (req.query.businessUuid as string) || (req.query.clubUuid as string) || req.businessUuid || req.user?.businessUuid || '';
      } else {
        businessUuid = req.user?.businessUuid || req.user?.tenantId || (req.user as any)?.clubUuid || req.businessUuid || '';
      }

      if (!businessUuid) {
        res.status(400).json({ success: false, error: { code: 'MISSING_BUSINESS', message: 'Business UUID is required' } });
        return;
      }

      const { paymentMethod, paymentStatus, startDate, endDate, limit, page } = req.query as {
        paymentMethod?: string;
        paymentStatus?: any;
        startDate?: string;
        endDate?: string;
        limit?: string;
        page?: string;
      };

      const parsedLimit = limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 50;
      const parsedPage = page ? Math.max(1, parseInt(page, 10)) : 1;
      const offset = (parsedPage - 1) * parsedLimit;

      const result = await this.paymentService.getPaymentsForBusiness({
        businessUuid,
        paymentMethod,
        paymentStatus,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: parsedLimit,
        offset,
      });

      res.json({
        success: true,
        data: {
          payments: result.payments,
          total: result.total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(result.total / parsedLimit),
        },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { paymentUuid } = req.params;
      const { status } = req.body;
      const payment = await this.paymentService.updateStatus(paymentUuid, status);
      res.json({
        success: true,
        data: payment,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };
}
