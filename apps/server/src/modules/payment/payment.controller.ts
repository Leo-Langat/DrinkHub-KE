import { Request, Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  initiateMpesa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clubUuid, orderUuid, phoneNumber, amount, accountReference } = req.body;
      const result = await this.paymentService.initiateMpesaStkPush({
        clubUuid,
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
      const { clubUuid, orderUuid, amount, tableNumber } = req.body;
      const result = await this.paymentService.processCardPayment({
        clubUuid,
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
      const { clubUuid, orderUuid, amount, tableNumber, exactCash, customerCashAmount } = req.body;
      const result = await this.paymentService.processCashPayment({
        clubUuid,
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
