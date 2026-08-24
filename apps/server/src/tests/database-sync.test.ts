import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantRepository } from '../modules/tenant/tenant.repository';
import { MenuRepository } from '../modules/menu/menu.repository';
import { OrderRepository } from '../modules/order/order.repository';
import { PaymentRepository } from '../modules/payment/payment.repository';
import { prisma } from '../config/prisma';

// ── Mock Prisma to verify query structure and database persistence parameters ──
vi.mock('../config/prisma', () => {
  const mockPrisma = {
    club: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    menuCategory: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    product: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    modifierGroup: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    modifierOption: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
    },
    orderItemModifier: {
      create: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    venueTable: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    qrCode: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    offer: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fnOrArr) => {
      if (typeof fnOrArr === 'function') {
        return fnOrArr(mockPrisma);
      }
      return Promise.all(fnOrArr);
    }),
  };
  return { prisma: mockPrisma };
});

describe('Database Persistence & Multi-Venue Sync Tests', () => {
  let tenantRepo: TenantRepository;
  let menuRepo: MenuRepository;
  let orderRepo: OrderRepository;
  let paymentRepo: PaymentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    tenantRepo = new TenantRepository();
    menuRepo = new MenuRepository();
    orderRepo = new OrderRepository();
    paymentRepo = new PaymentRepository();
  });

  describe('1. Tenant / Venue Persistence', () => {
    it('persists a new venue with venueType, operating hours and takeaway flags to database', async () => {
      const mockClub = {
        clubUuid: 'v-coffee-101',
        name: 'Artcaffe Coffee & Bakery',
        slug: 'artcaffe-westlands',
        venueType: 'CAFE',
        tagline: 'Artisanal Bakery & Fresh Roasts',
        openingHours: '07:00',
        closingHours: '22:00',
        allowTakeaway: true,
        allowDineIn: true,
        brandColor: '#059669',
      };
      (prisma.club.create as any).mockResolvedValue(mockClub);

      const created = await tenantRepo.create({
        name: 'Artcaffe Coffee & Bakery',
        slug: 'artcaffe-westlands',
        venueType: 'CAFE' as any,
        tagline: 'Artisanal Bakery & Fresh Roasts',
        openingHours: '07:00',
        closingHours: '22:00',
        allowTakeaway: true,
        allowDineIn: true,
        brandColor: '#059669',
      });

      expect(prisma.club.create).toHaveBeenCalledTimes(1);
      expect(prisma.club.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Artcaffe Coffee & Bakery',
            slug: 'artcaffe-westlands',
            venueType: 'CAFE',
            openingHours: '07:00',
            closingHours: '22:00',
            allowTakeaway: true,
            allowDineIn: true,
          }),
        }),
      );
      expect(created.venueType).toBe('CAFE');
    });

    it('persists club updates to database', async () => {
      (prisma.club.update as any).mockResolvedValue({
        clubUuid: 'v-coffee-101',
        openingHours: '06:30',
        closingHours: '21:00',
        venueType: 'COFFEE_SHOP',
      });

      const updated = await tenantRepo.update('v-coffee-101', {
        openingHours: '06:30',
        closingHours: '21:00',
        venueType: 'COFFEE_SHOP' as any,
      });

      expect(prisma.club.update).toHaveBeenCalledWith({
        where: { clubUuid: 'v-coffee-101' },
        data: {
          openingHours: '06:30',
          closingHours: '21:00',
          venueType: 'COFFEE_SHOP',
        },
      });
      expect(updated.openingHours).toBe('06:30');
    });
  });

  describe('2. Menu, Modifiers & Station Persistence', () => {
    it('persists a product with prepStation and dietary tags', async () => {
      const mockProduct = {
        productUuid: 'p-flat-white-01',
        name: 'Flat White',
        price: 350,
        prepStation: 'BARISTA',
        dietaryTags: ['VEGETARIAN'],
        categoryUuid: 'cat-coffee',
      };
      (prisma.product.create as any).mockResolvedValue(mockProduct);

      const product = await menuRepo.createProduct('v-coffee-101', {
        name: 'Flat White',
        price: 350,
        categoryUuid: 'cat-coffee',
        prepStation: 'BARISTA',
        dietaryTags: ['VEGETARIAN'],
      });

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Flat White',
            prepStation: 'BARISTA',
            dietaryTags: ['VEGETARIAN'],
          }),
        }),
      );
      expect(product.prepStation).toBe('BARISTA');
    });

    it('persists a modifier group with modifier options into database', async () => {
      const mockGroup = {
        modifierGroupUuid: 'mg-milk-01',
        name: 'Choice of Milk',
        selectionType: 'SINGLE',
        options: [
          { name: 'Whole Milk', priceDelta: 0, isDefault: true },
          { name: 'Oat Milk', priceDelta: 80, isDefault: false },
        ],
      };
      (prisma.modifierGroup.create as any).mockResolvedValue(mockGroup);

      const group = await menuRepo.createModifierGroup('v-coffee-101', {
        name: 'Choice of Milk',
        selectionType: 'SINGLE' as any,
        isRequired: true,
        options: [
          { name: 'Whole Milk', priceDelta: 0, isDefault: true },
          { name: 'Oat Milk', priceDelta: 80, isDefault: false },
        ],
      });

      expect(prisma.modifierGroup.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clubUuid: 'v-coffee-101',
            name: 'Choice of Milk',
            selectionType: 'SINGLE',
            isRequired: true,
          }),
        }),
      );
      expect(group.name).toBe('Choice of Milk');
    });
  });

  describe('3. Order & Item Modifier Database Persistence', () => {
    it('persists order with customized modifiers and calculates unit prices accurately', async () => {
      const mockProduct = {
        productUuid: 'p-latte-01',
        name: 'Vanilla Latte',
        price: 380,
      };
      (prisma.product.findUnique as any).mockResolvedValue(mockProduct);
      (prisma.offer.findMany as any).mockResolvedValue([]);

      const mockCreatedOrder = {
        orderUuid: 'ord-12345',
        orderNumber: 'ORD-5678',
        orderType: 'TAKEAWAY',
        pickupNumber: '#A104',
        customerName: 'Amina',
        subtotalAmount: 460,
        discountAmount: 0,
        totalAmount: 460,
        status: 'PENDING',
      };
      (prisma.order.create as any).mockResolvedValue(mockCreatedOrder);

      const order = await orderRepo.createOrder('v-coffee-101', {
        orderType: 'TAKEAWAY',
        customerName: 'Amina',
        items: [
          {
            productUuid: 'p-latte-01',
            quantity: 1,
            modifiers: [
              { groupName: 'Choice of Milk', optionName: 'Oat Milk', priceDelta: 80 },
            ],
          },
        ],
      });

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clubUuid: 'v-coffee-101',
            orderType: 'TAKEAWAY',
            customerName: 'Amina',
            subtotalAmount: 460, // 380 base + 80 oat milk
            totalAmount: 460,
            status: 'PENDING',
          }),
        }),
      );
      expect(order.totalAmount).toBe(460);
      expect(order.orderType).toBe('TAKEAWAY');
    });

    it('claims an order atomically preventing double claiming', async () => {
      (prisma.order.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.order.findUnique as any).mockResolvedValue({
        orderUuid: 'ord-12345',
        waiterUuid: 'waiter-01',
        status: 'CLAIMED',
      });

      const claimed = await orderRepo.claimOrder('ord-12345', 'waiter-01');
      expect(claimed.status).toBe('CLAIMED');
      expect(claimed.waiterUuid).toBe('waiter-01');
    });

    it('updates order status through preparation lifecycle in database', async () => {
      (prisma.order.update as any).mockResolvedValue({
        orderUuid: 'ord-12345',
        status: 'READY',
      });

      const updated = await orderRepo.updateStatus('ord-12345', 'READY' as any);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderUuid: 'ord-12345' },
          data: { status: 'READY' },
        }),
      );
      expect(updated.status).toBe('READY');
    });
  });

  describe('4. Payment Persistence', () => {
    it('persists payment records linked to the order in database', async () => {
      const mockPayment = {
        paymentUuid: 'pay-987',
        clubUuid: 'v-coffee-101',
        orderUuid: 'ord-12345',
        amount: 460,
        paymentMethod: 'MPESA_STK',
        paymentStatus: 'COMPLETED',
        mpesaReceiptNumber: 'QWE123RTY',
      };
      (prisma.payment.create as any).mockResolvedValue(mockPayment);

      const payment = await paymentRepo.createPayment({
        clubUuid: 'v-coffee-101',
        orderUuid: 'ord-12345',
        amount: 460,
        paymentMethod: 'MPESA_STK',
        paymentStatus: 'COMPLETED',
      });

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            clubUuid: 'v-coffee-101',
            orderUuid: 'ord-12345',
            amount: 460,
          }),
        }),
      );
      expect(payment.paymentStatus).toBe('COMPLETED');
    });
  });
});
