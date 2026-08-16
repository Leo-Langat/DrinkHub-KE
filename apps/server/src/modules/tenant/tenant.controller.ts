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
   * POST /tenants/provision — Unified Club + Manager provisioning (§23–24).
   * Creates Club and Manager atomically. Manager password hash is NEVER returned.
   */
  provision = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.tenantService.createClubWithManager(req.body);
      res.status(201).json({
        success: true,
        data: {
          club: result.club,
          manager: {
            userUuid: result.manager.userUuid,
            email: result.manager.email,
            fullName: result.manager.fullName,
            role: result.manager.role,
            mustChangePassword: result.manager.mustChangePassword,
            clubUuid: result.manager.clubUuid,
          },
        },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };


  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clubUuid } = req.params;
      const tenant = await this.tenantService.updateTenant(clubUuid, req.body);
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
      const { clubUuid } = req.params;
      const tenant = await this.tenantService.suspendTenant(clubUuid);
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
      const { clubUuid } = req.params;
      const tenant = await this.tenantService.activateTenant(clubUuid);
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
      const { clubUuid } = req.params;
      await this.tenantService.deleteTenant(clubUuid);
      res.json({
        success: true,
        data: { message: 'Club deleted successfully' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  assignManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { clubUuid } = req.params;
      const { userUuid } = req.body;
      const manager = await this.tenantService.assignManager(clubUuid, userUuid);
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
      const { clubUuid } = req.params;
      const tables = await this.tenantService.getTables(clubUuid);
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
      const { clubUuid } = req.params;
      const { tableCount, sectionName } = req.body;
      const result = await this.tenantService.generateQrCodes(clubUuid, tableCount, sectionName);
      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };
}
