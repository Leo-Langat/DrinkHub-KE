import { Request, Response, NextFunction } from 'express';
import { OrderService } from './order.service';

export class OrderController {
  constructor(private orderService: OrderService) {}

  getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clubUuid = (req.headers['x-tenant-id'] as string) || (req.query.clubUuid as string);
      const status = req.query.status as any;
      const orders = await this.orderService.getOrdersForClub(clubUuid, status);
      res.json({
        success: true,
        data: orders,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderUuid } = req.params;
      const order = await this.orderService.getOrderById(orderUuid);
      res.json({
        success: true,
        data: order,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clubUuid = (req.headers['x-tenant-id'] as string) || req.body.clubUuid;
      const order = await this.orderService.createOrder(clubUuid, req.body);
      res.status(201).json({
        success: true,
        data: order,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  claim = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderUuid } = req.params;
      const waiterUuid = req.user?.userId || req.body.waiterUuid;
      const order = await this.orderService.claimOrder(orderUuid, waiterUuid);
      res.json({
        success: true,
        data: order,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderUuid } = req.params;
      const { status } = req.body;
      const order = await this.orderService.updateOrderStatus(orderUuid, status);
      res.json({
        success: true,
        data: order,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };
}
