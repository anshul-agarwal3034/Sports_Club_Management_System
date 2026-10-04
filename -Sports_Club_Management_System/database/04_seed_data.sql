-- ==================================================================
-- 04: SEED DATA FOR DEMO & TESTING (2 CLUBS, COURTS, PLANS & BOOKINGS)
-- ==================================================================

-- 1. Insert 2 Sample Clubs
INSERT INTO clubs (id, name, address, city, gst_number, pan_number, is_verified, inspection_status, base_commission_pct)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Skyline Sports Arena', '123 Campus Road', 'Mumbai', '27AAAAA0000A1Z5', 'ABCDE1234F', TRUE, 'VERIFIED', 8.00),
('22222222-2222-2222-2222-222222222222', 'Padel & Turf Champions', '456 Metro Station Blvd', 'Bengaluru', '29BBBBB1111B2Z6', 'FGHIJ5678K', TRUE, 'VERIFIED', 10.00)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Membership Plans for Club 1
INSERT INTO membership_plans (id, club_id, tier, price, duration_months, court_discount_pct, rental_discount_pct, shop_discount_pct, food_discount_pct, allows_pay_later, free_coaching_sessions_per_month)
VALUES
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'GOLD', 4999.00, 3, 50.00, 50.00, 10.00, 0.00, TRUE, 4),
('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'SILVER', 2499.00, 3, 25.00, 25.00, 5.00, 0.00, FALSE, 0),
('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'JUNIOR', 1999.00, 3, 30.00, 30.00, 5.00, 0.00, FALSE, 0)
ON CONFLICT (club_id, tier) DO NOTHING;

-- 3. Insert Courts for Club 1
INSERT INTO courts (id, club_id, name, sport_type, base_price_per_hour, max_capacity)
VALUES
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Court A - Padel Glass', 'Padel', 800.00, 4),
('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Court B - Padel Outdoor', 'Padel', 700.00, 4),
('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Court C - Tennis Synthetic', 'Tennis', 1000.00, 2)
ON CONFLICT (id) DO NOTHING;

-- 4. Dynamic Pricing Rules for Club 1
INSERT INTO dynamic_pricing_rules (club_id, sport_type, is_enabled, strategy, peak_start_hour, peak_end_hour, peak_multiplier, price_floor, price_ceiling, last_minute_discount_pct)
VALUES
('11111111-1111-1111-1111-111111111111', 'Padel', TRUE, 'BALANCED', 18, 22, 1.25, 400.00, 1200.00, 15.00),
('11111111-1111-1111-1111-111111111111', 'Tennis', TRUE, 'BALANCED', 18, 22, 1.30, 500.00, 1500.00, 10.00)
ON CONFLICT (club_id, sport_type) DO NOTHING;

-- 5. Sample Users (Fixed 36-char valid UUIDs)
INSERT INTO users (id, club_id, role, full_name, email, phone, date_of_birth, credit_limit)
VALUES
('01111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'CLUB_OWNER', 'Rahul Sharma (Owner)', 'owner@skyline.com', '9876543210', '1985-05-15', 0),
('02222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'MEMBER', 'Aarav Patel (Gold Member)', 'aarav@gmail.com', '9876543211', '1998-08-20', 2000.00),
('03333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'NON_MEMBER', 'Vikram Singh (Walk-in)', 'vikram@gmail.com', '9876543212', '2001-02-10', 0)
ON CONFLICT (id) DO NOTHING;

-- 6. Activate Membership for Gold Member
INSERT INTO user_memberships (user_id, plan_id, club_id, start_date, expiry_date, grace_days_added, is_active)
VALUES
('02222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months' + INTERVAL '15 days', 15, TRUE)
ON CONFLICT DO NOTHING;

-- 7. Insert Sample Products for Canteen & Shop
INSERT INTO products (club_id, name, category, price, stock_quantity, low_stock_threshold)
VALUES
('11111111-1111-1111-1111-111111111111', 'Pro Padel Racket', 'GEAR', 6999.00, 10, 2),
('11111111-1111-1111-1111-111111111111', 'Padel Racket Rental (1hr)', 'RENTAL', 150.00, 25, 5),
('11111111-1111-1111-1111-111111111111', 'Energy Drink (Electrolyte)', 'CANTEEN', 90.00, 50, 10),
('11111111-1111-1111-1111-111111111111', 'Club Hoodie (L)', 'GEAR', 1499.00, 15, 3)
ON CONFLICT DO NOTHING;
