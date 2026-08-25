import { Club, User, VenueTable, QrCode } from '@prisma/client';

export interface CreateClubWithManagerInput {
  // Club fields
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
  // Manager fields (already hashed)
  managerPasswordHash: string;
  managerFullName: string;
  managerEmail: string;
  managerPhone?: string;
}

export interface ClubWithManager {
  club: Club;
  manager: User;
}

export interface ITenantRepository {
  findBySlug(slug: string): Promise<Club | null>;
  findById(clubUuid: string): Promise<Club | null>;
  findAll(): Promise<Club[]>;
  create(data: Partial<Club>): Promise<Club>;
  createClubWithManager(data: CreateClubWithManagerInput): Promise<ClubWithManager>;
  update(clubUuid: string, data: Partial<Club>): Promise<Club>;
  delete(clubUuid: string): Promise<boolean>;
  assignManager(clubUuid: string, userUuid: string): Promise<User>;
  getTables(clubUuid: string): Promise<VenueTable[]>;
  generateTablesAndQrs(clubUuid: string, tableCount: number, sectionName: string, startFrom?: number): Promise<{ tables: VenueTable[]; qrs: QrCode[] }>;
  deleteTable(clubUuid: string, tableNumber: number): Promise<boolean>;
}
