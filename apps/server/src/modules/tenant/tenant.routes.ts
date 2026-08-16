import { Router } from 'express';
import { TenantRepository } from './tenant.repository';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { validateRequest } from '../../common/middlewares/validate.middleware';
import { authenticate, authorize } from '../../common/middlewares/auth.middleware';
import {
  createClubSchema,
  createClubWithManagerSchema,
  updateClubSchema,
  assignManagerSchema,
  generateQrCodesSchema,
} from './tenant.schema';

const tenantRepository = new TenantRepository();
const tenantService = new TenantService(tenantRepository);
const tenantController = new TenantController(tenantService);

export const tenantRouter = Router();

/**
 * @openapi
 * /tenants:
 *   get:
 *     summary: List all active clubs/venues
 *     tags: [Tenants]
 *     responses:
 *       200:
 *         description: Array of venue tenant objects
 */
tenantRouter.get('/', tenantController.getAll);

/**
 * @openapi
 * /tenants/{slug}:
 *   get:
 *     summary: Fetch single venue by unique slug
 *     tags: [Tenants]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tenant details
 */
tenantRouter.get('/:slug', tenantController.getBySlug);

/**
 * @openapi
 * /tenants/provision:
 *   post:
 *     summary: Unified Club + Manager provisioning (Platform Admin §23–24)
 *     description: |
 *       Creates a Club and its initial Manager account atomically in a single
 *       database transaction. The manager receives mustChangePassword=true and
 *       must change their temporary password on first login.
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug, managerFullName, managerEmail, managerPassword]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               brandColor: { type: string }
 *               managerFullName: { type: string }
 *               managerEmail: { type: string }
 *               managerPassword: { type: string }
 *     responses:
 *       201:
 *         description: Club and manager created
 */
tenantRouter.post('/provision', authenticate, authorize(['PLATFORM_ADMIN']), validateRequest(createClubWithManagerSchema), tenantController.provision);

/**
 * @openapi
 * /tenants:
 *   post:
 *     summary: Create a new venue tenant (Admin — club only, no manager)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               county: { type: string }
 *               gpsCoordinates: { type: string }
 *               brandColor: { type: string }
 *               openingHours: { type: string }
 *               closingHours: { type: string }
 *     responses:
 *       201:
 *         description: Venue created
 */
tenantRouter.post('/', authenticate, authorize(['PLATFORM_ADMIN', 'SUPER_ADMIN']), validateRequest(createClubSchema), tenantController.create);

/**
 * @openapi
 * /tenants/{clubUuid}:
 *   put:
 *     summary: Update club details
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clubUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Club updated
 */
tenantRouter.put('/:clubUuid', authenticate, authorize(['PLATFORM_ADMIN', 'SUPER_ADMIN', 'CLUB_ADMIN']), validateRequest(updateClubSchema), tenantController.update);

/**
 * @openapi
 * /tenants/{clubUuid}/suspend:
 *   patch:
 *     summary: Suspend a club
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clubUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Club suspended
 */
tenantRouter.patch('/:clubUuid/suspend', authenticate, authorize(['PLATFORM_ADMIN', 'SUPER_ADMIN']), tenantController.suspend);

/**
 * @openapi
 * /tenants/{clubUuid}/activate:
 *   patch:
 *     summary: Activate a suspended club
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clubUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Club activated
 */
tenantRouter.patch('/:clubUuid/activate', authenticate, authorize(['PLATFORM_ADMIN', 'SUPER_ADMIN']), tenantController.activate);

/**
 * @openapi
 * /tenants/{clubUuid}:
 *   delete:
 *     summary: Soft delete a club
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clubUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Club deleted
 */
tenantRouter.delete('/:clubUuid', authenticate, authorize(['PLATFORM_ADMIN', 'SUPER_ADMIN']), tenantController.delete);

/**
 * @openapi
 * /tenants/{clubUuid}/assign-manager:
 *   post:
 *     summary: Assign a manager to a club
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clubUuid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userUuid]
 *             properties:
 *               userUuid: { type: string }
 *     responses:
 *       200:
 *         description: Manager assigned
 */
tenantRouter.post('/:clubUuid/assign-manager', authenticate, authorize(['PLATFORM_ADMIN', 'SUPER_ADMIN']), validateRequest(assignManagerSchema), tenantController.assignManager);

/**
 * @openapi
 * /tenants/{clubUuid}/tables:
 *   get:
 *     summary: List all tables and their QR codes for a venue
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clubUuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Array of venue tables with QR codes
 */
tenantRouter.get('/:clubUuid/tables', authenticate, authorize(['PLATFORM_ADMIN', 'SUPER_ADMIN', 'CLUB_ADMIN', 'MANAGER']), tenantController.getTables);

/**
 * @openapi
 * /tenants/{clubUuid}/generate-qr:
 *   post:
 *     summary: Batch generate venue tables and QR codes
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clubUuid
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tableCount]
 *             properties:
 *               tableCount: { type: number }
 *               sectionName: { type: string }
 *     responses:
 *       200:
 *         description: Tables and QR codes generated
 */
tenantRouter.post('/:clubUuid/generate-qr', authenticate, authorize(['PLATFORM_ADMIN', 'SUPER_ADMIN', 'CLUB_ADMIN', 'MANAGER']), validateRequest(generateQrCodesSchema), tenantController.generateQrCodes);
