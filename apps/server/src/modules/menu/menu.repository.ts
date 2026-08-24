import { MenuCategory, Product, Offer, ModifierGroup, ModifierOption } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { IMenuRepository } from './menu.interface';

export class MenuRepository implements IMenuRepository {
  async findCategoriesByClub(clubUuid: string): Promise<MenuCategory[]> {
    return prisma.menuCategory.findMany({
      where: { clubUuid, deletedAt: null },
      orderBy: { displayOrder: 'asc' },
      include: {
        products: {
          where: { deletedAt: null },
          include: {
            modifierGroups: {
              where: { deletedAt: null },
              include: {
                options: {
                  orderBy: { displayOrder: 'asc' },
                },
              },
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  async findCategoryById(categoryUuid: string): Promise<MenuCategory | null> {
    return prisma.menuCategory.findFirst({
      where: { categoryUuid, deletedAt: null },
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
      include: {
        category: true,
        modifierGroups: {
          where: { deletedAt: null },
          include: {
            options: {
              orderBy: { displayOrder: 'asc' },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async findProductById(productUuid: string): Promise<Product | null> {
    return prisma.product.findFirst({
      where: { productUuid, deletedAt: null },
      include: {
        category: true,
        modifierGroups: {
          where: { deletedAt: null },
          include: {
            options: {
              orderBy: { displayOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  async createProduct(clubUuid: string, data: any): Promise<Product> {
    return prisma.product.create({
      data: {
        clubUuid,
        categoryUuid: data.categoryUuid!,
        name: data.name!,
        description: data.description,
        price: data.price!,
        imageUrl: data.imageUrl,
        sku: data.sku,
        prepStation: data.prepStation || 'GENERAL',
        dietaryTags: data.dietaryTags || [],
        calories: data.calories || null,
        isAvailable: data.isAvailable ?? true,
      },
      include: {
        category: true,
        modifierGroups: {
          include: { options: true },
        },
      },
    });
  }

  async updateProduct(productUuid: string, data: any): Promise<Product> {
    return prisma.product.update({
      where: { productUuid },
      data,
      include: {
        category: true,
        modifierGroups: {
          include: { options: true },
        },
      },
    });
  }

  async archiveProduct(productUuid: string): Promise<boolean> {
    await prisma.product.update({
      where: { productUuid },
      data: { deletedAt: new Date(), isAvailable: false },
    });
    return true;
  }

  async findModifierGroupsByClub(clubUuid: string): Promise<ModifierGroup[]> {
    return prisma.modifierGroup.findMany({
      where: { clubUuid, deletedAt: null },
      include: {
        options: { orderBy: { displayOrder: 'asc' } },
        product: true,
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async createModifierGroup(
    clubUuid: string,
    data: Partial<ModifierGroup> & { options?: Partial<ModifierOption>[] },
  ): Promise<ModifierGroup> {
    return prisma.modifierGroup.create({
      data: {
        clubUuid,
        productUuid: data.productUuid || null,
        name: data.name!,
        description: data.description,
        selectionType: data.selectionType || 'SINGLE',
        minSelections: data.minSelections || 0,
        maxSelections: data.maxSelections || 1,
        isRequired: data.isRequired || false,
        displayOrder: data.displayOrder || 0,
        options: data.options && data.options.length > 0 ? {
          create: data.options.map((opt, idx) => ({
            name: opt.name!,
            priceDelta: opt.priceDelta || 0,
            isDefault: opt.isDefault || false,
            isAvailable: opt.isAvailable ?? true,
            displayOrder: opt.displayOrder ?? idx,
          })),
        } : undefined,
      },
      include: { options: true },
    });
  }

  async updateModifierGroup(modifierGroupUuid: string, data: Partial<ModifierGroup>): Promise<ModifierGroup> {
    return prisma.modifierGroup.update({
      where: { modifierGroupUuid },
      data,
      include: { options: true },
    });
  }

  async deleteModifierGroup(modifierGroupUuid: string): Promise<boolean> {
    await prisma.modifierGroup.update({
      where: { modifierGroupUuid },
      data: { deletedAt: new Date() },
    });
    return true;
  }

  async createModifierOption(modifierGroupUuid: string, data: Partial<ModifierOption>): Promise<ModifierOption> {
    return prisma.modifierOption.create({
      data: {
        modifierGroupUuid,
        name: data.name!,
        priceDelta: data.priceDelta || 0,
        isDefault: data.isDefault || false,
        isAvailable: data.isAvailable ?? true,
        displayOrder: data.displayOrder || 0,
      },
    });
  }

  async updateModifierOption(modifierOptionUuid: string, data: Partial<ModifierOption>): Promise<ModifierOption> {
    return prisma.modifierOption.update({
      where: { modifierOptionUuid },
      data,
    });
  }

  async deleteModifierOption(modifierOptionUuid: string): Promise<boolean> {
    await prisma.modifierOption.delete({
      where: { modifierOptionUuid },
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
