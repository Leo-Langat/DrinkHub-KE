import { MenuCategory, Product, Offer } from '@prisma/client';
import { IMenuRepository } from './menu.interface';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';
import { prisma } from '../../config/prisma';

export class MenuService {
  constructor(private menuRepository: IMenuRepository) {}

  async getMenuForClub(clubUuid: string) {
    const [categories, products, offers] = await Promise.all([
      this.menuRepository.findCategoriesByClub(clubUuid),
      this.menuRepository.findProductsByClub(clubUuid),
      this.menuRepository.findOffersByClub(clubUuid),
    ]);
    return { categories, products, offers };
  }

  async createCategory(clubUuid: string, data: Partial<MenuCategory>): Promise<MenuCategory> {
    if (!data.name) {
      throw new BadRequestError('Category name is required');
    }
    return this.menuRepository.createCategory(clubUuid, data);
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

  async updateCategoryOrders(clubUuid: string, orders: { categoryUuid: string; displayOrder: number }[]): Promise<void> {
    return this.menuRepository.updateCategoryOrders(clubUuid, orders);
  }

  async createProduct(clubUuid: string, data: any): Promise<Product> {
    if (!clubUuid) {
      throw new BadRequestError('Venue context is required to add menu items');
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
          clubUuid,
          name: { equals: trimmedCatName, mode: 'insensitive' },
          deletedAt: null,
        },
      });

      if (!category) {
        category = await prisma.menuCategory.create({
          data: {
            clubUuid,
            name: trimmedCatName,
            displayOrder: 0,
          },
        });
      }

      categoryUuid = category.categoryUuid;
    }

    if (!categoryUuid) {
      let defaultCat = await prisma.menuCategory.findFirst({
        where: { clubUuid, name: 'General', deletedAt: null },
      });
      if (!defaultCat) {
        defaultCat = await prisma.menuCategory.create({
          data: { clubUuid, name: 'General', displayOrder: 99 },
        });
      }
      categoryUuid = defaultCat.categoryUuid;
    }

    return this.menuRepository.createProduct(clubUuid, {
      ...data,
      categoryUuid,
      price: Number(data.price),
    });
  }

  async updateProduct(productUuid: string, data: Partial<Product>): Promise<Product> {
    const product = await this.menuRepository.findProductById(productUuid);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return this.menuRepository.updateProduct(productUuid, data);
  }

  async toggleAvailability(productUuid: string, isAvailable: boolean): Promise<Product> {
    return this.updateProduct(productUuid, { isAvailable });
  }

  async archiveProduct(productUuid: string): Promise<boolean> {
    const product = await this.menuRepository.findProductById(productUuid);
    if (!product) {
      throw new NotFoundError('Product not found');
    }
    return this.menuRepository.archiveProduct(productUuid);
  }

  async createOffer(clubUuid: string, data: any): Promise<Offer> {
    if (!data.title || data.discountValue === undefined) {
      throw new BadRequestError('Offer title and discount value are required');
    }
    return this.menuRepository.createOffer(clubUuid, {
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
