-- ==================================================================
-- 02: BOOKING ENGINE & DYNAMIC PRICING SQL FUNCTIONS
-- ==================================================================

-- ------------------------------------------------------------------
-- 1. FUNCTION: calculate_booking_price
-- Calculates exact price based on Member Plan discounts OR Dynamic Pricing rules for Non-Members
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_booking_price(
    p_court_id UUID,
    p_user_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
) RETURNS NUMERIC AS $$
DECLARE
    v_club_id UUID;
    v_sport_type VARCHAR(100);
    v_base_price NUMERIC(10,2);
    v_calculated_price NUMERIC(10,2);
    v_member_tier membership_tier;
    v_court_discount_pct NUMERIC(5,2) := 0.00;
    
    -- Dynamic pricing variables
    v_pricing_enabled BOOLEAN := FALSE;
    v_peak_start INT := 18;
    v_peak_end INT := 22;
    v_peak_mult NUMERIC(3,2) := 1.25;
    v_floor NUMERIC(10,2);
    v_ceiling NUMERIC(10,2);
    v_last_min_disc NUMERIC(5,2) := 0.00;
    v_start_hour INT;
    v_hours_until_start NUMERIC;
BEGIN
    -- Get court info
    SELECT club_id, sport_type, base_price_per_hour
    INTO v_club_id, v_sport_type, v_base_price
    FROM courts
    WHERE id = p_court_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Court with ID % not found', p_court_id;
    END IF;

    -- Check if user has an active membership plan for this club
    SELECT mp.tier, mp.court_discount_pct
    INTO v_member_tier, v_court_discount_pct
    FROM user_memberships um
    JOIN membership_plans mp ON um.plan_id = mp.id
    WHERE um.user_id = p_user_id
      AND um.club_id = v_club_id
      AND um.is_active = TRUE
      AND um.expiry_date >= CURRENT_DATE
    LIMIT 1;

    -- IF USER IS AN ACTIVE MEMBER -> APPLY FIXED PLAN DISCOUNT (No dynamic pricing)
    IF v_member_tier IS NOT NULL THEN
        v_calculated_price := v_base_price * (1.0 - (v_court_discount_pct / 100.0));
        RETURN ROUND(v_calculated_price, 2);
    END IF;

    -- IF USER IS NON-MEMBER -> APPLY DYNAMIC PRICING RULES
    SELECT is_enabled, peak_start_hour, peak_end_hour, peak_multiplier, price_floor, price_ceiling, last_minute_discount_pct
    INTO v_pricing_enabled, v_peak_start, v_peak_end, v_peak_mult, v_floor, v_ceiling, v_last_min_disc
    FROM dynamic_pricing_rules
    WHERE club_id = v_club_id AND sport_type = v_sport_type;

    v_calculated_price := v_base_price;

    IF v_pricing_enabled THEN
        v_start_hour := EXTRACT(HOUR FROM p_start_time AT TIME ZONE 'UTC');
        
        -- Apply Peak Multiplier if within peak hours
        IF v_start_hour >= v_peak_start AND v_start_hour < v_peak_end THEN
            v_calculated_price := v_calculated_price * v_peak_mult;
        END IF;

        -- Apply Last-Minute Discount if slot is within 3 hours
        v_hours_until_start := EXTRACT(EPOCH FROM (p_start_time - CURRENT_TIMESTAMP)) / 3600.0;
        IF v_hours_until_start > 0 AND v_hours_until_start <= 3.0 THEN
            v_calculated_price := v_calculated_price * (1.0 - (v_last_min_disc / 100.0));
        END IF;

        -- Enforce Floor & Ceiling Caps
        IF v_floor IS NOT NULL AND v_calculated_price < v_floor THEN
            v_calculated_price := v_floor;
        END IF;

        IF v_ceiling IS NOT NULL AND v_calculated_price > v_ceiling THEN
            v_calculated_price := v_ceiling;
        END IF;
    END IF;

    RETURN ROUND(v_calculated_price, 2);
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------
-- 2. PROCEDURE/FUNCTION: create_court_booking
-- Creates booking, checks 2/day limit, locks price & records transaction
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_court_booking(
    p_court_id UUID,
    p_user_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_payment_mode payment_mode DEFAULT 'UPI',
    p_coach_id UUID DEFAULT NULL
) RETURNS TABLE (
    booking_id UUID,
    final_price NUMERIC(10,2),
    status_msg TEXT
) AS $$
DECLARE
    v_club_id UUID;
    v_commission_pct NUMERIC(5,2);
    v_price NUMERIC(10,2);
    v_daily_count INT;
    v_booking_id UUID;
    v_commission NUMERIC(10,2);
    v_net_club NUMERIC(10,2);
    v_booking_date DATE;
BEGIN
    -- 1. Validate slot duration (Must be at least 30 min, default 1 hr)
    IF p_end_time <= p_start_time THEN
        RAISE EXCEPTION 'End time must be after start time';
    END IF;

    SELECT club_id INTO v_club_id FROM courts WHERE id = p_court_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Court not found';
    END IF;

    SELECT base_commission_pct INTO v_commission_pct FROM clubs WHERE id = v_club_id;

    -- 2. Enforce Daily Limit: Max 2 bookings per user per day
    v_booking_date := (p_start_time AT TIME ZONE 'UTC')::DATE;
    
    SELECT COUNT(*) INTO v_daily_count
    FROM bookings
    WHERE user_id = p_user_id
      AND (booking_time_range && tstzrange(v_booking_date::timestamptz, (v_booking_date + INTERVAL '1 day')::timestamptz))
      AND status = 'CONFIRMED';

    IF v_daily_count >= 2 THEN
        RAISE EXCEPTION 'Daily limit reached: Maximum 2 court bookings allowed per day.';
    END IF;

    -- 3. Calculate exact final price (Fixed Member rate or Dynamic Non-Member rate)
    v_price := calculate_booking_price(p_court_id, p_user_id, p_start_time, p_end_time);

    -- 4. Insert into bookings (Double booking blocked natively by PostgreSQL Exclusion Constraint)
    INSERT INTO bookings (
        club_id,
        court_id,
        user_id,
        booking_time_range,
        price_charged,
        is_locked,
        status,
        coach_id
    ) VALUES (
        v_club_id,
        p_court_id,
        p_user_id,
        tstzrange(p_start_time, p_end_time),
        v_price,
        TRUE,
        'CONFIRMED',
        p_coach_id
    ) RETURNING id INTO v_booking_id;

    -- 5. Record Transaction in Unified Ledger
    v_commission := ROUND(v_price * (v_commission_pct / 100.0), 2);
    v_net_club := v_price - v_commission;

    INSERT INTO transactions (
        club_id,
        user_id,
        income_source,
        payment_mode,
        gross_amount,
        platform_commission,
        net_club_amount,
        reference_id
    ) VALUES (
        v_club_id,
        p_user_id,
        'COURT_BOOKING',
        p_payment_mode,
        v_price,
        v_commission,
        v_net_club,
        v_booking_id
    );

    RETURN QUERY SELECT v_booking_id, v_price, 'Booking successfully confirmed!'::TEXT;
END;
$$ LANGUAGE plpgsql;
