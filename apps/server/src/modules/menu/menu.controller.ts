import { Request, Response, NextFunction } from 'express';
import { MenuService } from './menu.service';

export class MenuController {
  constructor(private menuService: MenuService) {}

  getMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clubUuid = (req.headers['x-tenant-id'] as string) || (req.query.clubUuid as string);
      const result = await this.menuService.getMenuForClub(clubUuid);
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
      const clubUuid = req.user?.tenantId || (req.headers['x-tenant-id'] as string);
      const category = await this.menuService.createCategory(clubUuid!, req.body);
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
      const clubUuid = req.user?.tenantId || (req.headers['x-tenant-id'] as string);
      const { orders } = req.body;
      await this.menuService.updateCategoryOrders(clubUuid!, orders);
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
      const clubUuid = req.user?.tenantId || (req.headers['x-tenant-id'] as string);
      const product = await this.menuService.createProduct(clubUuid!, req.body);
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
      const imageUrl = `/uploads/${file.filename}`;
      res.json({
        success: true,
        data: { imageUrl },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  createOffer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clubUuid = req.user?.tenantId || (req.headers['x-tenant-id'] as string);
      const offer = await this.menuService.createOffer(clubUuid!, req.body);
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

  // ─── Modifier Groups ────────────────────────────────────────────────────────
  getModifierGroups = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clubUuid = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || (req.query.clubUuid as string);
      const groups = await this.menuService.getModifierGroups(clubUuid!);
      res.json({
        success: true,
        data: groups,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  createModifierGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clubUuid = req.user?.tenantId || (req.headers['x-tenant-id'] as string);
      const group = await this.menuService.createModifierGroup(clubUuid!, req.body);
      res.status(201).json({
        success: true,
        data: group,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  updateModifierGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { modifierGroupUuid } = req.params;
      const group = await this.menuService.updateModifierGroup(modifierGroupUuid, req.body);
      res.json({
        success: true,
        data: group,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteModifierGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { modifierGroupUuid } = req.params;
      await this.menuService.deleteModifierGroup(modifierGroupUuid);
      res.json({
        success: true,
        data: { message: 'Modifier group deleted successfully' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  createModifierOption = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { modifierGroupUuid } = req.params;
      const option = await this.menuService.createModifierOption(modifierGroupUuid, req.body);
      res.status(201).json({
        success: true,
        data: option,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  updateModifierOption = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { modifierOptionUuid } = req.params;
      const option = await this.menuService.updateModifierOption(modifierOptionUuid, req.body);
      res.json({
        success: true,
        data: option,
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteModifierOption = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { modifierOptionUuid } = req.params;
      await this.menuService.deleteModifierOption(modifierOptionUuid);
      res.json({
        success: true,
        data: { message: 'Option deleted successfully' },
        meta: { timestamp: new Date().toISOString(), version: 'v1' },
      });
    } catch (error) {
      next(error);
    }
  };
}
