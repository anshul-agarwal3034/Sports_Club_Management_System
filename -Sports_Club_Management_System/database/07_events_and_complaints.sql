-- ==================================================================
-- 07: CLUB EVENTS & COMPLAINTS FOR REAL OPERATIONAL DATA
-- ==================================================================

CREATE TABLE IF NOT EXISTS club_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    sport VARCHAR(100) DEFAULT 'padel',
    entry_fee NUMERIC(10,2) DEFAULT 0.00,
    is_inter_club BOOLEAN DEFAULT FALSE,
    participants_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'UPCOMING',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS club_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    member_name VARCHAR(255) NOT NULL,
    issue TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN',
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
