import { MenuCategory, Product, Offer } from '@prisma/client';

export interface IMenuRepository {
  findCategoriesByClub(clubUuid: string): Promise<MenuCategory[]>;
  createCategory(clubUuid: string, data: Partial<MenuCategory>): Promise<MenuCategory>;
  updateCategoryOrders(clubUuid: string, orders: { categoryUuid: string; displayOrder: number }[]): Promise<void>;
  
  findProductsByClub(clubUuid: string): Promise<Product[]>;
  findProductById(productUuid: string): Promise<Product | null>;
  createProduct(clubUuid: string, data: Partial<Product>): Promise<Product>;
  updateProduct(productUuid: string, data: Partial<Product>): Promise<Product>;
  archiveProduct(productUuid: string): Promise<boolean>;

  findOffersByClub(clubUuid: string): Promise<Offer[]>;
  createOffer(clubUuid: string, data: Partial<Offer>): Promise<Offer>;
}
