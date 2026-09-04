import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BusinessService } from './business.service';
import { BusinessRepository } from './business.repository';
import { prisma } from '../../config/prisma';
import {
  UnauthorizedError,
  ForbiddenError,
} from '../../common/errors/app-error';
import { UserRole, BusinessType, BusinessStatus, SubscriptionStatus } from '@prisma/client';

vi.mock('../../config/prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
    business: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe('BusinessService Unit Tests', () => {
  let businessService: BusinessService;
  let mockBusinessRepository: BusinessRepository;

  const mockBusiness = {
    businessUuid: 'biz-uuid-1',
    name: 'The Alchemist Bar',
    slug: 'the-alchemist-bar',
    businessType: BusinessType.BAR,
    description: 'Premier outdoor venue and lounge',
    email: 'info@alchemist.co.ke',
    phone: '0712345678',
    address: 'Parklands Road',
    city: 'Nairobi',
    county: 'Nairobi',
    country: 'Kenya',
    logoUrl: '/uploads/logo.png',
    bannerUrl: null,
    themeColor: '#2563EB',
    timezone: 'Africa/Nairobi',
    currency: 'KES',
    openingHours: '08:00',
    closingHours: '23:00',
    operatingSchedule: {
      monday: { isOpen: true, openingTime: '08:00', closingTime: '23:00', crossesMidnight: false },
      tuesday: { isOpen: true, openingTime: '08:00', closingTime: '23:00', crossesMidnight: false },
      wednesday: { isOpen: true, openingTime: '08:00', closingTime: '23:00', crossesMidnight: false },
      thursday: { isOpen: true, openingTime: '08:00', closingTime: '23:00', crossesMidnight: false },
      friday: { isOpen: true, openingTime: '18:00', closingTime: '03:00', crossesMidnight: true },
      saturday: { isOpen: true, openingTime: '18:00', closingTime: '03:00', crossesMidnight: true },
      sunday: { isOpen: false, openingTime: null, closingTime: null, crossesMidnight: false },
    },
    status: BusinessStatus.ACTIVE,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    deletedAt: null,
  };

  const mockAdminUser = {
    userUuid: 'admin-user-uuid-1',
    role: UserRole.ADMIN,
    isActive: true,
    businessUuid: 'biz-uuid-1',
    business: mockBusiness,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockBusinessRepository = new BusinessRepository();
    businessService = new BusinessService(mockBusinessRepository);
  });

  describe('Admin Validation & Tenant Isolation', () => {
    it('should throw UnauthorizedError if user does not exist', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(businessService.getProfile('missing-user')).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('should throw UnauthorizedError if admin account is deactivated', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        ...mockAdminUser,
        isActive: false,
      } as any);

      await expect(businessService.getProfile('admin-user-uuid-1')).rejects.toThrow(
        'Your account has been deactivated',
      );
    });

    it('should throw ForbiddenError if acting user is not ADMIN (e.g. MANAGER or WAITER)', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        ...mockAdminUser,
        role: UserRole.MANAGER,
      } as any);

      await expect(businessService.getProfile('admin-user-uuid-1')).rejects.toThrow(
        ForbiddenError,
      );
    });

    it('should throw ForbiddenError if business is inactive or deleted', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        ...mockAdminUser,
        business: {
          ...mockBusiness,
          isActive: false,
        },
      } as any);

      await expect(businessService.getProfile('admin-user-uuid-1')).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  describe('getProfile', () => {
    it('should return complete BusinessProfileDTO for the authenticated Admin business', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockAdminUser as any);

      const profile = await businessService.getProfile('admin-user-uuid-1');

      expect(profile.id).toBe('biz-uuid-1');
      expect(profile.name).toBe('The Alchemist Bar');
      expect(profile.businessType).toBe(BusinessType.BAR);
      expect(profile.country).toBe('Kenya');
      expect(profile.currency).toBe('KES');
      expect(profile.timezone).toBe('Africa/Nairobi');
      expect(profile.operatingSchedule?.friday.crossesMidnight).toBe(true);
      expect(profile.operatingSchedule?.sunday.isOpen).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update allowed profile fields and record audit logs', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockAdminUser as any);
      vi.spyOn(mockBusinessRepository, 'updateBusinessProfile').mockResolvedValue({
        ...mockBusiness,
        name: 'The Alchemist Lounge & Restaurant',
        themeColor: '#10B981',
      } as any);
      vi.spyOn(mockBusinessRepository, 'createAuditLog').mockResolvedValue();

      const updated = await businessService.updateProfile(
        'admin-user-uuid-1',
        {
          name: 'The Alchemist Lounge & Restaurant',
          themeColor: '#10B981',
          description: 'Updated description',
        },
        '127.0.0.1',
      );

      expect(mockBusinessRepository.updateBusinessProfile).toHaveBeenCalledWith(
        'biz-uuid-1',
        expect.objectContaining({
          name: 'The Alchemist Lounge & Restaurant',
          themeColor: '#10B981',
        }),
      );
      expect(mockBusinessRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          businessUuid: 'biz-uuid-1',
          action: 'BUSINESS_PROFILE_UPDATED',
          entityType: 'BUSINESS',
          entityUuid: 'biz-uuid-1',
        }),
      );
      expect(mockBusinessRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          businessUuid: 'biz-uuid-1',
          action: 'BUSINESS_BRANDING_UPDATED',
        }),
      );
      expect(updated.name).toBe('The Alchemist Lounge & Restaurant');
      expect(updated.themeColor).toBe('#10B981');
    });
  });

  describe('updateSettings', () => {
    it('should update operational settings including overnight operating hours and record audit log', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockAdminUser as any);
      const newSchedule = {
        ...mockBusiness.operatingSchedule,
        friday: { isOpen: true, openingTime: '19:00', closingTime: '04:00', crossesMidnight: true },
      };

      vi.spyOn(mockBusinessRepository, 'updateBusinessSettings').mockResolvedValue({
        ...mockBusiness,
        timezone: 'Africa/Nairobi',
        currency: 'USD',
        operatingSchedule: newSchedule,
      } as any);
      vi.spyOn(mockBusinessRepository, 'createAuditLog').mockResolvedValue();

      const updated = await businessService.updateSettings(
        'admin-user-uuid-1',
        {
          currency: 'USD',
          operatingSchedule: newSchedule,
        },
        '192.168.1.1',
      );

      expect(mockBusinessRepository.updateBusinessSettings).toHaveBeenCalledWith(
        'biz-uuid-1',
        expect.objectContaining({
          currency: 'USD',
          operatingSchedule: newSchedule,
        }),
      );
      expect(mockBusinessRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          businessUuid: 'biz-uuid-1',
          action: 'BUSINESS_SETTINGS_UPDATED',
        }),
      );
      expect(mockBusinessRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          businessUuid: 'biz-uuid-1',
          action: 'BUSINESS_OPERATING_HOURS_UPDATED',
        }),
      );
      expect(updated.currency).toBe('USD');
    });
  });

  describe('uploadLogo', () => {
    it('should update business logo and record audit log', async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockAdminUser as any);
      vi.spyOn(mockBusinessRepository, 'updateLogo').mockResolvedValue({
        ...mockBusiness,
        logoUrl: '/uploads/new-logo-123.png',
      } as any);
      vi.spyOn(mockBusinessRepository, 'createAuditLog').mockResolvedValue();

      const result = await businessService.uploadLogo(
        'admin-user-uuid-1',
        '/uploads/new-logo-123.png',
        '127.0.0.1',
      );

      expect(mockBusinessRepository.updateLogo).toHaveBeenCalledWith(
        'biz-uuid-1',
        '/uploads/new-logo-123.png',
      );
      expect(mockBusinessRepository.createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'BUSINESS_LOGO_UPDATED',
          entityUuid: 'biz-uuid-1',
        }),
      );
      expect(result.logoUrl).toBe('/uploads/new-logo-123.png');
    });
  });
});
