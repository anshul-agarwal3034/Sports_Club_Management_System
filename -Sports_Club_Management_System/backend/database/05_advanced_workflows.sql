-- ==================================================================
-- 05: ADVANCED WORKFLOWS: WAITLIST, HOLDS, FLASH OFFERS, MATCHMAKING,
--     MULTI-CLUB DISCOVERY, AND HISTORICAL PEAK RECOMMENDATIONS
-- ==================================================================

-- ------------------------------------------------------------------
-- 1. CLUB GEOLOCATION & RATING BADGES
-- ------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='clubs' AND column_name='latitude'
    ) THEN
        ALTER TABLE clubs ADD COLUMN latitude NUMERIC(10,7) DEFAULT 12.9716;
        ALTER TABLE clubs ADD COLUMN longitude NUMERIC(10,7) DEFAULT 77.5946;
        ALTER TABLE clubs ADD COLUMN open_time TIME DEFAULT '06:00:00';
        ALTER TABLE clubs ADD COLUMN close_time TIME DEFAULT '23:00:00';
        ALTER TABLE clubs ADD COLUMN rating_badge VARCHAR(20) DEFAULT 'BRONZE'; -- BRONZE, SILVER, PLATINUM
    END IF;
END $$;

-- ------------------------------------------------------------------
-- 2. HAVERSINE DISTANCE SQL FUNCTION (km)
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_distance_km(
    p_lat1 NUMERIC,
    p_lng1 NUMERIC,
    p_lat2 NUMERIC,
    p_lng2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    v_r NUMERIC := 6371.0; -- Earth radius in km
    v_dlat NUMERIC;
    v_dlng NUMERIC;
    v_a NUMERIC;
    v_c NUMERIC;
BEGIN
    IF p_lat1 IS NULL OR p_lng1 IS NULL OR p_lat2 IS NULL OR p_lng2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    v_dlat := RADIANS(p_lat2 - p_lat1);
    v_dlng := RADIANS(p_lng2 - p_lng1);
    
    v_a := POWER(SIN(v_dlat / 2.0), 2) +
           COS(RADIANS(p_lat1)) * COS(RADIANS(p_lat2)) *
           POWER(SIN(v_dlng / 2.0), 2);
           
    v_c := 2.0 * ATAN2(SQRT(v_a), SQRT(1.0 - v_a));
    
    RETURN ROUND(v_r * v_c, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ------------------------------------------------------------------
-- 3. AUTHORITATIVE RESERVATION HOLDS TABLE
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservation_holds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_time_range TSTZRANGE NOT NULL,
    hold_type VARCHAR(50) NOT NULL, -- 'WAITLIST_OFFER', 'PAYMENT_HOLD', 'MATCH_LOBBY_HOLD'
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'RELEASED', 'CONVERTED'
    expires_at TIMESTAMPTZ NOT NULL,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_active_holds 
ON reservation_holds (court_id, expires_at) 
WHERE status = 'ACTIVE';

-- ------------------------------------------------------------------
-- 4. WAITLIST SYSTEM TABLE
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS slot_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    desired_time_range TSTZRANGE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING', -- 'WAITING', 'OFFERED', 'PAYMENT_HOLD', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'
    offer_expires_at TIMESTAMPTZ,
    reservation_hold_id UUID REFERENCES reservation_holds(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Unique index prevents duplicate active waitlist entries, while allowing rejoining after ended
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_waitlist 
ON slot_waitlist (court_id, desired_time_range, user_id) 
WHERE status IN ('WAITING', 'OFFERED', 'PAYMENT_HOLD');

-- Deterministic ordering index
CREATE INDEX IF NOT EXISTS idx_waitlist_fifo 
ON slot_waitlist (court_id, created_at ASC, id ASC) 
WHERE status = 'WAITING';

-- ------------------------------------------------------------------
-- 5. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- 'WAITLIST_OFFER', 'OFFER_EXPIRED', 'FLASH_SALE', 'MATCH_JOIN_REQUEST', 'MATCH_ACCEPTED', 'MATCH_CANCELLED'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    payload JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    channel VARCHAR(50) DEFAULT 'IN_APP',
    delivery_status VARCHAR(50) DEFAULT 'DELIVERED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_notifications 
ON notifications (user_id, created_at DESC);

-- ------------------------------------------------------------------
-- 6. USER NOTIFICATION PREFERENCES
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opt_in_flash_deals BOOLEAN DEFAULT TRUE,
    opt_in_match_alerts BOOLEAN DEFAULT TRUE,
    opt_in_waitlist_alerts BOOLEAN DEFAULT TRUE,
    preferred_sports TEXT[] DEFAULT ARRAY['Padel', 'Tennis'],
    preferred_city VARCHAR(100),
    last_known_lat NUMERIC(10,7),
    last_known_lng NUMERIC(10,7),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------
-- 7. FLASH DEALS CONFIGURATION
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS club_flash_deals_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    sport_type VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE,
    lead_hours_threshold INT DEFAULT 3,
    discount_pct NUMERIC(5,2) DEFAULT 20.00,
    price_floor NUMERIC(10,2) NOT NULL DEFAULT 400.00,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, sport_type)
);

-- ------------------------------------------------------------------
-- 8. MATCHMAKING & FIND PLAYING PARTNERS
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS match_lobbies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    court_id UUID REFERENCES courts(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_type VARCHAR(100) NOT NULL,
    game_type VARCHAR(50) NOT NULL DEFAULT 'CASUAL', -- 'CASUAL', 'COMPETITIVE', 'TOURNAMENT_PRACTICE'
    match_start_time TIMESTAMPTZ NOT NULL,
    match_end_time TIMESTAMPTZ NOT NULL,
    min_skill_level NUMERIC(3,1) DEFAULT 1.0,
    max_skill_level NUMERIC(3,1) DEFAULT 7.0,
    total_capacity INT NOT NULL DEFAULT 4,
    payment_model VARCHAR(50) NOT NULL DEFAULT 'HOST_PAID_SPONSORED', -- 'HOST_PAID_SPONSORED', 'HOST_PAID_REIMBURSED', 'AUTO_SPLIT'
    court_total_price NUMERIC(10,2) DEFAULT 0.00,
    cost_per_player NUMERIC(10,2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- 'DRAFT', 'OPEN', 'FULL', 'COMPLETED', 'CANCELLED'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS match_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES match_lobbies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_host BOOLEAN DEFAULT FALSE,
    approval_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'NO_SHOW'
    payment_status VARCHAR(50) NOT NULL DEFAULT 'NOT_REQUIRED', -- 'NOT_REQUIRED', 'PENDING_PAYMENT', 'PAID', 'REFUNDED'
    share_amount NUMERIC(10,2) DEFAULT 0.00,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    UNIQUE(match_id, user_id)
);

CREATE TABLE IF NOT EXISTS match_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES match_lobbies(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES match_participants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL DEFAULT 'UPI',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS', -- 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'
    transaction_reference VARCHAR(100),
    refund_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sport_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sport_type VARCHAR(100) NOT NULL,
    self_rating NUMERIC(3,1) DEFAULT 2.5,
    verified_rating NUMERIC(3,1),
    is_verified BOOLEAN DEFAULT FALSE,
    matches_played INT DEFAULT 0,
    matches_completed INT DEFAULT 0,
    no_shows INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, sport_type)
);

-- ------------------------------------------------------------------
-- 9. HISTORICAL PEAK-HOUR RECOMMENDATIONS & AUTOPILOT
-- ------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='dynamic_pricing_rules' AND column_name='is_autopilot_enabled'
    ) THEN
        ALTER TABLE dynamic_pricing_rules ADD COLUMN is_autopilot_enabled BOOLEAN DEFAULT FALSE;
        ALTER TABLE dynamic_pricing_rules ADD COLUMN max_auto_multiplier_delta NUMERIC(3,2) DEFAULT 0.10;
        ALTER TABLE dynamic_pricing_rules ADD COLUMN last_autopilot_run_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS pricing_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    sport_type VARCHAR(100) NOT NULL,
    weekday INT NOT NULL, -- 0=Sunday..6=Saturday
    hour_bucket INT NOT NULL, -- 0..23
    observation_period_days INT NOT NULL DEFAULT 30,
    sample_slots_count INT NOT NULL,
    occupancy_pct NUMERIC(5,2) NOT NULL,
    occupancy_band VARCHAR(20) NOT NULL, -- 'OFF_PEAK', 'NORMAL', 'PEAK', 'SUPER_PEAK'
    current_multiplier NUMERIC(3,2) NOT NULL,
    proposed_multiplier NUMERIC(3,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'APPLIED_BY_AUTOPILOT', 'SUPERSEDED'
    decision_by UUID REFERENCES users(id),
    decision_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actioned_at TIMESTAMPTZ
);
