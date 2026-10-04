-- Enable necessary extensions for GIST index and UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ==================================================================
-- 1. ENUMS
-- ==================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('PLATFORM_ADMIN', 'CLUB_OWNER', 'STAFF', 'KITCHEN_MANAGER', 'COACH', 'MEMBER', 'NON_MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_tier AS ENUM ('GOLD', 'SILVER', 'JUNIOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pricing_strategy AS ENUM ('CONSERVATIVE', 'BALANCED', 'AGGRESSIVE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_mode AS ENUM ('CASH', 'CARD', 'UPI', 'PAY_LATER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('NEW', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE lead_status AS ENUM ('NEW', 'QUOTED', 'CONVERTED', 'LOST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==================================================================
-- 2. CLUBS & PLATFORM MANAGEMENT
-- ==================================================================
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    gst_number VARCHAR(50),
    pan_number VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    inspection_status VARCHAR(50) DEFAULT 'PENDING',
    base_commission_pct NUMERIC(5,2) DEFAULT 8.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================================
-- 3. USERS & PROFILES
-- ==================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID REFERENCES clubs(id) ON DELETE SET NULL, -- NULL for Platform Admin
    role user_role NOT NULL DEFAULT 'NON_MEMBER',
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    guardian_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For Juniors
    points_balance INT DEFAULT 0,
    credit_limit NUMERIC(10,2) DEFAULT 0.00, -- Pay later limit for GOLD members
    current_pay_later_balance NUMERIC(10,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ensure password_hash exists if table was created previously
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
    END IF;
END $$;

-- ==================================================================
-- 4. MEMBERSHIP PLANS & SUBSCRIPTIONS
-- ==================================================================
CREATE TABLE IF NOT EXISTS membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    tier membership_tier NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    duration_months INT NOT NULL DEFAULT 3,
    court_discount_pct NUMERIC(5,2) NOT NULL,
    rental_discount_pct NUMERIC(5,2) NOT NULL,
    shop_discount_pct NUMERIC(5,2) NOT NULL,
    food_discount_pct NUMERIC(5,2) DEFAULT 0.00,
    allows_pay_later BOOLEAN DEFAULT FALSE,
    free_coaching_sessions_per_month INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, tier)
);

CREATE TABLE IF NOT EXISTS user_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES membership_plans(id),
    club_id UUID NOT NULL REFERENCES clubs(id),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    grace_days_added INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================================
-- 5. COURTS & DYNAMIC PRICING RULES
-- ==================================================================
CREATE TABLE IF NOT EXISTS courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sport_type VARCHAR(100) NOT NULL, -- e.g., Padel, Tennis, Badminton
    base_price_per_hour NUMERIC(10,2) NOT NULL,
    max_capacity INT DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    sport_type VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    strategy pricing_strategy DEFAULT 'BALANCED',
    peak_start_hour INT DEFAULT 18, -- 6 PM
    peak_end_hour INT DEFAULT 22,   -- 10 PM
    peak_multiplier NUMERIC(3,2) DEFAULT 1.25,
    price_floor NUMERIC(10,2) NOT NULL,
    price_ceiling NUMERIC(10,2) NOT NULL,
    last_minute_discount_pct NUMERIC(5,2) DEFAULT 15.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, sport_type)
);

-- ==================================================================
-- 6. BOOKINGS (WITH DB-LEVEL EXCLUSION CONSTRAINT)
-- ==================================================================
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_time_range TSTZRANGE NOT NULL,
    price_charged NUMERIC(10,2) NOT NULL,
    is_locked BOOLEAN DEFAULT TRUE,
    status booking_status DEFAULT 'CONFIRMED',
    coach_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Idempotent exclusion constraint check
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'prevent_double_booking'
    ) THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT prevent_double_booking 
        EXCLUDE USING gist (
            court_id WITH =,
            booking_time_range WITH &&
        ) WHERE (status = 'CONFIRMED');
    END IF;
END $$;

-- ==================================================================
-- 7. INVENTORY, PRODUCTS & CANTEEN POS
-- ==================================================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'GEAR', 'RENTAL', 'CANTEEN'
    price NUMERIC(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_number VARCHAR(50),
    status order_status DEFAULT 'NEW',
    total_amount NUMERIC(10,2) NOT NULL,
    discount_applied NUMERIC(10,2) DEFAULT 0.00,
    final_amount NUMERIC(10,2) NOT NULL,
    payment_mode payment_mode DEFAULT 'UPI',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL
);

-- ==================================================================
-- 8. UNIFIED FINANCIAL LEDGER & TRANSACTIONS
-- ==================================================================
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    income_source VARCHAR(50) NOT NULL, -- 'COURT_BOOKING', 'MEMBERSHIP', 'SHOP', 'CANTEEN'
    payment_mode payment_mode NOT NULL,
    gross_amount NUMERIC(10,2) NOT NULL,
    platform_commission NUMERIC(10,2) DEFAULT 0.00,
    net_club_amount NUMERIC(10,2) NOT NULL,
    reference_id UUID, -- References booking_id, order_id, or membership_id
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==================================================================
-- 9. REFERRALS & CRM LEADS
-- ==================================================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    friend_discount_pct NUMERIC(5,2) DEFAULT 10.00,
    is_reward_released BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    message TEXT,
    status lead_status DEFAULT 'NEW',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
