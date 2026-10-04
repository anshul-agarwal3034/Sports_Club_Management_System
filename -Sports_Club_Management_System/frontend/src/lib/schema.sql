-- PostgreSQL Schema for SportsHub Venue Operating System
-- Compliant with slot-level exclusion constraints (GiST)

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Enum definitions for roles, membership tiers, and booking lifecycle
CREATE TYPE user_role AS ENUM (
    'player',
    'owner',
    'front_desk',
    'kitchen',
    'coach'
);

CREATE TYPE membership_tier AS ENUM (
    'gold',
    'silver',
    'junior',
    'none'
);

CREATE TYPE booking_status AS ENUM (
    'confirmed',
    'pending',
    'locked',
    'cancelled'
);

-- 1. Clubs Table
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    verified BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Courts Table
CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sport_type VARCHAR(50) NOT NULL, -- 'padel', 'badminton', 'football_turf', 'pickleball', 'tennis'
    base_price_cents INTEGER NOT NULL, -- Stored in smallest currency units (e.g., 60000 = ₹600)
    surface_type VARCHAR(50) DEFAULT 'synthetic_turf',
    is_indoor BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Users Table (with role and membership tier)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role DEFAULT 'player' NOT NULL,
    tier membership_tier DEFAULT 'none' NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Bookings Table with slot-level exclusion constraint preventing double-bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status booking_status DEFAULT 'confirmed' NOT NULL,
    rate_cents INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT check_valid_time_range CHECK (end_time > start_time),
    CONSTRAINT no_overlapping_court_bookings
        EXCLUDE USING gist (
            court_id WITH =,
            tstzrange(start_time, end_time, '[)') WITH &&
        ) WHERE (status <> 'cancelled')
);

-- Indexes for lightning fast queries under 50ms
CREATE INDEX idx_courts_club_id ON courts(club_id);
CREATE INDEX idx_bookings_court_time ON bookings(court_id, start_time, end_time);
CREATE INDEX idx_users_role_tier ON users(role, tier);
