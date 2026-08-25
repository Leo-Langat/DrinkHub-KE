import { Club, User, VenueTable, QrCode, UserRole, SubscriptionStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ITenantRepository, CreateClubWithManagerInput, ClubWithManager } from './tenant.interface';

export class TenantRepository implements ITenantRepository {
  async findBySlug(slug: string): Promise<Club | null> {
    return prisma.club.findFirst({
      where: { slug, deletedAt: null },
      include: {
        users: { where: { role: { in: [UserRole.CLUB_ADMIN, UserRole.MANAGER] } } },
        venueTables: { include: { qrCode: true } },
        _count: { select: { orders: true, venueTables: true, products: true, users: true } },
      },
    });
  }

  async findById(clubUuid: string): Promise<Club | null> {
    return prisma.club.findFirst({
      where: { clubUuid, deletedAt: null },
      include: {
        users: { where: { role: { in: [UserRole.CLUB_ADMIN, UserRole.MANAGER] } } },
        venueTables: { include: { qrCode: true } },
        _count: { select: { orders: true, venueTables: true, products: true, users: true } },
      },
    });
  }

  async findAll(): Promise<Club[]> {
    return prisma.club.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        users: { where: { role: { in: [UserRole.CLUB_ADMIN, UserRole.MANAGER] } } },
        _count: { select: { orders: true, venueTables: true, products: true, users: true } },
      },
    });
  }

  async create(data: Partial<Club>): Promise<Club> {
    return prisma.club.create({
      data: {
        name: data.name!,
        slug: data.slug!,
        city: data.city || 'Nairobi',
        county: data.county || 'Nairobi',
        logoUrl: data.logoUrl,
        phone: data.phone,
        email: data.email,
        address: data.address,
        gpsCoordinates: data.gpsCoordinates,
        brandColor: data.brandColor || '#e11d48',
        openingHours: data.openingHours || '14:00',
        closingHours: data.closingHours || '04:00',
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        isActive: true,
      },
    });
  }

  async createClubWithManager(data: CreateClubWithManagerInput): Promise<ClubWithManager> {
    return prisma.$transaction(async (tx) => {
      const club = await tx.club.create({
        data: {
          name: data.name,
          slug: data.slug,
          city: data.city || 'Nairobi',
          county: data.county || 'Nairobi',
          address: data.address,
          phone: data.phone,
          email: data.email,
          logoUrl: data.logoUrl,
          brandColor: data.brandColor || '#e11d48',
          openingHours: data.openingHours || '14:00',
          closingHours: data.closingHours || '04:00',
          gpsCoordinates: data.gpsCoordinates,
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          isActive: true,
        },
      });

      const manager = await tx.user.create({
        data: {
          clubUuid: club.clubUuid,
          email: data.managerEmail,
          passwordHash: data.managerPasswordHash,
          fullName: data.managerFullName,
          phone: data.managerPhone,
          role: UserRole.CLUB_ADMIN,
          isActive: true,
          // Force manager to change their temporary password on first login
          mustChangePassword: true,
        },
      });

      return { club, manager };
    });
  }


  async update(clubUuid: string, data: Partial<Club>): Promise<Club> {
    return prisma.club.update({
      where: { clubUuid },
      data,
    });
  }

  async delete(clubUuid: string): Promise<boolean> {
    await prisma.club.update({
      where: { clubUuid },
      data: { deletedAt: new Date(), isActive: false, subscriptionStatus: SubscriptionStatus.CANCELLED },
    });
    return true;
  }

  async assignManager(clubUuid: string, userUuid: string): Promise<User> {
    return prisma.user.update({
      where: { userUuid },
      data: {
        clubUuid,
        role: UserRole.MANAGER,
      },
    });
  }

  async getTables(clubUuid: string): Promise<VenueTable[]> {
    return prisma.venueTable.findMany({
      where: { clubUuid, deletedAt: null },
      include: { qrCode: true },
      orderBy: { tableNumber: 'asc' },
    });
  }

  async generateTablesAndQrs(
    clubUuid: string,
    tableCount: number,
    sectionName: string,
    startFrom?: number,
  ): Promise<{ tables: VenueTable[]; qrs: QrCode[] }> {
    const club = await this.findById(clubUuid);
    if (!club) throw new Error('Club not found');

    const createdTables: VenueTable[] = [];
    const createdQrs: QrCode[] = [];
    const effectiveSection = sectionName?.trim() || 'Main Lounge';

    let firstNum = startFrom;
    if (!firstNum) {
      const maxTable = await prisma.venueTable.findFirst({
        where: { clubUuid, deletedAt: null },
        orderBy: { tableNumber: 'desc' },
      });
      firstNum = maxTable ? maxTable.tableNumber + 1 : 1;
    }

    for (let i = 0; i < tableCount; i++) {
      const tableNum = firstNum + i;
      const table = await prisma.venueTable.upsert({
        where: {
          clubUuid_tableNumber: {
            clubUuid,
            tableNumber: tableNum,
          },
        },
        update: {
          sectionName: effectiveSection,
          deletedAt: null,
          isActive: true,
        },
        create: {
          clubUuid,
          tableNumber: tableNum,
          sectionName: effectiveSection,
          seatingCapacity: 4,
        },
      });

      const qrPayload = `https://drink-hub-ke-customer-pwa.vercel.app/v/${club.slug}/t/${tableNum}`;
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrPayload)}`;

      const qr = await prisma.qrCode.upsert({
        where: { tableUuid: table.tableUuid },
        update: {
          qrCodePayload: qrPayload,
          imageUrl: qrImageUrl,
          isActive: true,
        },
        create: {
          clubUuid,
          tableUuid: table.tableUuid,
          qrCodePayload: qrPayload,
          imageUrl: qrImageUrl,
        },
      });

      createdTables.push(table);
      createdQrs.push(qr);
    }

    return { tables: createdTables, qrs: createdQrs };
  }

  async deleteTable(clubUuid: string, tableNumber: number): Promise<boolean> {
    const table = await prisma.venueTable.findFirst({
      where: { clubUuid, tableNumber, deletedAt: null },
    });

    if (table) {
      await prisma.$transaction([
        prisma.venueTable.update({
          where: { tableUuid: table.tableUuid },
          data: { deletedAt: new Date(), isActive: false },
        }),
        prisma.qrCode.updateMany({
          where: { tableUuid: table.tableUuid },
          data: { isActive: false },
        }),
      ]);
    }

    return true;
  }
}
