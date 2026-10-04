-- ==================================================================
-- 03: MEMBERSHIPS, REFERRALS & POS CANTEEN SQL FUNCTIONS
-- ==================================================================

-- ------------------------------------------------------------------
-- 1. FUNCTION: purchase_membership
-- Buys plan, adds grace period, updates user role/credit limit, records ledger transaction & releases referral rewards
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION purchase_membership(
    p_user_id UUID,
    p_plan_id UUID,
    p_payment_mode payment_mode DEFAULT 'UPI',
    p_referral_code VARCHAR(50) DEFAULT NULL
) RETURNS TABLE (
    membership_id UUID,
    expiry_date DATE,
    amount_paid NUMERIC(10,2),
    status_msg TEXT
) AS $$
DECLARE
    v_club_id UUID;
    v_tier membership_tier;
    v_price NUMERIC(10,2);
    v_duration INT;
    v_allows_pay_later BOOLEAN;
    v_expiry DATE;
    v_membership_id UUID;
    v_commission_pct NUMERIC(5,2);
    v_commission NUMERIC(10,2);
    v_net_club NUMERIC(10,2);
    v_referrer_id UUID;
BEGIN
    -- 1. Get Plan Details
    SELECT club_id, tier, price, duration_months, allows_pay_later
    INTO v_club_id, v_tier, v_price, v_duration, v_allows_pay_later
    FROM membership_plans
    WHERE id = p_plan_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Membership plan not found';
    END IF;

    SELECT base_commission_pct INTO v_commission_pct FROM clubs WHERE id = v_club_id;

    -- 2. Calculate Expiry Date = Current Date + duration_months + 15 Grace Days
    v_expiry := (CURRENT_DATE + (v_duration || ' months')::INTERVAL + INTERVAL '15 days')::DATE;

    -- 3. Deactivate any existing active membership for this club
    UPDATE user_memberships
    SET is_active = FALSE
    WHERE user_id = p_user_id AND club_id = v_club_id;

    -- 4. Create New Membership Record
    INSERT INTO user_memberships (
        user_id,
        plan_id,
        club_id,
        start_date,
        expiry_date,
        grace_days_added,
        is_active
    ) VALUES (
        p_user_id,
        p_plan_id,
        v_club_id,
        CURRENT_DATE,
        v_expiry,
        15,
        TRUE
    ) RETURNING id INTO v_membership_id;

    -- 5. Update User Profile Role & Pay Later Credit Limit (GOLD = ₹2,000 credit)
    UPDATE users
    SET role = 'MEMBER',
        club_id = v_club_id,
        credit_limit = CASE WHEN v_tier = 'GOLD' THEN 2000.00 ELSE 0.00 END
    WHERE id = p_user_id;

    -- 6. Record Transaction in Unified Ledger
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
        'MEMBERSHIP',
        p_payment_mode,
        v_price,
        v_commission,
        v_net_club,
        v_membership_id
    );

    -- 7. Handle Referral Coupon Processing
    IF p_referral_code IS NOT NULL THEN
        SELECT referrer_id INTO v_referrer_id
        FROM referrals
        WHERE coupon_code = p_referral_code AND is_reward_released = FALSE;

        IF FOUND THEN
            UPDATE referrals
            SET is_reward_released = TRUE
            WHERE coupon_code = p_referral_code;

            -- Award 50 points to referrer upon successful friend signup
            UPDATE users
            SET points_balance = points_balance + 50
            WHERE id = v_referrer_id;
        END IF;
    END IF;

    RETURN QUERY SELECT v_membership_id, v_expiry, v_price, 'Membership activated with bonus 15 days grace period!'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------
-- 2. FUNCTION: get_owner_dashboard_analytics
-- Aggregates revenue, peak-hour heatmaps & expected earnings for Club Owners
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_owner_dashboard_analytics(
    p_club_id UUID
) RETURNS TABLE (
    total_revenue NUMERIC(10,2),
    court_revenue NUMERIC(10,2),
    membership_revenue NUMERIC(10,2),
    shop_revenue NUMERIC(10,2),
    canteen_revenue NUMERIC(10,2),
    net_payout NUMERIC(10,2),
    total_active_members INT,
    total_bookings INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(t.gross_amount), 0.00) AS total_revenue,
        COALESCE(SUM(CASE WHEN t.income_source = 'COURT_BOOKING' THEN t.gross_amount ELSE 0 END), 0.00) AS court_revenue,
        COALESCE(SUM(CASE WHEN t.income_source = 'MEMBERSHIP' THEN t.gross_amount ELSE 0 END), 0.00) AS membership_revenue,
        COALESCE(SUM(CASE WHEN t.income_source = 'SHOP' THEN t.gross_amount ELSE 0 END), 0.00) AS shop_revenue,
        COALESCE(SUM(CASE WHEN t.income_source = 'CANTEEN' THEN t.gross_amount ELSE 0 END), 0.00) AS canteen_revenue,
        COALESCE(SUM(t.net_club_amount), 0.00) AS net_payout,
        (SELECT COUNT(*)::INT FROM user_memberships WHERE club_id = p_club_id AND is_active = TRUE) AS total_active_members,
        (SELECT COUNT(*)::INT FROM bookings WHERE club_id = p_club_id AND status = 'CONFIRMED') AS total_bookings
    FROM transactions t
    WHERE t.club_id = p_club_id;
END;
$$ LANGUAGE plpgsql;
