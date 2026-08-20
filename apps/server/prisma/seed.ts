import { PrismaClient, UserRole, SubscriptionStatus, TableStatus, OfferType, OrderStatus, PaymentMethod, PaymentStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Starting database seed for Neon Postgres...');

  // OWASP: bcrypt cost factor ≥ 12
  const passwordHash = await bcrypt.hash('Password123!', 12);
  const managerPasswordHash = await bcrypt.hash('Belvin123', 12);

  // 1. Seed Clubs
  const alchemist = await prisma.club.upsert({
    where: { slug: 'alchemist-westlands' },
    update: {},
    create: {
      clubUuid: '11111111-1111-1111-1111-111111111111',
      name: 'The Alchemist Westlands',
      slug: 'alchemist-westlands',
      logoUrl: 'https://drinkhub.co.ke/logos/alchemist.png',
      phone: '+254712345678',
      email: 'info@alchemist.co.ke',
      city: 'Nairobi',
      county: 'Nairobi',
      address: 'Parklands Road, Westlands',
      brandColor: '#e11d48',
      openingHours: '14:00',
      closingHours: '04:00',
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      isActive: true,
    },
  });

  const bclub = await prisma.club.upsert({
    where: { slug: 'bclub-kilimani' },
    update: {},
    create: {
      clubUuid: '22222222-2222-2222-2222-222222222222',
      name: 'B-Club Kilimani',
      slug: 'bclub-kilimani',
      logoUrl: 'https://drinkhub.co.ke/logos/bclub.png',
      phone: '+254722998877',
      email: 'vip@bclub.co.ke',
      city: 'Nairobi',
      county: 'Nairobi',
      address: 'Galana Plaza, Kilimani',
      brandColor: '#7c3aed',
      openingHours: '18:00',
      closingHours: '05:00',
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      isActive: true,
    },
  });

  console.info('✅ Clubs seeded');

  // 2. Seed Users
  await prisma.user.upsert({
    where: { email: 'superadmin@drinkhub.co.ke' },
    update: { passwordHash },  // refresh hash on re-seed
    create: {
      userUuid: '00000000-0000-0000-0000-000000000001',
      email: 'superadmin@drinkhub.co.ke',
      passwordHash,
      fullName: 'Platform Admin',
      phone: '+254700000000',
      role: UserRole.PLATFORM_ADMIN,
    },
  });

  // Upsert or update belvinrotich@gmail.com with Belvin123 password
  const existingBelvin = await prisma.user.findUnique({ where: { email: 'belvinrotich@gmail.com' } });
  if (existingBelvin) {
    await prisma.user.update({
      where: { email: 'belvinrotich@gmail.com' },
      data: {
        passwordHash: managerPasswordHash,
        fullName: 'Belvin Rotich',
        role: UserRole.CLUB_ADMIN,
        clubUuid: alchemist.clubUuid,
        mustChangePassword: false,
      },
    });
    try {
      await prisma.user.deleteMany({ where: { email: 'admin@alchemist.co.ke' } });
    } catch {}
  } else {
    const oldAdmin = await prisma.user.findUnique({ where: { email: 'admin@alchemist.co.ke' } });
    if (oldAdmin) {
      await prisma.user.update({
        where: { email: 'admin@alchemist.co.ke' },
        data: {
          email: 'belvinrotich@gmail.com',
          passwordHash: managerPasswordHash,
          fullName: 'Belvin Rotich',
          role: UserRole.CLUB_ADMIN,
          mustChangePassword: false,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          userUuid: '11111111-1111-1111-1111-000000000001',
          clubUuid: alchemist.clubUuid,
          email: 'belvinrotich@gmail.com',
          passwordHash: managerPasswordHash,
          fullName: 'Belvin Rotich',
          phone: '+254711111111',
          role: UserRole.CLUB_ADMIN,
          mustChangePassword: false,
        },
      });
    }
  }

  await prisma.user.upsert({
    where: { email: 'waiter.kamau@alchemist.co.ke' },
    update: { passwordHash },  // refresh hash on re-seed
    create: {
      userUuid: '11111111-1111-1111-1111-000000000002',
      clubUuid: alchemist.clubUuid,
      email: 'waiter.kamau@alchemist.co.ke',
      passwordHash,
      fullName: 'Kamau Njoroge',
      phone: '+254711223344',
      role: UserRole.WAITER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@bclub.co.ke' },
    update: { passwordHash },  // refresh hash on re-seed
    create: {
      userUuid: '22222222-2222-2222-2222-000000000001',
      clubUuid: bclub.clubUuid,
      email: 'admin@bclub.co.ke',
      passwordHash,
      fullName: 'Sarah B-Club Manager',
      phone: '+254722000111',
      role: UserRole.CLUB_ADMIN,
    },
  });

  console.info('✅ Users seeded');

  // 3. Seed Venue Tables
  await prisma.venueTable.upsert({
    where: { clubUuid_tableNumber: { clubUuid: alchemist.clubUuid, tableNumber: 1 } },
    update: {},
    create: {
      tableUuid: '11111111-4444-1111-1111-000000000001',
      clubUuid: alchemist.clubUuid,
      tableNumber: 1,
      sectionName: 'Main Courtyard',
      seatingCapacity: 4,
      status: TableStatus.AVAILABLE,
    },
  });

  await prisma.venueTable.upsert({
    where: { clubUuid_tableNumber: { clubUuid: alchemist.clubUuid, tableNumber: 2 } },
    update: {},
    create: {
      tableUuid: '11111111-4444-1111-1111-000000000002',
      clubUuid: alchemist.clubUuid,
      tableNumber: 2,
      sectionName: 'Main Courtyard',
      seatingCapacity: 6,
      status: TableStatus.OCCUPIED,
    },
  });

  await prisma.venueTable.upsert({
    where: { clubUuid_tableNumber: { clubUuid: alchemist.clubUuid, tableNumber: 10 } },
    update: {},
    create: {
      tableUuid: '11111111-4444-1111-1111-000000000003',
      clubUuid: alchemist.clubUuid,
      tableNumber: 10,
      sectionName: 'VIP Lounge',
      seatingCapacity: 8,
      status: TableStatus.RESERVED,
    },
  });

  console.info('✅ Tables seeded');

  // 4. Seed Menu Categories
  const beersCat = await prisma.menuCategory.upsert({
    where: { clubUuid_name: { clubUuid: alchemist.clubUuid, name: 'Local & Craft Beers' } },
    update: {},
    create: {
      categoryUuid: '11111111-3333-1111-1111-000000000001',
      clubUuid: alchemist.clubUuid,
      name: 'Local & Craft Beers',
      description: 'Cold Kenyan lager and craft beers',
      displayOrder: 1,
    },
  });

  const cocktailsCat = await prisma.menuCategory.upsert({
    where: { clubUuid_name: { clubUuid: alchemist.clubUuid, name: 'Cocktails & Mixers' } },
    update: {},
    create: {
      categoryUuid: '11111111-3333-1111-1111-000000000002',
      clubUuid: alchemist.clubUuid,
      name: 'Cocktails & Mixers',
      description: 'Signature African infused cocktails',
      displayOrder: 2,
    },
  });

  const foodCat = await prisma.menuCategory.upsert({
    where: { clubUuid_name: { clubUuid: alchemist.clubUuid, name: 'Bitings & Grill' } },
    update: {},
    create: {
      categoryUuid: '11111111-3333-1111-1111-000000000003',
      clubUuid: alchemist.clubUuid,
      name: 'Bitings & Grill',
      description: 'Nyama Choma and bar snacks',
      displayOrder: 3,
    },
  });

  console.info('✅ Menu categories seeded');

  // 5. Seed Products
  await prisma.product.upsert({
    where: { clubUuid_sku: { clubUuid: alchemist.clubUuid, sku: 'TUSK-500' } },
    update: {},
    create: {
      productUuid: '11111111-5555-1111-1111-000000000001',
      clubUuid: alchemist.clubUuid,
      categoryUuid: beersCat.categoryUuid,
      name: 'Tusker Lager (500ml)',
      description: 'Kenya finest ice cold lager',
      price: 350.00,
      sku: 'TUSK-500',
      isAvailable: true,
    },
  });

  await prisma.product.upsert({
    where: { clubUuid_sku: { clubUuid: alchemist.clubUuid, sku: 'WCAP-500' } },
    update: {},
    create: {
      productUuid: '11111111-5555-1111-1111-000000000002',
      clubUuid: alchemist.clubUuid,
      categoryUuid: beersCat.categoryUuid,
      name: 'White Cap Crisp (500ml)',
      description: 'Sugar-free crisp lager',
      price: 380.00,
      sku: 'WCAP-500',
      isAvailable: true,
    },
  });

  await prisma.product.upsert({
    where: { clubUuid_sku: { clubUuid: alchemist.clubUuid, sku: 'DAWA-01' } },
    update: {},
    create: {
      productUuid: '11111111-5555-1111-1111-000000000003',
      clubUuid: alchemist.clubUuid,
      categoryUuid: cocktailsCat.categoryUuid,
      name: 'Nairobi Dawa Cocktail',
      description: 'Vodka, honey, lime & ginger stem',
      price: 750.00,
      sku: 'DAWA-01',
      isAvailable: true,
    },
  });

  await prisma.product.upsert({
    where: { clubUuid_sku: { clubUuid: alchemist.clubUuid, sku: 'CHOMA-1KG' } },
    update: {},
    create: {
      productUuid: '11111111-5555-1111-1111-000000000004',
      clubUuid: alchemist.clubUuid,
      categoryUuid: foodCat.categoryUuid,
      name: 'Nyama Choma Platter (1kg)',
      description: 'Grilled goat meat served with Kachumbari',
      price: 1800.00,
      sku: 'CHOMA-1KG',
      isAvailable: true,
    },
  });

  console.info('✅ Products seeded');

  console.info('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
