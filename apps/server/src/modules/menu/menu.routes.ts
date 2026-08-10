import { Router } from 'express';
import { MenuRepository } from './menu.repository';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { validateRequest } from '../../common/middlewares/validate.middleware';
import { authenticate, authorize } from '../../common/middlewares/auth.middleware';
import { uploadImage } from '../../common/middlewares/upload.middleware';
import {
  createCategorySchema,
  updateCategoryOrderSchema,
  createProductSchema,
  updateProductSchema,
  createOfferSchema,
} from './menu.schema';

const menuRepository = new MenuRepository();
const menuService = new MenuService(menuRepository);
const menuController = new MenuController(menuService);

export const menuRouter = Router();

/**
 * @openapi
 * /menu:
 *   get:
 *     summary: Fetch menu categories, products, and offers for current tenant
 *     tags: [Menu]
 *     responses:
 *       200:
 *         description: Menu payload
 */
menuRouter.get('/', menuController.getMenu);

/**
 * @openapi
 * /menu/categories:
 *   post:
 *     summary: Create a menu category (Manager/Admin)
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Category created
 */
menuRouter.post('/categories', authenticate, authorize(['MANAGER', 'CLUB_ADMIN', 'PLATFORM_ADMIN']), validateRequest(createCategorySchema), menuController.createCategory);

/**
 * @openapi
 * /menu/categories/reorder:
 *   post:
 *     summary: Bulk update category display order (Drag and Drop)
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orders]
 *             properties:
 *               orders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     categoryUuid: { type: string }
 *                     displayOrder: { type: number }
 *     responses:
 *       200:
 *         description: Display order updated
 */
menuRouter.post('/categories/reorder', authenticate, authorize(['MANAGER', 'CLUB_ADMIN', 'PLATFORM_ADMIN']), validateRequest(updateCategoryOrderSchema), menuController.updateCategoryOrders);

/**
 * @openapi
 * /menu/products:
 *   post:
 *     summary: Create a drink/product item (Manager/Admin)
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryUuid, name, price]
 *             properties:
 *               categoryUuid: { type: string }
 *               name: { type: string }
 *               price: { type: number }
 *               imageUrl: { type: string }
 *     responses:
 *       201:
 *         description: Product created
 */
menuRouter.post('/products', authenticate, authorize(['MANAGER', 'CLUB_ADMIN', 'PLATFORM_ADMIN']), validateRequest(createProductSchema), menuController.createProduct);

/**
 * @openapi
 * /menu/products/{productUuid}:
 *   put:
 *     summary: Update product details or price
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product updated
 */
menuRouter.put('/products/:productUuid', authenticate, authorize(['MANAGER', 'CLUB_ADMIN', 'PLATFORM_ADMIN']), validateRequest(updateProductSchema), menuController.updateProduct);

/**
 * @openapi
 * /menu/products/{productUuid}/availability:
 *   patch:
 *     summary: Toggle product availability
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Availability toggled
 */
menuRouter.patch('/products/:productUuid/availability', authenticate, authorize(['MANAGER', 'CLUB_ADMIN', 'PLATFORM_ADMIN']), menuController.toggleAvailability);

/**
 * @openapi
 * /menu/products/{productUuid}:
 *   delete:
 *     summary: Archive (soft delete) a product
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product archived
 */
menuRouter.delete('/products/:productUuid', authenticate, authorize(['MANAGER', 'CLUB_ADMIN', 'PLATFORM_ADMIN']), menuController.archiveProduct);

/**
 * @openapi
 * /menu/upload:
 *   post:
 *     summary: Upload product image
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
menuRouter.post('/upload', authenticate, authorize(['MANAGER', 'CLUB_ADMIN', 'PLATFORM_ADMIN']), uploadImage.single('image'), menuController.uploadImage);

/**
 * @openapi
 * /menu/offers:
 *   post:
 *     summary: Create happy hour or promo offer
 *     tags: [Menu]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, discountValue, startTime, endTime]
 *             properties:
 *               title: { type: string }
 *               discountValue: { type: number }
 *               startTime: { type: string }
 *               endTime: { type: string }
 *     responses:
 *       201:
 *         description: Offer created
 */
menuRouter.post('/offers', authenticate, authorize(['MANAGER', 'CLUB_ADMIN', 'PLATFORM_ADMIN']), validateRequest(createOfferSchema), menuController.createOffer);
