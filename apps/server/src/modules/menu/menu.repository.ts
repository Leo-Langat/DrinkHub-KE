import { MenuCategory, Product, Offer } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { IMenuRepository } from './menu.interface';

export class MenuRepository implements IMenuRepository {
  async findCategoriesByClub(clubUuid: string): Promise<MenuCategory[]> {
    return prisma.menuCategory.findMany({
      where: { clubUuid, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: {
        products: { where: { deletedAt: null } },
      },
    });
  }

  async createCategory(clubUuid: string, data: Partial<MenuCategory>): Promise<MenuCategory> {
    return prisma.menuCategory.create({
      data: {
        clubUuid,
        name: data.name!,
        description: data.description,
        displayOrder: data.displayOrder || 0,
      },
    });
  }

  async updateCategoryOrders(
    clubUuid: string,
    orders: { categoryUuid: string; displayOrder: number }[],
  ): Promise<void> {
    await prisma.$transaction(
      orders.map((item) =>
        prisma.menuCategory.updateMany({
          where: { categoryUuid: item.categoryUuid, clubUuid },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );
  }

  async findProductsByClub(clubUuid: string): Promise<Product[]> {
    return prisma.product.findMany({
      where: { clubUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });
  }

  async findProductById(productUuid: string): Promise<Product | null> {
    return prisma.product.findFirst({
      where: { productUuid, deletedAt: null },
    });
  }

  async createProduct(clubUuid: string, data: Partial<Product>): Promise<Product> {
    return prisma.product.create({
      data: {
        clubUuid,
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

  async findOffersByClub(clubUuid: string): Promise<Offer[]> {
    return prisma.offer.findMany({
      where: { clubUuid, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOffer(clubUuid: string, data: Partial<Offer>): Promise<Offer> {
    return prisma.offer.create({
      data: {
        clubUuid,
        title: data.title!,
        description: data.description,
        offerType: data.offerType || 'PERCENTAGE_DISCOUNT',
        discountValue: data.discountValue!,
        promoCode: data.promoCode,
        startTime: data.startTime!,
        endTime: data.endTime!,
      },
    });
  }
}
