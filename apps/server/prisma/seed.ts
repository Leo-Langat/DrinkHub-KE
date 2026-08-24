import {
  PrismaClient,
  UserRole,
  SubscriptionStatus,
  TableStatus,
  OfferType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  NotificationType,
  VenueType,
  PrepStation,
  ModifierSelectionType,
  OrderType,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Starting database seed with multi-venue types (Clubs, Cafes, Coffee Shops, Restaurants)...');

  // OWASP: bcrypt cost factor ≥ 12
  const passwordHash = await bcrypt.hash('Password123!', 12);

  // 1. Seed Venues
  // ── A. Nightclub / Lounge
  const alchemist = await prisma.club.upsert({
    where: { slug: 'alchemist-westlands' },
    update: {},
    create: {
      clubUuid: '11111111-1111-1111-1111-111111111111',
      name: 'The Alchemist Westlands',
      slug: 'alchemist-westlands',
      venueType: VenueType.BAR_LOUNGE,
      tagline: 'Creative hub & live entertainment lounge',
      logoUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200',
      bannerUrl: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200',
      phone: '+254712345678',
      email: 'info@alchemist.co.ke',
      city: 'Nairobi',
      county: 'Nairobi',
      address: 'Parklands Road, Westlands',
      brandColor: '#e11d48',
      openingHours: '16:00',
      closingHours: '04:00',
      allowDineIn: true,
      allowTakeaway: true,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      isActive: true,
    },
  });

  // ── B. Coffee Shop
  const javaCoffee = await prisma.club.upsert({
    where: { slug: 'java-coffee-cbd' },
    update: {},
    create: {
      clubUuid: '44444444-4444-4444-4444-444444444444',
      name: 'Java House Coffee Shop',
      slug: 'java-coffee-cbd',
      venueType: VenueType.COFFEE_SHOP,
      tagline: 'Home of rich Kenyan roasted coffees and fresh pastries',
      logoUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=200',
      bannerUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200',
      phone: '+254722112233',
      email: 'cbd@javahouseafrica.com',
      city: 'Nairobi',
      county: 'Nairobi',
      address: 'Kenyatta Avenue, CBD',
      brandColor: '#78350F', // Warm Coffee Amber
      openingHours: '06:30',
      closingHours: '21:00',
      allowDineIn: true,
      allowTakeaway: true,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      isActive: true,
    },
  });

  // ── C. Cafe & Bistro
  const artcaffe = await prisma.club.upsert({
    where: { slug: 'artcaffe-westlands' },
    update: {},
    create: {
      clubUuid: '55555555-5555-5555-5555-555555555555',
      name: 'Artcaffe Bistro & Cafe',
      slug: 'artcaffe-westlands',
      venueType: VenueType.CAFE,
      tagline: 'Freshly baked sourdough, salads, and artisan brunch',
      logoUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200',
      bannerUrl: 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200',
      phone: '+254733445566',
      email: 'westlands@artcaffe.co.ke',
      city: 'Nairobi',
      county: 'Nairobi',
      address: 'Sarit Centre, Ground Floor',
      brandColor: '#059669', // Fresh Sage Green
      openingHours: '07:00',
      closingHours: '23:00',
      allowDineIn: true,
      allowTakeaway: true,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      isActive: true,
    },
  });

  // ── D. Restaurant & Grill
  const carnivore = await prisma.club.upsert({
    where: { slug: 'carnivore-restaurant' },
    update: {},
    create: {
      clubUuid: '66666666-6666-6666-6666-666666666666',
      name: 'The Carnivore Restaurant & Grill',
      slug: 'carnivore-restaurant',
      venueType: VenueType.RESTAURANT,
      tagline: 'World-famous open pit charcoal barbecue and fine dining',
      logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200',
      bannerUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
      phone: '+254722556677',
      email: 'reservations@carnivore.co.ke',
      city: 'Nairobi',
      county: 'Nairobi',
      address: 'Langata Road, Nairobi',
      brandColor: '#B91C1C', // Rich Charcoal Crimson
      openingHours: '12:00',
      closingHours: '23:30',
      allowDineIn: true,
      allowTakeaway: true,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      isActive: true,
    },
  });

  console.info('✅ Venues seeded (Clubs, Coffee Shops, Cafes, Restaurants)');

  // 2. Seed Users
  await prisma.user.upsert({
    where: { email: 'superadmin@drinkhub.co.ke' },
    update: { passwordHash },
    create: {
      userUuid: '00000000-0000-0000-0000-000000000001',
      email: 'superadmin@drinkhub.co.ke',
      passwordHash,
      fullName: 'Platform Admin',
      phone: '+254700000000',
      role: UserRole.PLATFORM_ADMIN,
    },
  });

  // Alchemist Manager & Waiter
  await prisma.user.upsert({
    where: { email: 'admin@alchemist.co.ke' },
    update: { passwordHash },
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
    update: { passwordHash },
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

  // Java House Manager & Barista
  await prisma.user.upsert({
    where: { email: 'manager@javahouse.co.ke' },
    update: { passwordHash },
    create: {
      userUuid: '44444444-1111-1111-1111-000000000001',
      clubUuid: javaCoffee.clubUuid,
      email: 'manager@javahouse.co.ke',
      passwordHash,
      fullName: 'Amina Java Manager',
      phone: '+254722990011',
      role: UserRole.CLUB_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'barista.otieno@javahouse.co.ke' },
    update: { passwordHash },
    create: {
      userUuid: '44444444-1111-1111-1111-000000000002',
      clubUuid: javaCoffee.clubUuid,
      email: 'barista.otieno@javahouse.co.ke',
      passwordHash,
      fullName: 'Otieno Barista',
      phone: '+254722990022',
      role: UserRole.BARISTA,
    },
  });

  console.info('✅ Users seeded');

  // 3. Seed Tables
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
    where: { clubUuid_tableNumber: { clubUuid: javaCoffee.clubUuid, tableNumber: 1 } },
    update: {},
    create: {
      tableUuid: '44444444-4444-1111-1111-000000000001',
      clubUuid: javaCoffee.clubUuid,
      tableNumber: 1,
      sectionName: 'Indoor Lounge',
      seatingCapacity: 2,
      status: TableStatus.AVAILABLE,
    },
  });

  console.info('✅ Tables seeded');

  // 4. Seed Categories & Products for Java House Coffee Shop
  const espressoCat = await prisma.menuCategory.upsert({
    where: { clubUuid_name: { clubUuid: javaCoffee.clubUuid, name: 'Hot Specialty Coffee' } },
    update: {},
    create: {
      categoryUuid: '44444444-3333-1111-1111-000000000001',
      clubUuid: javaCoffee.clubUuid,
      name: 'Hot Specialty Coffee',
      description: 'Single-origin Kenyan arabica espresso drinks',
      displayOrder: 1,
    },
  });

  const coldCoffeeCat = await prisma.menuCategory.upsert({
    where: { clubUuid_name: { clubUuid: javaCoffee.clubUuid, name: 'Iced & Cold Brews' } },
    update: {},
    create: {
      categoryUuid: '44444444-3333-1111-1111-000000000002',
      clubUuid: javaCoffee.clubUuid,
      name: 'Iced & Cold Brews',
      description: 'Chilled iced coffees, frappés, and cold brews',
      displayOrder: 2,
    },
  });

  const pastryCat = await prisma.menuCategory.upsert({
    where: { clubUuid_name: { clubUuid: javaCoffee.clubUuid, name: 'Bakery & Pastries' } },
    update: {},
    create: {
      categoryUuid: '44444444-3333-1111-1111-000000000003',
      clubUuid: javaCoffee.clubUuid,
      name: 'Bakery & Pastries',
      description: 'Freshly baked muffins, croissants & cookies',
      displayOrder: 3,
    },
  });

  // Products for Java
  const caffeLatte = await prisma.product.upsert({
    where: { clubUuid_sku: { clubUuid: javaCoffee.clubUuid, sku: 'JAVA-LATTE-01' } },
    update: {},
    create: {
      productUuid: '44444444-5555-1111-1111-000000000001',
      clubUuid: javaCoffee.clubUuid,
      categoryUuid: espressoCat.categoryUuid,
      name: 'Signature Caffe Latte',
      description: 'Rich espresso poured with velvety steamed milk and a thin layer of foam.',
      price: 360.00,
      sku: 'JAVA-LATTE-01',
      prepStation: PrepStation.BARISTA,
      dietaryTags: ['VEGETARIAN'],
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400',
    },
  });

  const caramelFrappe = await prisma.product.upsert({
    where: { clubUuid_sku: { clubUuid: javaCoffee.clubUuid, sku: 'JAVA-FRAPPE-01' } },
    update: {},
    create: {
      productUuid: '44444444-5555-1111-1111-000000000002',
      clubUuid: javaCoffee.clubUuid,
      categoryUuid: coldCoffeeCat.categoryUuid,
      name: 'Caramel Macchiato Iced Frappé',
      description: 'Blended espresso, caramel drizzle, vanilla cream and whipped topping.',
      price: 480.00,
      sku: 'JAVA-FRAPPE-01',
      prepStation: PrepStation.BARISTA,
      dietaryTags: ['VEGETARIAN'],
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400',
    },
  });

  const butterCroissant = await prisma.product.upsert({
    where: { clubUuid_sku: { clubUuid: javaCoffee.clubUuid, sku: 'JAVA-CROISSANT' } },
    update: {},
    create: {
      productUuid: '44444444-5555-1111-1111-000000000003',
      clubUuid: javaCoffee.clubUuid,
      categoryUuid: pastryCat.categoryUuid,
      name: 'All-Butter French Croissant',
      description: 'Flaky, buttery golden layered pastry baked fresh daily.',
      price: 250.00,
      sku: 'JAVA-CROISSANT',
      prepStation: PrepStation.BAKERY,
      dietaryTags: ['VEGETARIAN'],
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
    },
  });

  // 5. Seed Modifier Groups for Coffee Shop
  const milkModGroup = await prisma.modifierGroup.create({
    data: {
      clubUuid: javaCoffee.clubUuid,
      productUuid: caffeLatte.productUuid,
      name: 'Choice of Milk',
      description: 'Select your preferred dairy or plant-based milk',
      selectionType: ModifierSelectionType.SINGLE,
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      displayOrder: 1,
      options: {
        create: [
          { name: 'Fresh Whole Dairy Milk', priceDelta: 0.00, isDefault: true, displayOrder: 1 },
          { name: 'Creamy Oat Milk', priceDelta: 80.00, isDefault: false, displayOrder: 2 },
          { name: 'Almond Milk', priceDelta: 80.00, isDefault: false, displayOrder: 3 },
          { name: 'Soy Milk', priceDelta: 60.00, isDefault: false, displayOrder: 4 },
        ],
      },
    },
  });

  const sizeModGroup = await prisma.modifierGroup.create({
    data: {
      clubUuid: javaCoffee.clubUuid,
      productUuid: caffeLatte.productUuid,
      name: 'Cup Size',
      description: 'Choose drink volume',
      selectionType: ModifierSelectionType.SINGLE,
      isRequired: true,
      minSelections: 1,
      maxSelections: 1,
      displayOrder: 2,
      options: {
        create: [
          { name: 'Regular (12oz)', priceDelta: 0.00, isDefault: true, displayOrder: 1 },
          { name: 'Large (16oz)', priceDelta: 90.00, isDefault: false, displayOrder: 2 },
          { name: 'Extra Large (20oz)', priceDelta: 150.00, isDefault: false, displayOrder: 3 },
        ],
      },
    },
  });

  const syrupModGroup = await prisma.modifierGroup.create({
    data: {
      clubUuid: javaCoffee.clubUuid,
      productUuid: caffeLatte.productUuid,
      name: 'Flavor Syrups & Shots',
      description: 'Add extra flavor or espresso booster',
      selectionType: ModifierSelectionType.MULTIPLE,
      isRequired: false,
      minSelections: 0,
      maxSelections: 4,
      displayOrder: 3,
      options: {
        create: [
          { name: 'Vanilla Syrup Pump', priceDelta: 50.00, displayOrder: 1 },
          { name: 'Caramel Drizzle', priceDelta: 50.00, displayOrder: 2 },
          { name: 'Hazelnut Shot', priceDelta: 60.00, displayOrder: 3 },
          { name: 'Extra Double Espresso Shot', priceDelta: 100.00, displayOrder: 4 },
        ],
      },
    },
  });

  console.info('✅ Modifiers seeded for Coffee Shop');
  console.info('🎉 Database seeding completed successfully for all venue types!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
