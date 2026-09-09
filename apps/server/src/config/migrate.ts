import { prisma } from "./prisma";
import { logger } from "./logger";

export async function autoMigrateDatabase(): Promise<void> {
  try {
    logger.info("🔄 Running database auto-migration and schema synchronization...");

    // 1. Ensure required PostgreSQL extensions
    try {
      await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    } catch {
      // Ignored if permissions are restricted
    }

    // 2. Ensure enum types
    try {
      await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_type_enum') THEN
            CREATE TYPE business_type_enum AS ENUM ('RESTAURANT', 'CLUB', 'BAR', 'LOUNGE', 'CAFE', 'FAST_FOOD', 'HOTEL', 'FOOD_COURT', 'OTHER');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_status_enum') THEN
            CREATE TYPE business_status_enum AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
            CREATE TYPE subscription_status_enum AS ENUM ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
            CREATE TYPE user_role_enum AS ENUM ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'ADMIN', 'CLUB_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'WAITER', 'CUSTOMER');
          END IF;
        END $$;
      `);
    } catch (err: any) {
      logger.warn(`Enum creation warning: ${err.message}`);
    }

    // 3. Ensure all values on user_role_enum
    const roleValues = ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'ADMIN', 'CLUB_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'WAITER', 'CUSTOMER'];
    for (const val of roleValues) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS '${val}';`);
      } catch {
        // Ignored if already exists
      }
    }

    // 4. Ensure clubs table and all columns
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS clubs (
          club_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
        );
      `);
    } catch (err: any) {
      logger.warn(`Clubs table creation warning: ${err.message}`);
    }

    const clubsColumns = [
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS business_type business_type_enum NOT NULL DEFAULT 'RESTAURANT';`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS logo_url TEXT;`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS banner_url TEXT;`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS brand_color VARCHAR(50) DEFAULT '#e11d48';`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS email VARCHAR(255);`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Nairobi';`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS county VARCHAR(100) DEFAULT 'Nairobi';`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS address TEXT;`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS gps_coordinates VARCHAR(100);`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS description TEXT;`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Kenya';`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'KES';`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Africa/Nairobi';`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(10) DEFAULT '08:00';`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS closing_hours VARCHAR(10) DEFAULT '23:00';`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS operating_schedule JSONB;`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS business_status business_status_enum NOT NULL DEFAULT 'ACTIVE';`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS subscription_status subscription_status_enum NOT NULL DEFAULT 'ACTIVE';`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`,
      `ALTER TABLE clubs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ(6);`,
    ];

    for (const colQuery of clubsColumns) {
      try {
        await prisma.$executeRawUnsafe(colQuery);
      } catch (err: any) {
        logger.warn(`Column ensure query warning: ${err.message}`);
      }
    }

    // 5. Ensure user_sessions and refresh_tokens tables
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          session_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_uuid UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
          club_uuid UUID REFERENCES clubs(club_uuid) ON DELETE CASCADE,
          ip_address TEXT,
          user_agent TEXT,
          is_valid BOOLEAN NOT NULL DEFAULT true,
          expires_at TIMESTAMPTZ(6) NOT NULL,
          created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
        );
      `);
    } catch (err: any) {
      logger.warn(`user_sessions table creation warning: ${err.message}`);
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          token_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_uuid UUID NOT NULL REFERENCES user_sessions(session_uuid) ON DELETE CASCADE,
          user_uuid UUID NOT NULL REFERENCES users(user_uuid) ON DELETE CASCADE,
          token_hash TEXT NOT NULL UNIQUE,
          is_revoked BOOLEAN NOT NULL DEFAULT false,
          expires_at TIMESTAMPTZ(6) NOT NULL,
          created_at TIMESTAMPTZ(6) NOT NULL DEFAULT NOW()
        );
      `);
    } catch (err: any) {
      logger.warn(`refresh_tokens table creation warning: ${err.message}`);
    }

    // 6. Migrate legacy roles to current standard
    try {
      await prisma.$executeRawUnsafe(`
        UPDATE users SET role = 'SUPER_ADMIN' WHERE role::text = 'PLATFORM_ADMIN';
      `);
      await prisma.$executeRawUnsafe(`
        UPDATE users SET role = 'ADMIN' WHERE role::text IN ('CLUB_ADMIN', 'TENANT_ADMIN');
      `);
    } catch {
      // Ignored if table or values are not ready yet
    }

    logger.info("✅ Database auto-migration completed successfully");
  } catch (error: any) {
    logger.error(`❌ Database auto-migration failed: ${error.message}`);
  }
}
