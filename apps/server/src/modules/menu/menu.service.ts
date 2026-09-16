import { MenuCategory, Product, Offer } from '@prisma/client';
import { IMenuRepository } from './menu.interface';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';
import { prisma } from '../../config/prisma';

export class MenuService {
  constructor(private menuRepository: IMenuRepository) {}

  async getMenuForBusiness(businessUuid?: string) {
    let targetUuid = businessUuid;
    if (!targetUuid || targetUuid === 'default-club' || targetUuid === 'default-business') {
      const firstBiz = await prisma.business.findFirst({ where: { deletedAt: null } });
      if (firstBiz) targetUuid = firstBiz.businessUuid;
    }
    if (!targetUuid) {
      return { categories: [], products: [], offers: [] };
    }
    const [categories, products, offers] = await Promise.all([
      this.menuRepository.findCategoriesByBusiness(targetUuid),
      this.menuRepository.findProductsByBusiness(targetUuid),
      this.menuRepository.findOffersByBusiness(targetUuid),
    ]);
    return { categories, products, offers };
  }

  // Alias
  async getMenuForClub(clubUuid?: string) {
    return this.getMenuForBusiness(clubUuid);
  }

  async createCategory(businessUuid: string, data: Partial<MenuCategory>): Promise<MenuCategory> {
    if (!data.name) {
      throw new BadRequestError('Category name is required');
    }
    const category = await this.menuRepository.createCategory(businessUuid, data);
    prisma.auditLog.create({
      data: {
        businessUuid: businessUuid || null,
        action: 'MENU_CATEGORY_CREATED',
        entityType: 'MENU_CATEGORY',
        entityUuid: category.categoryUuid,
        newValues: { name: category.name },
      },
    }).catch(() => {/* non-fatal */});
    return category;
  }

  async updateCategory(categoryUuid: string, data: Partial<MenuCategory>): Promise<MenuCategory> {
    const category = await this.menuRepository.findCategoryById(categoryUuid);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return this.menuRepository.updateCategory(categoryUuid, data);
  }

  async archiveCategory(categoryUuid: string): Promise<boolean> {
    const category = await this.menuRepository.findCategoryById(categoryUuid);
    if (!category) {
      throw new NotFoundError('Category not found');
    }
    return this.menuRepository.archiveCategory(categoryUuid);
  }

  async updateCategoryOrders(
    businessUuid: string,
    orders: { categoryUuid: string; displayOrder: number }[],
  ): Promise<void> {
    return this.menuRepository.updateCategoryOrders(businessUuid, orders);
  }

  async createProduct(businessUuid: string, data: any): Promise<Product> {
    if (!businessUuid) {
      throw new BadRequestError('Business venue context is required to add menu items');
    }
    if (!data.name || data.price === undefined) {
      throw new BadRequestError('Product name and price are required');
    }

    let categoryUuid = data.categoryUuid;
    const categoryName = data.categoryName || data.category;

    if (!categoryUuid && categoryName) {
      const trimmedCatName = String(categoryName).trim();
      let category = await prisma.menuCategory.findFirst({
        where: {
          businessUuid,
          name: { equals: trimmedCatName, mode: 'insensitive' },
          deletedAt: null,
        },
      });

      if (!category) {
        category = await prisma.menuCategory.create({
          data: {
            businessUuid,
            name: trimmedCatName,
            displayOrder: 0,
          },
        });
      }

      categoryUuid = category.categoryUuid;
    }

    if (!categoryUuid) {
      let defaultCat = await prisma.menuCategory.findFirst({
        where: { businessUuid, name: 'General', deletedAt: null },
      });
      if (!defaultCat) {
        defaultCat = await prisma.menuCategory.create({
          data: { businessUuid, name: 'General', displayOrder: 99 },
        });
      }
      categoryUuid = defaultCat.categoryUuid;
    }

    const product = await this.menuRepository.createProduct(businessUuid, {
      ...data,
      categoryUuid,
      price: Number(data.price),
    });
    prisma.auditLog.create({
      data: {
        businessUuid: businessUuid || null,
        action: 'MENU_PRODUCT_CREATED',
        entityType: 'MENU_PRODUCT',
        entityUuid: product.productUuid,
        newValues: { name: product.name, price: product.price },
      },
    }).catch(() => {/* non-fatal */});
    return product;
  }

  async updateProduct(productUuid: string, data: Partial<Product>): Promise<Product> {
    const product = await this.menuRepository.findProductById(productUuid);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    const updated = await this.menuRepository.updateProduct(productUuid, data);
    prisma.auditLog.create({
      data: {
        businessUuid: (product as any).businessUuid || null,
        action: 'MENU_PRODUCT_UPDATED',
        entityType: 'MENU_PRODUCT',
        entityUuid: productUuid,
        oldValues: { name: product.name, price: product.price, isAvailable: product.isAvailable },
        newValues: data as any,
      },
    }).catch(() => {/* non-fatal */});
    return updated;
  }

  async toggleAvailability(productUuid: string, isAvailable: boolean): Promise<Product> {
    return this.updateProduct(productUuid, { isAvailable });
  }

  async archiveProduct(productUuid: string): Promise<boolean> {
    const product = await this.menuRepository.findProductById(productUuid);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    const result = await this.menuRepository.archiveProduct(productUuid);
    prisma.auditLog.create({
      data: {
        businessUuid: (product as any).businessUuid || null,
        action: 'MENU_PRODUCT_DELETED',
        entityType: 'MENU_PRODUCT',
        entityUuid: productUuid,
        oldValues: { name: product.name },
      },
    }).catch(() => {/* non-fatal */});
    return result;
  }

  async createOffer(businessUuid: string, data: any): Promise<Offer> {
    if (!data.title || data.discountValue === undefined) {
      throw new BadRequestError('Offer title and discount value are required');
    }
    return this.menuRepository.createOffer(businessUuid, {
      ...data,
      discountValue: Number(data.discountValue),
      startTime: data.startTime ? new Date(data.startTime) : new Date(),
      endTime: data.endTime ? new Date(data.endTime) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  }

  async deleteOffer(offerUuid: string): Promise<boolean> {
    return this.menuRepository.deleteOffer(offerUuid);
  }

  async toggleOffer(offerUuid: string, isActive: boolean): Promise<Offer> {
    return this.menuRepository.toggleOffer(offerUuid, isActive);
  }
}

