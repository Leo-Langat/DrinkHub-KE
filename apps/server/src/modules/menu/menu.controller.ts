import { Request, Response, NextFunction } from 'express';
import { MenuService } from './menu.service';
import { verifyAccessToken } from '../../common/utils/jwt';

const extractBusinessUuid = (req: Request): string | undefined => {
  let uuid: string | undefined =
    req.businessUuid ||
    req.user?.businessUuid ||
    req.user?.tenantId ||
    (req.headers['x-business-uuid'] as string | undefined) ||
    (req.headers['x-tenant-id'] as string | undefined) ||
    (req.query.businessUuid as string | undefined) ||
    (req.query.clubUuid as string | undefined);

  if (!uuid && req.headers.authorization?.startsWith('Bearer ')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const payload = verifyAccessToken(token);
      uuid = payload.businessUuid || payload.tenantId;
    } catch {}
  }
  return uuid || undefined;
};

export class MenuController {
  constructor(private menuService: MenuService) {}

  getMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = extractBusinessUuid(req);
      const result = await this.menuService.getMenuForBusiness(businessUuid);
      res.json({
        success: true,
        data: result,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = extractBusinessUuid(req);
      const category = await this.menuService.createCategory(businessUuid!, req.body);
      res.status(201).json({
        success: true,
        data: category,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { categoryUuid } = req.params;
      const category = await this.menuService.updateCategory(categoryUuid, req.body);
      res.json({
        success: true,
        data: category,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  archiveCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { categoryUuid } = req.params;
      await this.menuService.archiveCategory(categoryUuid);
      res.json({
        success: true,
        data: { message: 'Category deleted successfully' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  updateCategoryOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = extractBusinessUuid(req);

      const { orders } = req.body;
      await this.menuService.updateCategoryOrders(businessUuid!, orders);
      res.json({
        success: true,
        data: { message: 'Category display orders updated' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = extractBusinessUuid(req);

      const product = await this.menuService.createProduct(businessUuid!, req.body);
      res.status(201).json({
        success: true,
        data: product,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productUuid } = req.params;
      const product = await this.menuService.updateProduct(productUuid, req.body);
      res.json({
        success: true,
        data: product,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  toggleAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productUuid } = req.params;
      const { isAvailable } = req.body;
      const product = await this.menuService.toggleAvailability(productUuid, isAvailable);
      res.json({
        success: true,
        data: product,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  archiveProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productUuid } = req.params;
      await this.menuService.archiveProduct(productUuid);
      res.json({
        success: true,
        data: { message: 'Product archived successfully' },
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
      const host = req.get('host') || 'localhost:5000';
      const protocol = req.protocol || 'http';
      const imageUrl = `${protocol}://${host}/uploads/${file.filename}`;
      const relativeUrl = `/uploads/${file.filename}`;
      res.json({
        success: true,
        data: { imageUrl, url: imageUrl, relativeUrl },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  createOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUuid = extractBusinessUuid(req);

      const offer = await this.menuService.createOffer(businessUuid!, req.body);
      res.status(201).json({
        success: true,
        data: offer,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { offerUuid } = req.params;
      await this.menuService.deleteOffer(offerUuid);
      res.json({
        success: true,
        data: { message: 'Offer deleted successfully' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  toggleOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { offerUuid } = req.params;
      const { isActive } = req.body;
      const offer = await this.menuService.toggleOffer(offerUuid, Boolean(isActive));
      res.json({
        success: true,
        data: offer,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };
}

