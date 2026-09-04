import { MenuCategory, Product, Offer } from '@prisma/client';

export interface IMenuRepository {
  findCategoriesByBusiness(businessUuid: string): Promise<MenuCategory[]>;
  findCategoryById(categoryUuid: string): Promise<MenuCategory | null>;
  createCategory(businessUuid: string, data: Partial<MenuCategory>): Promise<MenuCategory>;
  updateCategory(categoryUuid: string, data: Partial<MenuCategory>): Promise<MenuCategory>;
  archiveCategory(categoryUuid: string): Promise<boolean>;
  updateCategoryOrders(businessUuid: string, orders: { categoryUuid: string; displayOrder: number }[]): Promise<void>;

  findProductsByBusiness(businessUuid: string): Promise<Product[]>;
  findProductById(productUuid: string): Promise<Product | null>;
  createProduct(businessUuid: string, data: Partial<Product>): Promise<Product>;
  updateProduct(productUuid: string, data: Partial<Product>): Promise<Product>;
  archiveProduct(productUuid: string): Promise<boolean>;

  findOffersByBusiness(businessUuid: string): Promise<Offer[]>;
  createOffer(businessUuid: string, data: Partial<Offer>): Promise<Offer>;
  deleteOffer(offerUuid: string): Promise<boolean>;
  toggleOffer(offerUuid: string, isActive: boolean): Promise<Offer>;

  // Backward compatibility aliases
  findCategoriesByClub?(clubUuid: string): Promise<MenuCategory[]>;
  findProductsByClub?(clubUuid: string): Promise<Product[]>;
  findOffersByClub?(clubUuid: string): Promise<Offer[]>;
}

