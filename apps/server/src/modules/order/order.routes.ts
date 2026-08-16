import { Router } from 'express';
import { OrderRepository } from './order.repository';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { validateRequest } from '../../common/middlewares/validate.middleware';
import { authenticate, authorize } from '../../common/middlewares/auth.middleware';
import {
  createOrderSchema,
  claimOrderSchema,
  updateOrderStatusSchema,
} from './order.schema';

const orderRepository = new OrderRepository();
const orderService = new OrderService(orderRepository);
const orderController = new OrderController(orderService);

export const orderRouter = Router();

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: List orders for current venue tenant
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: Array of orders
 */
orderRouter.get('/', orderController.getOrders);

/**
 * @openapi
 * /orders/my-active:
 *   get:
 *     summary: Fetch current active claimed order for the authenticated waiter
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active claimed order or null
 */
orderRouter.get('/my-active', authenticate, orderController.getMyActiveOrder);

/**
 * @openapi
 * /orders/{orderUuid}:
 *   get:
 *     summary: Fetch single order by UUID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order details
 */
orderRouter.get('/:orderUuid', orderController.getById);

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items]
 *             properties:
 *               tableUuid: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productUuid, quantity]
 *                   properties:
 *                     productUuid: { type: string }
 *                     quantity: { type: number }
 *                     notes: { type: string }
 *     responses:
 *       201:
 *         description: Order created
 */
orderRouter.post('/', validateRequest(createOrderSchema), orderController.create);

/**
 * @openapi
 * /orders/{orderUuid}/claim:
 *   post:
 *     summary: Claim an unassigned pending order (Waiter can claim only 1 active order)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order claimed by waiter
 */
orderRouter.post('/:orderUuid/claim', authenticate, authorize(['WAITER', 'MANAGER', 'CLUB_ADMIN', 'PLATFORM_ADMIN']), validateRequest(claimOrderSchema), orderController.claim);

/**
 * @openapi
 * /orders/{orderUuid}/status:
 *   patch:
 *     summary: Update order status (PENDING, CLAIMED, PREPARING, READY, DELIVERED, COMPLETED, CANCELLED)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderUuid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Order status updated
 */
orderRouter.patch('/:orderUuid/status', authenticate, authorize(['WAITER', 'MANAGER', 'CLUB_ADMIN', 'PLATFORM_ADMIN']), validateRequest(updateOrderStatusSchema), orderController.updateStatus);
