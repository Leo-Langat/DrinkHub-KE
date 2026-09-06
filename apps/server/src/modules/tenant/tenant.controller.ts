import { Request, Response, NextFunction } from 'express';
import { TenantService } from './tenant.service';

export class TenantController {
  constructor(private tenantService: TenantService) {}

  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenants = await this.tenantService.getAllTenants();
      res.json({
        success: true,
        data: tenants,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  getPlatformStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.tenantService.getPlatformStats();
      res.json({
        success: true,
        data: stats,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const tenant = await this.tenantService.getTenantBySlug(slug);
      res.json({
        success: true,
        data: tenant,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenant = await this.tenantService.createTenant(req.body);
      res.status(201).json({
        success: true,
        data: tenant,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /tenants/provision — Unified Business + Admin provisioning.
   * Creates Business and initial Admin atomically. Password hash is never returned.
   */
  provision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.tenantService.createBusinessWithAdmin(req.body);
      res.status(201).json({
        success: true,
        data: {
          business: result.business,
          club: result.business, // backward compatibility
          admin: {
            userUuid: result.admin.userUuid,
            email: result.admin.email,
            fullName: result.admin.fullName,
            role: result.admin.role,
            mustChangePassword: result.admin.mustChangePassword,
            businessUuid: result.admin.businessUuid,
            clubUuid: result.admin.businessUuid,
          },
          manager: {
            userUuid: result.admin.userUuid,
            email: result.admin.email,
            fullName: result.admin.fullName,
            role: result.admin.role,
            mustChangePassword: result.admin.mustChangePassword,
            businessUuid: result.admin.businessUuid,
            clubUuid: result.admin.businessUuid,
          },
        },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  getCurrentBusiness = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = (req.user?.role || '').toUpperCase();
      let businessUuid: string;

      if (userRole === 'SUPER_ADMIN') {
        businessUuid = (req.query.businessUuid as string) || (req.query.clubUuid as string) || req.user?.businessUuid || req.businessUuid || '';
      } else {
        businessUuid = req.user?.businessUuid || req.user?.tenantId || (req.user as any)?.clubUuid || req.businessUuid || '';
      }

      if (!businessUuid) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_BUSINESS', message: 'No business is associated with your account' },
        });
        return;
      }

      const summary = await this.tenantService.getBusinessSummary(businessUuid);
      res.json({
        success: true,
        data: summary,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetBusinessUuid = req.params.businessUuid || req.params.clubUuid;
      const userRole = (req.user?.role || '').toUpperCase();
      const callerBusinessUuid = req.user?.businessUuid || req.user?.tenantId || (req.user as any)?.clubUuid;

      // Tenant isolation: Non-SUPER_ADMIN users can ONLY update their own assigned business
      if (userRole !== 'SUPER_ADMIN') {
        if (callerBusinessUuid !== targetBusinessUuid) {
          res.status(403).json({
            success: false,
            error: { code: 'FORBIDDEN', message: 'Access denied: You can only update settings for your own business' },
          });
          return;
        }
      }

      const tenant = await this.tenantService.updateTenant(targetBusinessUuid, req.body);
      res.json({
        success: true,
        data: tenant,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  suspend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = req.params.businessUuid || req.params.clubUuid;
      const tenant = await this.tenantService.suspendTenant(businessUuid);
      res.json({
        success: true,
        data: tenant,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  activate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = req.params.businessUuid || req.params.clubUuid;
      const tenant = await this.tenantService.activateTenant(businessUuid);
      res.json({
        success: true,
        data: tenant,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = req.params.businessUuid || req.params.clubUuid;
      await this.tenantService.deleteTenant(businessUuid);
      res.json({
        success: true,
        data: { message: 'Business deleted successfully' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  assignManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = req.params.businessUuid || req.params.clubUuid;
      const { userUuid } = req.body;
      const manager = await this.tenantService.assignManager(businessUuid, userUuid);
      res.json({
        success: true,
        data: manager,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  getTables = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = req.params.businessUuid || req.params.clubUuid;
      const tables = await this.tenantService.getTables(businessUuid);
      res.json({
        success: true,
        data: tables,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  generateQrCodes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = req.params.businessUuid || req.params.clubUuid;
      const { tableCount, sectionName, startFrom } = req.body;
      const result = await this.tenantService.generateQrCodes(businessUuid, tableCount, sectionName, startFrom);
      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = req.params.businessUuid || req.params.clubUuid;
      const { tableNumber } = req.params;
      await this.tenantService.deleteTable(businessUuid, parseInt(tableNumber, 10));
      res.json({
        success: true,
        data: { message: `Table ${tableNumber} deleted successfully` },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) {
        res.status(400).json({ success: false, error: { message: 'No image file uploaded' } });
        return;
      }
      const imageUrl = `/uploads/${file.filename}`;
      res.json({
        success: true,
        data: { imageUrl, url: imageUrl },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };
}

