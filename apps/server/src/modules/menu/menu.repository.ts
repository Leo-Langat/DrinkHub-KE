import { MenuCategory, Product, Offer } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { IMenuRepository } from './menu.interface';

export class MenuRepository implements IMenuRepository {
  async findCategoriesByBusiness(businessUuid: string): Promise<MenuCategory[]> {
    return prisma.menuCategory.findMany({
      where: { businessUuid, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: {
        products: { where: { deletedAt: null } },
      },
    });
  }

  async findCategoriesByClub(clubUuid: string): Promise<MenuCategory[]> {
    return this.findCategoriesByBusiness(clubUuid);
  }

  async findCategoryById(categoryUuid: string): Promise<MenuCategory | null> {
    return prisma.menuCategory.findFirst({
      where: { categoryUuid, deletedAt: null },
    });
  }

  async createCategory(businessUuid: string, data: Partial<MenuCategory>): Promise<MenuCategory> {
    return prisma.menuCategory.create({
      data: {
        businessUuid,
        name: data.name!,
        description: data.description,
        displayOrder: data.displayOrder || 0,
      },
    });
  }

  async updateCategory(categoryUuid: string, data: Partial<MenuCategory>): Promise<MenuCategory> {
    return prisma.menuCategory.update({
      where: { categoryUuid },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.displayOrder !== undefined ? { displayOrder: data.displayOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  async archiveCategory(categoryUuid: string): Promise<boolean> {
    await prisma.menuCategory.update({
      where: { categoryUuid },
      data: { deletedAt: new Date(), isActive: false },
    });
    return true;
  }

  async updateCategoryOrders(
    businessUuid: string,
    orders: { categoryUuid: string; displayOrder: number }[],
  ): Promise<void> {
    await prisma.$transaction(
      orders.map((item) =>
        prisma.menuCategory.updateMany({
          where: { categoryUuid: item.categoryUuid, businessUuid },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );
  }

  async findProductsByBusiness(businessUuid: string): Promise<Product[]> {
    return prisma.product.findMany({
      where: { businessUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }

  async findProductsByClub(clubUuid: string): Promise<Product[]> {
    return this.findProductsByBusiness(clubUuid);
  }

  async findProductById(productUuid: string): Promise<Product | null> {
    return prisma.product.findFirst({
      where: { productUuid, deletedAt: null },
    });
  }

  async createProduct(businessUuid: string, data: Partial<Product>): Promise<Product> {
    return prisma.product.create({
      data: {
        businessUuid,
        categoryUuid: data.categoryUuid!,
        name: data.name!,
        description: data.description,
        price: data.price!,
        imageUrl: data.imageUrl,
        sku: data.sku,
        isAvailable: data.isAvailable ?? true,
      },
    });
  }

  async updateProduct(productUuid: string, data: Partial<Product>): Promise<Product> {
    return prisma.product.update({
      where: { productUuid },
      data,
    });
  }

  async archiveProduct(productUuid: string): Promise<boolean> {
    await prisma.product.update({
      where: { productUuid },
      data: { deletedAt: new Date(), isAvailable: false },
    });
    return true;
  }

  async findOffersByBusiness(businessUuid: string): Promise<Offer[]> {
    return prisma.offer.findMany({
      where: { businessUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOffersByClub(clubUuid: string): Promise<Offer[]> {
    return this.findOffersByBusiness(clubUuid);
  }

  async createOffer(businessUuid: string, data: Partial<Offer>): Promise<Offer> {
    return prisma.offer.create({
      data: {
        businessUuid,
        title: data.title!,
        description: data.description,
        offerType: data.offerType || 'PERCENTAGE_DISCOUNT',
        discountValue: data.discountValue!,
        promoCode: data.promoCode,
        startTime: data.startTime || new Date(),
        endTime: data.endTime || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async deleteOffer(offerUuid: string): Promise<boolean> {
    await prisma.offer.update({
      where: { offerUuid },
      data: { deletedAt: new Date(), isActive: false },
    });
    return true;
  }

  async toggleOffer(offerUuid: string, isActive: boolean): Promise<Offer> {
    return prisma.offer.update({
      where: { offerUuid },
      data: { isActive },
    });
  }
}

