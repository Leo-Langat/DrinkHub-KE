import { MenuCategory, Product, Offer } from '@prisma/client';
import { IMenuRepository } from './menu.interface';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';

export class MenuService {
  constructor(private menuRepository: IMenuRepository) {}

  async getMenuForClub(clubUuid: string) {
    const categories = await this.menuRepository.findCategoriesByClub(clubUuid);
    const products = await this.menuRepository.findProductsByClub(clubUuid);
    const offers = await this.menuRepository.findOffersByClub(clubUuid);
    return { categories, products, offers };
  }

  async createCategory(clubUuid: string, data: Partial<MenuCategory>): Promise<MenuCategory> {
    if (!data.name) {
      throw new BadRequestError('Category name is required');
    }
    return this.menuRepository.createCategory(clubUuid, data);
  }

  async updateCategoryOrders(clubUuid: string, orders: { categoryUuid: string; displayOrder: number }[]): Promise<void> {
    return this.menuRepository.updateCategoryOrders(clubUuid, orders);
  }

  async createProduct(clubUuid: string, data: Partial<Product>): Promise<Product> {
    if (!data.name || !data.categoryUuid || data.price === undefined) {
      throw new BadRequestError('Product name, category, and price are required');
    }
    return this.menuRepository.createProduct(clubUuid, data);
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

  async createOffer(clubUuid: string, data: Partial<Offer>): Promise<Offer> {
    if (!data.title || !data.discountValue || !data.startTime || !data.endTime) {
      throw new BadRequestError('Offer title, discount, start time, and end time are required');
    }
    return this.menuRepository.createOffer(clubUuid, data);
  }
}
