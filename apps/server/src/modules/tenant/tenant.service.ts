import bcrypt from 'bcrypt';
import { Club, SubscriptionStatus } from '@prisma/client';
import { ITenantRepository } from './tenant.interface';
import { NotFoundError, BadRequestError } from '../../common/errors/app-error';

const BCRYPT_ROUNDS = 12;

export class TenantService {
  constructor(private tenantRepository: ITenantRepository) {}

  async getTenantBySlug(slug: string): Promise<Club> {
    const tenant = await this.tenantRepository.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundError(`Club with slug '${slug}' not found`);
    }
    return tenant;
  }

  async getTenantById(clubUuid: string): Promise<Club> {
    const tenant = await this.tenantRepository.findById(clubUuid);
    if (!tenant) {
      throw new NotFoundError(`Club not found`);
    }
    return tenant;
  }

  async getAllTenants(): Promise<Club[]> {
    return this.tenantRepository.findAll();
  }

  async createTenant(data: Partial<Club>): Promise<Club> {
    if (!data.name || !data.slug) {
      throw new BadRequestError('Club name and slug are required');
    }
    const existing = await this.tenantRepository.findBySlug(data.slug);
    if (existing) {
      throw new BadRequestError(`Slug '${data.slug}' is already taken`);
    }
    return this.tenantRepository.create(data);
  }

  /**
   * Platform Admin unified workflow (§23–24): Creates a Club and its initial
   * Manager atomically in a single database transaction. If either insert fails
   * (e.g. duplicate slug or duplicate manager email) the whole operation rolls
   * back, leaving no orphaned records.
   */
  async createClubWithManager(data: {
    // Club
    name: string;
    slug: string;
    city?: string;
    county?: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
    brandColor?: string;
    openingHours?: string;
    closingHours?: string;
    gpsCoordinates?: string;
    // Manager (plain-text password from request — hashed here)
    managerFullName: string;
    managerEmail: string;
    managerPhone?: string;
    managerPassword: string;
  }) {
    // Pre-flight checks before entering the transaction
    const existingSlug = await this.tenantRepository.findBySlug(data.slug);
    if (existingSlug) {
      throw new BadRequestError(`Slug '${data.slug}' is already taken by another club`);
    }

    // Hash the manager's temporary password (OWASP: bcrypt ≥12 rounds)
    const managerPasswordHash = await bcrypt.hash(data.managerPassword, BCRYPT_ROUNDS);

    return this.tenantRepository.createClubWithManager({
      name: data.name,
      slug: data.slug,
      city: data.city,
      county: data.county,
      address: data.address,
      phone: data.phone,
      email: data.email,
      logoUrl: data.logoUrl,
      brandColor: data.brandColor,
      openingHours: data.openingHours,
      closingHours: data.closingHours,
      gpsCoordinates: data.gpsCoordinates,
      managerPasswordHash,
      managerFullName: data.managerFullName,
      managerEmail: data.managerEmail,
      managerPhone: data.managerPhone,
    });
  }


  async updateTenant(clubUuid: string, data: Partial<Club>): Promise<Club> {
    await this.getTenantById(clubUuid);
    return this.tenantRepository.update(clubUuid, data);
  }

  async suspendTenant(clubUuid: string): Promise<Club> {
    await this.getTenantById(clubUuid);
    return this.tenantRepository.update(clubUuid, {
      isActive: false,
      subscriptionStatus: SubscriptionStatus.SUSPENDED,
    });
  }

  async activateTenant(clubUuid: string): Promise<Club> {
    await this.getTenantById(clubUuid);
    return this.tenantRepository.update(clubUuid, {
      isActive: true,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    });
  }

  async deleteTenant(clubUuid: string): Promise<boolean> {
    await this.getTenantById(clubUuid);
    return this.tenantRepository.delete(clubUuid);
  }

  async assignManager(clubUuid: string, userUuid: string) {
    await this.getTenantById(clubUuid);
    return this.tenantRepository.assignManager(clubUuid, userUuid);
  }

  async getTables(clubUuid: string) {
    await this.getTenantById(clubUuid);
    return this.tenantRepository.getTables(clubUuid);
  }

  async generateQrCodes(clubUuid: string, tableCount: number, sectionName: string) {
    await this.getTenantById(clubUuid);
    return this.tenantRepository.generateTablesAndQrs(clubUuid, tableCount, sectionName);
  }
}
