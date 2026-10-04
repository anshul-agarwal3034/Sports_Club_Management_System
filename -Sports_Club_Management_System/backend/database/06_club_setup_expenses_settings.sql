-- ==================================================================
-- 06: CLUB ONBOARDING SETUP FLOW, CAPABILITIES, SETTINGS, AND EXPENSES
-- ==================================================================

-- ------------------------------------------------------------------
-- 1. EXTEND CLUBS TABLE WITH SETUP, CAPABILITIES & BUSINESS DETAILS
-- ------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='clubs' AND column_name='setup_status'
    ) THEN
        ALTER TABLE clubs ADD COLUMN state VARCHAR(100) DEFAULT 'Maharashtra';
        ALTER TABLE clubs ADD COLUMN postal_code VARCHAR(20) DEFAULT '400001';
        ALTER TABLE clubs ADD COLUMN phone VARCHAR(50) DEFAULT '+91 98765 43210';
        ALTER TABLE clubs ADD COLUMN email VARCHAR(255) DEFAULT 'contact@skylinesports.com';
        ALTER TABLE clubs ADD COLUMN description TEXT DEFAULT 'Premier multi-sport club featuring world-class padel, tennis, and badminton facilities.';
        ALTER TABLE clubs ADD COLUMN total_area NUMERIC(10,2) DEFAULT 25000.00;
        ALTER TABLE clubs ADD COLUMN total_area_unit VARCHAR(20) DEFAULT 'sq_ft';
        ALTER TABLE clubs ADD COLUMN weekly_closures JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE clubs ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';
        ALTER TABLE clubs ADD COLUMN setup_status VARCHAR(50) DEFAULT 'APPROVED'; -- INCOMPLETE, PENDING_REVIEW, APPROVED, NEEDS_REVISION, REJECTED
        ALTER TABLE clubs ADD COLUMN setup_step INT DEFAULT 5;
        ALTER TABLE clubs ADD COLUMN draft_data JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE clubs ADD COLUMN legal_business_name VARCHAR(255) DEFAULT 'Skyline Sports Association LLP';
        ALTER TABLE clubs ADD COLUMN business_type VARCHAR(100) DEFAULT 'LLP';
        ALTER TABLE clubs ADD COLUMN business_reg_number VARCHAR(100) DEFAULT 'LLPIN-AAO-1234';
        ALTER TABLE clubs ADD COLUMN gst_registered BOOLEAN DEFAULT TRUE;
        ALTER TABLE clubs ADD COLUMN business_doc_url TEXT DEFAULT NULL;
        ALTER TABLE clubs ADD COLUMN business_doc_name VARCHAR(255) DEFAULT NULL;
        ALTER TABLE clubs ADD COLUMN rejection_reason TEXT DEFAULT NULL;
        
        -- Capabilities
        ALTER TABLE clubs ADD COLUMN has_canteen BOOLEAN DEFAULT TRUE;
        ALTER TABLE clubs ADD COLUMN has_kitchen BOOLEAN DEFAULT TRUE;
        ALTER TABLE clubs ADD COLUMN has_shop BOOLEAN DEFAULT TRUE;
        ALTER TABLE clubs ADD COLUMN has_rentals BOOLEAN DEFAULT TRUE;
        ALTER TABLE clubs ADD COLUMN has_coaching BOOLEAN DEFAULT TRUE;
        ALTER TABLE clubs ADD COLUMN has_click_and_collect BOOLEAN DEFAULT TRUE;
        ALTER TABLE clubs ADD COLUMN has_delivery BOOLEAN DEFAULT FALSE;
        ALTER TABLE clubs ADD COLUMN amenities JSONB DEFAULT '{"parking": true, "changing_rooms": true, "washrooms": true, "drinking_water": true, "accessibility": true, "equipment_rental": true}'::jsonb;
    END IF;
END $$;

-- ------------------------------------------------------------------
-- 2. CLUB SPORTS TABLE (REPEATABLE SPORT SECTIONS WITH MIN 3 IMAGES)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS club_sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    sport_name VARCHAR(100) NOT NULL,
    custom_sport_name VARCHAR(100),
    description TEXT,
    indoor_outdoor VARCHAR(50) DEFAULT 'MIXED',
    amenities JSONB DEFAULT '[]'::jsonb,
    images JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_club_sports_club ON club_sports(club_id);

-- ------------------------------------------------------------------
-- 3. EXTEND COURTS TABLE WITH DIMENSIONS, STATUS, & IMAGES
-- ------------------------------------------------------------------
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='courts' AND column_name='surface_type'
    ) THEN
        ALTER TABLE courts ADD COLUMN length NUMERIC(8,2) DEFAULT 20.00;
        ALTER TABLE courts ADD COLUMN width NUMERIC(8,2) DEFAULT 10.00;
        ALTER TABLE courts ADD COLUMN dimension_unit VARCHAR(20) DEFAULT 'meters';
        ALTER TABLE courts ADD COLUMN surface_type VARCHAR(100) DEFAULT 'Acrylic Hard Court';
        ALTER TABLE courts ADD COLUMN indoor_outdoor VARCHAR(50) DEFAULT 'INDOOR';
        ALTER TABLE courts ADD COLUMN status VARCHAR(50) DEFAULT 'ACTIVE'; -- ACTIVE, MAINTENANCE, ARCHIVED
        ALTER TABLE courts ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE courts ADD COLUMN sport_id UUID REFERENCES club_sports(id) ON DELETE SET NULL;
        ALTER TABLE courts ADD COLUMN open_time TIME DEFAULT NULL;
        ALTER TABLE courts ADD COLUMN close_time TIME DEFAULT NULL;
    END IF;
END $$;

-- ------------------------------------------------------------------
-- 4. EXPENSES TABLE (OPERATING EXPENSES & LIABILITIES)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_period VARCHAR(50) DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PAID', -- PAID, UNPAID
    payment_date DATE DEFAULT NULL,
    payment_method VARCHAR(50) DEFAULT 'UPI',
    payee_vendor VARCHAR(255) DEFAULT NULL,
    receipt_url TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    is_operating BOOLEAN DEFAULT TRUE, -- false for financing loan principal repayments
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_club ON expenses(club_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(club_id, status);

-- ------------------------------------------------------------------
-- 5. SEED INITIAL EXPENSES AND SPORTS FOR SKYLINE SPORTS
-- ------------------------------------------------------------------
DO $$ 
DECLARE
    v_club_id UUID;
    v_padel_id UUID;
    v_tennis_id UUID;
    v_badminton_id UUID;
BEGIN
    SELECT id INTO v_club_id FROM clubs LIMIT 1;
    IF v_club_id IS NOT NULL THEN
        -- Seed sports if not already present
        IF NOT EXISTS (SELECT 1 FROM club_sports WHERE club_id = v_club_id) THEN
            INSERT INTO club_sports (club_id, sport_name, description, indoor_outdoor, images)
            VALUES (
                v_club_id,
                'Padel',
                'State of the art panoramic glass padel courts with tournament-grade LED lighting.',
                'INDOOR',
                '["https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=800&q=80"]'::jsonb
            ) RETURNING id INTO v_padel_id;

            INSERT INTO club_sports (club_id, sport_name, description, indoor_outdoor, images)
            VALUES (
                v_club_id,
                'Badminton',
                'BWF approved synthetic mat courts with anti-glare overhead lighting.',
                'INDOOR',
                '["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1521537634581-0dced2fed2a8?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"]'::jsonb
            ) RETURNING id INTO v_badminton_id;

            INSERT INTO club_sports (club_id, sport_name, description, indoor_outdoor, images)
            VALUES (
                v_club_id,
                'Tennis',
                'US Open style hard courts with high impact absorption.',
                'OUTDOOR',
                '["https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"]'::jsonb
            ) RETURNING id INTO v_tennis_id;
        END IF;

        -- Seed initial operating expenses for current month
        IF NOT EXISTS (SELECT 1 FROM expenses WHERE club_id = v_club_id) THEN
            INSERT INTO expenses (club_id, category, description, amount, expense_date, service_period, status, payment_date, payment_method, payee_vendor, notes)
            VALUES 
                (v_club_id, 'ELECTRICITY', 'Court high-mast & indoor LED electricity bill', 12450.00, CURRENT_DATE - INTERVAL '10 days', 'October 2026', 'PAID', CURRENT_DATE - INTERVAL '9 days', 'UPI', 'Maharashtra State Electricity Board', 'Paid on time online'),
                (v_club_id, 'WATER', 'Facility drinking water & showers supply', 2100.00, CURRENT_DATE - INTERVAL '8 days', 'October 2026', 'PAID', CURRENT_DATE - INTERVAL '8 days', 'UPI', 'Municipal Water Dept', 'Monthly utility invoice'),
                (v_club_id, 'MAINTENANCE', 'Padel glass wall buffering & net tensioning', 4800.00, CURRENT_DATE - INTERVAL '5 days', 'October 2026', 'PAID', CURRENT_DATE - INTERVAL '5 days', 'CARD', 'Pro Court Tech Works', 'Quarterly court inspection service'),
                (v_club_id, 'SALARIES', 'Front desk & maintenance crew wages', 18500.00, CURRENT_DATE - INTERVAL '4 days', 'September 2026', 'PAID', CURRENT_DATE - INTERVAL '4 days', 'UPI', 'Staff Payroll Account', 'Disbursed directly via NEFT'),
                (v_club_id, 'CLEANING', 'Court sanitization & shower deep cleaning supplies', 1850.00, CURRENT_DATE - INTERVAL '2 days', 'October 2026', 'PAID', CURRENT_DATE - INTERVAL '2 days', 'CASH', 'CleanPro Hygiene Solutions', 'Receipt verified'),
                (v_club_id, 'INTERNET_SOFTWARE', 'Broadband fiber & POS cloud billing license', 1499.00, CURRENT_DATE - INTERVAL '1 day', 'October 2026', 'PAID', CURRENT_DATE - INTERVAL '1 day', 'UPI', 'Airtel Enterprise Fiber', 'Auto-renewed'),
                (v_club_id, 'MAINTENANCE', 'Turf granule replenishment and leveling', 3500.00, CURRENT_DATE, 'October 2026', 'UNPAID', NULL, NULL, 'Premier Turf Systems', 'Payment due by 15th October');
        END IF;
    END IF;
END $$;
