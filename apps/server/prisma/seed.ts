import { PrismaClient, UserRole, SubscriptionStatus, TableStatus, OfferType, OrderStatus, PaymentMethod, PaymentStatus, NotificationType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Starting database seed for Neon Postgres...');

  // OWASP: bcrypt cost factor ≥ 12
  const passwordHash = await bcrypt.hash('Password123!', 12);

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

  const gplace = await prisma.club.upsert({
    where: { slug: 'g-place' },
    update: {},
    create: {
      clubUuid: '33333333-3333-3333-3333-333333333333',
      name: 'G Place Club',
      slug: 'g-place',
      logoUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=400&auto=format&fit=crop&q=80',
      phone: '+254722334455',
      email: 'info@gplace.co.ke',
      city: 'Nairobi',
      county: 'Nairobi',
      address: 'Kiambu Road, Nairobi',
      brandColor: '#2563EB',
      openingHours: '16:00',
      closingHours: '04:00',
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

  await prisma.user.upsert({
    where: { email: 'admin@alchemist.co.ke' },
    update: { passwordHash },  // refresh hash on re-seed
    create: {
      userUuid: '11111111-1111-1111-1111-000000000001',
      clubUuid: alchemist.clubUuid,
      email: 'admin@alchemist.co.ke',
      passwordHash,
      fullName: 'John Alchemist Manager',
      phone: '+254711111111',
      role: UserRole.CLUB_ADMIN,
    },
  });

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

  // Assign Belvin Rotich as Manager to G Place Club
  await prisma.user.upsert({
    where: { email: 'belvin.rotich@gplace.co.ke' },
    update: { passwordHash, clubUuid: gplace.clubUuid, fullName: 'Belvin Rotich', role: UserRole.CLUB_ADMIN, isActive: true },
    create: {
      userUuid: '33333333-3333-3333-3333-000000000001',
      clubUuid: gplace.clubUuid,
      email: 'belvin.rotich@gplace.co.ke',
      passwordHash,
      fullName: 'Belvin Rotich',
      phone: '+254722334455',
      role: UserRole.CLUB_ADMIN,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'belvin@gplace.co.ke' },
    update: { passwordHash, clubUuid: gplace.clubUuid, fullName: 'Belvin Rotich', role: UserRole.CLUB_ADMIN, isActive: true },
    create: {
      userUuid: '33333333-3333-3333-3333-000000000002',
      clubUuid: gplace.clubUuid,
      email: 'belvin@gplace.co.ke',
      passwordHash,
      fullName: 'Belvin Rotich',
      phone: '+254722334455',
      role: UserRole.CLUB_ADMIN,
      isActive: true,
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

  // G-Place Venue Tables
  await prisma.venueTable.upsert({
    where: { clubUuid_tableNumber: { clubUuid: gplace.clubUuid, tableNumber: 1 } },
    update: {},
    create: {
      tableUuid: '33333333-4444-1111-1111-000000000001',
      clubUuid: gplace.clubUuid,
      tableNumber: 1,
      sectionName: 'Main Lounge',
      seatingCapacity: 4,
      status: TableStatus.AVAILABLE,
    },
  });

  await prisma.venueTable.upsert({
    where: { clubUuid_tableNumber: { clubUuid: gplace.clubUuid, tableNumber: 2 } },
    update: {},
    create: {
      tableUuid: '33333333-4444-1111-1111-000000000002',
      clubUuid: gplace.clubUuid,
      tableNumber: 2,
      sectionName: 'VIP Section',
      seatingCapacity: 6,
      status: TableStatus.AVAILABLE,
    },
  });

  // G-Place Menu Categories
  const gplaceBeers = await prisma.menuCategory.upsert({
    where: { clubUuid_name: { clubUuid: gplace.clubUuid, name: 'Whiskey & Spirits' } },
    update: {},
    create: {
      categoryUuid: '33333333-3333-1111-1111-000000000001',
      clubUuid: gplace.clubUuid,
      name: 'Whiskey & Spirits',
      description: 'Premium whiskeys and spirits',
      displayOrder: 1,
    },
  });

  const gplaceBeersCat = await prisma.menuCategory.upsert({
    where: { clubUuid_name: { clubUuid: gplace.clubUuid, name: 'Cold Beers & Ciders' } },
    update: {},
    create: {
      categoryUuid: '33333333-3333-1111-1111-000000000002',
      clubUuid: gplace.clubUuid,
      name: 'Cold Beers & Ciders',
      description: 'Ice cold lagers and ciders',
      displayOrder: 2,
    },
  });

  // G-Place Products (Jack Daniels, Johnnie Walker Black, Tusker)
  await prisma.product.upsert({
    where: { clubUuid_sku: { clubUuid: gplace.clubUuid, sku: 'JD-750' } },
    update: {},
    create: {
      productUuid: '33333333-5555-1111-1111-000000000001',
      clubUuid: gplace.clubUuid,
      categoryUuid: gplaceBeers.categoryUuid,
      name: "Jack Daniel's Old No. 7 (750ml)",
      description: 'Tennessee sour mash whiskey',
      price: 4500.00,
      sku: 'JD-750',
      imageUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
    },
  });

  await prisma.product.upsert({
    where: { clubUuid_sku: { clubUuid: gplace.clubUuid, sku: 'JW-BLACK-750' } },
    update: {},
    create: {
      productUuid: '33333333-5555-1111-1111-000000000002',
      clubUuid: gplace.clubUuid,
      categoryUuid: gplaceBeers.categoryUuid,
      name: 'Johnnie Walker Black Label (750ml)',
      description: 'Iconic 12 year blended Scotch whisky',
      price: 5200.00,
      sku: 'JW-BLACK-750',
      imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=600&auto=format&fit=crop&q=80',
      isAvailable: true,
    },
  });

  await prisma.product.upsert({
    where: { clubUuid_sku: { clubUuid: gplace.clubUuid, sku: 'TUSK-GPLACE' } },
    update: {},
    create: {
      productUuid: '33333333-5555-1111-1111-000000000003',
      clubUuid: gplace.clubUuid,
      categoryUuid: gplaceBeersCat.categoryUuid,
      name: 'Tusker Lager (500ml)',
      description: 'Ice cold Kenyan lager',
      price: 350.00,
      sku: 'TUSK-GPLACE',
      imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&auto=format&fit=crop&q=80',
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
