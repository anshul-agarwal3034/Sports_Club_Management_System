const { pool, query } = require('../../shared/database/db');

class ClubsRepository {
  /**
   * Transactional Club Registration
   */
  async createClubWithDetails(clubData, ownerData, courtsData, plansData, pricingData) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert Club Record
      const clubRes = await client.query(
        `INSERT INTO clubs (name, address, city, gst_number, pan_number, is_verified, inspection_status)
         VALUES ($1, $2, $3, $4, $5, FALSE, 'PENDING')
         RETURNING id, name, address, city, gst_number, pan_number, is_verified, inspection_status, base_commission_pct, created_at`,
        [
          clubData.name,
          clubData.address,
          clubData.city,
          clubData.gstNumber || null,
          clubData.panNumber || null,
        ]
      );
      const newClub = clubRes.rows[0];

      // 2. Link existing owner or insert new owner record
      let newOwner;
      if (ownerData.existingUserId) {
        const ownerRes = await client.query(
          `UPDATE users 
           SET club_id = $1, role = 'CLUB_OWNER'
           WHERE id = $2
           RETURNING id, club_id, role, full_name, email, phone, created_at`,
          [newClub.id, ownerData.existingUserId]
        );
        newOwner = ownerRes.rows[0];
      } else {
        const ownerRes = await client.query(
          `INSERT INTO users (club_id, role, full_name, email, password_hash, phone)
           VALUES ($1, 'CLUB_OWNER', $2, $3, $4, $5)
           RETURNING id, club_id, role, full_name, email, phone, created_at`,
          [
            newClub.id,
            ownerData.fullName,
            ownerData.email,
            ownerData.passwordHash,
            ownerData.phone,
          ]
        );
        newOwner = ownerRes.rows[0];
      }

      // 3. Insert Courts
      const insertedCourts = [];
      for (const court of courtsData) {
        const cRes = await client.query(
          `INSERT INTO courts (club_id, name, sport_type, base_price_per_hour, max_capacity)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, sport_type, base_price_per_hour, max_capacity`,
          [newClub.id, court.name, court.sportType, court.basePricePerHour, court.maxCapacity || 4]
        );
        insertedCourts.push(cRes.rows[0]);
      }

      // 4. Insert Membership Plans (Gold, Silver, Junior)
      const insertedPlans = [];
      for (const plan of plansData) {
        const pRes = await client.query(
          `INSERT INTO membership_plans (
            club_id, tier, price, duration_months, court_discount_pct, rental_discount_pct, 
            shop_discount_pct, food_discount_pct, allows_pay_later, free_coaching_sessions_per_month
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, tier, price, duration_months, court_discount_pct, rental_discount_pct, shop_discount_pct, allows_pay_later`,
          [
            newClub.id,
            plan.tier,
            plan.price,
            plan.durationMonths || 3,
            plan.courtDiscountPct,
            plan.rentalDiscountPct,
            plan.shopDiscountPct,
            plan.foodDiscountPct || 0,
            plan.allowsPayLater || false,
            plan.freeCoachingSessionsPerMonth || 0,
          ]
        );
        insertedPlans.push(pRes.rows[0]);
      }

      // 5. Insert Dynamic Pricing Rules
      const insertedPricing = [];
      for (const rule of pricingData) {
        const prRes = await client.query(
          `INSERT INTO dynamic_pricing_rules (
            club_id, sport_type, is_enabled, strategy, peak_start_hour, peak_end_hour, 
            peak_multiplier, price_floor, price_ceiling, last_minute_discount_pct
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, sport_type, is_enabled, strategy, peak_start_hour, peak_end_hour, peak_multiplier, price_floor, price_ceiling`,
          [
            newClub.id,
            rule.sportType,
            rule.isEnabled !== false,
            rule.strategy || 'BALANCED',
            rule.peakStartHour || 18,
            rule.peakEndHour || 22,
            rule.peakMultiplier || 1.25,
            rule.priceFloor,
            rule.priceCeiling,
            rule.lastMinuteDiscountPct || 15,
          ]
        );
        insertedPricing.push(prRes.rows[0]);
      }

      await client.query('COMMIT');

      return {
        club: newClub,
        owner: newOwner,
        courts: insertedCourts,
        membershipPlans: insertedPlans,
        dynamicPricing: insertedPricing,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Find Club By ID or Slug with Full Details
   */
  async findClubById(identifier) {
    if (!identifier) return null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let clubRes;

    try {
      if (isUuid) {
        clubRes = await query(`SELECT * FROM clubs WHERE id = $1`, [identifier]);
      } else {
        // Look up by exact name match or slug-like pattern
        const searchPattern = `%${identifier.toLowerCase().replace(/[^a-z0-9]+/g, '%')}%`;
        clubRes = await query(
          `SELECT * FROM clubs WHERE id::text = $1 OR LOWER(name) LIKE $2 ORDER BY is_verified DESC LIMIT 1`,
          [identifier, searchPattern]
        );
      }
    } catch {
      return null;
    }

    if (!clubRes || clubRes.rows.length === 0) return null;

    const club = clubRes.rows[0];
    const clubId = club.id;

    const courtsRes = await query(`SELECT * FROM courts WHERE club_id = $1`, [clubId]);
    const plansRes = await query(`SELECT * FROM membership_plans WHERE club_id = $1`, [clubId]);
    const pricingRes = await query(`SELECT * FROM dynamic_pricing_rules WHERE club_id = $1`, [clubId]);

    return {
      ...club,
      courts: courtsRes.rows,
      membershipPlans: plansRes.rows,
      dynamicPricingRules: pricingRes.rows,
    };
  }

  /**
   * List all clubs with filter support
   */
  async listClubs(city = null, verifiedOnly = false) {
    let sql = `SELECT id, name, address, city, is_verified, inspection_status, created_at FROM clubs WHERE 1=1`;
    const params = [];

    if (city) {
      params.push(`%${city}%`);
      sql += ` AND LOWER(city) LIKE LOWER($${params.length})`;
    }

    if (verifiedOnly) {
      sql += ` AND is_verified = TRUE`;
    }

    sql += ` ORDER BY is_verified DESC, name ASC`;

    const res = await query(sql, params);
    return res.rows;
  }

  /**
   * Platform Admin Query: Find all pending / unverified clubs awaiting inspection
   */
  async findPendingClubs() {
    const res = await query(
      `SELECT c.id, c.name, c.address, c.city, c.gst_number, c.pan_number, c.is_verified, c.inspection_status, c.created_at,
              u.full_name as owner_name, u.email as owner_email, u.phone as owner_phone
       FROM clubs c
       LEFT JOIN users u ON u.club_id = c.id AND u.role = 'CLUB_OWNER'
       WHERE c.inspection_status = 'PENDING' OR c.is_verified = FALSE
       ORDER BY c.created_at ASC`
    );
    return res.rows;
  }

  /**
   * Update Platform Admin Verification
   */
  async updateVerification(clubId, isVerified, inspectionStatus, baseCommissionPct) {
    const res = await query(
      `UPDATE clubs 
       SET is_verified = $1, 
           inspection_status = $2,
           setup_status = CASE WHEN $1 = TRUE THEN 'APPROVED' ELSE setup_status END,
           base_commission_pct = COALESCE($3, base_commission_pct)
       WHERE id = $4
       RETURNING id, name, is_verified, inspection_status, setup_status, base_commission_pct`,
      [isVerified, inspectionStatus, baseCommissionPct || null, clubId]
    );
    return res.rows[0];
  }

  /**
   * Save Club Setup Draft Progress
   */
  async saveSetupDraft(clubId, step, draftData) {
    const res = await query(
      `UPDATE clubs 
       SET setup_step = $1,
           draft_data = $2,
           setup_status = CASE WHEN setup_status = 'APPROVED' THEN setup_status ELSE 'INCOMPLETE' END
       WHERE id = $3
       RETURNING id, setup_step, draft_data, setup_status`,
      [step, JSON.stringify(draftData), clubId]
    );
    return res.rows[0];
  }

  /**
   * Get Club Setup Status & Draft
   */
  async getSetupStatus(clubId) {
    const res = await query(
      `SELECT id, name, setup_status, setup_step, draft_data, is_verified, inspection_status, rejection_reason
       FROM clubs WHERE id = $1`,
      [clubId]
    );
    return res.rows[0];
  }

  /**
   * Submit Setup Application (Transitions to PENDING_REVIEW)
   */
  async submitSetupApplication(clubId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Update Club details, capabilities & business details
      const clubUpdateRes = await client.query(
        `UPDATE clubs 
         SET name = COALESCE($1, name),
             address = COALESCE($2, address),
             city = COALESCE($3, city),
             state = COALESCE($4, state),
             postal_code = COALESCE($5, postal_code),
             phone = COALESCE($6, phone),
             email = COALESCE($7, email),
             description = COALESCE($8, description),
             total_area = COALESCE($9, total_area),
             total_area_unit = COALESCE($10, total_area_unit),
             open_time = COALESCE($11, open_time),
             close_time = COALESCE($12, close_time),
             weekly_closures = COALESCE($13, weekly_closures),
             timezone = COALESCE($14, timezone),
             legal_business_name = COALESCE($15, legal_business_name),
             business_type = COALESCE($16, business_type),
             business_reg_number = COALESCE($17, business_reg_number),
             gst_registered = COALESCE($18, gst_registered),
             gst_number = $19,
             pan_number = $20,
             business_doc_url = COALESCE($21, business_doc_url),
             business_doc_name = COALESCE($22, business_doc_name),
             has_canteen = COALESCE($23, has_canteen),
             has_kitchen = COALESCE($24, has_kitchen),
             has_shop = COALESCE($25, has_shop),
             has_rentals = COALESCE($26, has_rentals),
             has_coaching = COALESCE($27, has_coaching),
             has_click_and_collect = COALESCE($28, has_click_and_collect),
             has_delivery = COALESCE($29, has_delivery),
             amenities = COALESCE($30, amenities),
             setup_status = 'PENDING_REVIEW',
             setup_step = 5,
             draft_data = $31
         WHERE id = $32
         RETURNING *`,
        [
          data.clubName,
          data.address,
          data.city,
          data.state,
          data.postalCode,
          data.phone,
          data.email,
          data.description,
          Number(data.totalArea) || 25000.00,
          data.totalAreaUnit || 'sq ft',
          data.openTime || '06:00',
          data.closeTime || '23:00',
          JSON.stringify(Array.isArray(data.weeklyClosures) ? data.weeklyClosures : [data.weeklyClosures || 'None']),
          data.timezone || 'Asia/Kolkata',
          data.legalBusinessName,
          data.businessType,
          data.businessRegNumber || null,
          Boolean(data.gstRegistered),
          data.gstRegistered ? (data.gstNumber || null) : null,
          data.panNumber || null,
          data.businessDocUrl || null,
          data.businessDocName || null,
          Boolean(data.hasCanteen),
          Boolean(data.hasKitchen),
          Boolean(data.hasShop),
          Boolean(data.hasRentals),
          Boolean(data.hasCoaching),
          Boolean(data.hasClickAndCollect),
          Boolean(data.hasDelivery),
          JSON.stringify(data.amenities || {}),
          JSON.stringify(data),
          clubId
        ]
      );

      // 2. Save / update sports and courts if provided
      if (Array.isArray(data.sports) && data.sports.length > 0) {
        // Archive prior courts and remove prior sports for clean idempotent setup
        await client.query(`UPDATE courts SET status = 'ARCHIVED' WHERE club_id = $1`, [clubId]);
        await client.query(`DELETE FROM club_sports WHERE club_id = $1`, [clubId]);

        for (const sport of data.sports) {
          const sportRes = await client.query(
            `INSERT INTO club_sports (club_id, sport_name, custom_sport_name, description, indoor_outdoor, amenities, images)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
              clubId,
              sport.sportName,
              sport.customSportName || null,
              sport.description || null,
              sport.indoorOutdoor || 'MIXED',
              JSON.stringify(sport.amenities || []),
              JSON.stringify(sport.images || [])
            ]
          );
          const sportId = sportRes.rows[0].id;

          if (Array.isArray(sport.courts) && sport.courts.length > 0) {
            for (const court of sport.courts) {
              await client.query(
                `INSERT INTO courts (club_id, name, sport_type, base_price_per_hour, max_capacity, length, width, dimension_unit, surface_type, indoor_outdoor, status, images, sport_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE', $11, $12)`,
                [
                  clubId,
                  court.name || court.courtName || 'Court 1',
                  sport.sportName,
                  court.basePricePerHour || court.hourlyRate || court.price || 600,
                  court.maxCapacity || court.capacity || 4,
                  court.length || 20,
                  court.width || 10,
                  court.dimensionUnit || 'meters',
                  court.surfaceType || 'Acrylic Hard Court',
                  court.indoorOutdoor || sport.indoorOutdoor || 'INDOOR',
                  JSON.stringify(court.images || []),
                  sportId
                ]
              );
            }
          }
        }
      }

      await client.query('COMMIT');
      return clubUpdateRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get Full Club Settings
   */
  async getClubSettings(clubId, maskSensitive = false) {
    const clubRes = await query(`SELECT * FROM clubs WHERE id = $1`, [clubId]);
    if (clubRes.rows.length === 0) return null;
    const club = clubRes.rows[0];

    const sportsRes = await query(`SELECT * FROM club_sports WHERE club_id = $1 AND is_active = TRUE ORDER BY created_at ASC`, [clubId]);
    const courtsRes = await query(`SELECT * FROM courts WHERE club_id = $1 AND status != 'ARCHIVED' ORDER BY name ASC`, [clubId]);
    const plansRes = await query(`SELECT * FROM membership_plans WHERE club_id = $1 ORDER BY price DESC`, [clubId]);

    // Mask sensitive documents/identifiers if needed
    if (maskSensitive && club.pan_number) {
      club.pan_number = club.pan_number.slice(0, 2) + 'XXXXX' + club.pan_number.slice(-2);
    }

    return {
      club,
      sports: sportsRes.rows,
      courts: courtsRes.rows,
      membershipPlans: plansRes.rows,
    };
  }

  /**
   * Update Club Settings (Enforcing Tenant Isolation and Platform Commission Immobility)
   */
  async updateClubSettings(clubId, settings) {
    const {
      name,
      phone,
      email,
      description,
      address,
      city,
      state,
      postalCode,
      totalArea,
      totalAreaUnit,
      openTime,
      closeTime,
      weeklyClosures,
      timezone,
      hasCanteen,
      hasKitchen,
      hasShop,
      hasRentals,
      hasCoaching,
      hasClickAndCollect,
      hasDelivery,
      amenities,
      legalBusinessName,
      businessType,
      businessRegNumber,
      gstRegistered,
      gstNumber,
      panNumber,
    } = settings;

    // Check if legal identity changed to re-trigger inspection review
    const currentRes = await query(`SELECT legal_business_name, gst_number, pan_number, is_verified FROM clubs WHERE id = $1`, [clubId]);
    const current = currentRes.rows[0];
    let retriggerVerification = false;
    if (current && current.is_verified) {
      if (
        (legalBusinessName && legalBusinessName !== current.legal_business_name) ||
        (gstNumber && gstNumber !== current.gst_number) ||
        (panNumber && panNumber !== current.pan_number)
      ) {
        retriggerVerification = true;
      }
    }

    const res = await query(
      `UPDATE clubs
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           email = COALESCE($3, email),
           description = COALESCE($4, description),
           address = COALESCE($5, address),
           city = COALESCE($6, city),
           state = COALESCE($7, state),
           postal_code = COALESCE($8, postal_code),
           total_area = COALESCE($9, total_area),
           total_area_unit = COALESCE($10, total_area_unit),
           open_time = COALESCE($11, open_time),
           close_time = COALESCE($12, close_time),
           weekly_closures = COALESCE($13, weekly_closures),
           timezone = COALESCE($14, timezone),
           has_canteen = COALESCE($15, has_canteen),
           has_kitchen = COALESCE($16, has_kitchen),
           has_shop = COALESCE($17, has_shop),
           has_rentals = COALESCE($18, has_rentals),
           has_coaching = COALESCE($19, has_coaching),
           has_click_and_collect = COALESCE($20, has_click_and_collect),
           has_delivery = COALESCE($21, has_delivery),
           amenities = COALESCE($22, amenities),
           legal_business_name = COALESCE($23, legal_business_name),
           business_type = COALESCE($24, business_type),
           business_reg_number = COALESCE($25, business_reg_number),
           gst_registered = COALESCE($26, gst_registered),
           gst_number = COALESCE($27, gst_number),
           pan_number = COALESCE($28, pan_number),
           inspection_status = CASE WHEN $29 = TRUE THEN 'NEEDS_REVISION' ELSE inspection_status END
       WHERE id = $30
       RETURNING *`,
      [
        name,
        phone,
        email,
        description,
        address,
        city,
        state,
        postalCode,
        totalArea,
        totalAreaUnit,
        openTime,
        closeTime,
        weeklyClosures ? JSON.stringify(weeklyClosures) : null,
        timezone,
        hasCanteen,
        hasKitchen,
        hasShop,
        hasRentals,
        hasCoaching,
        hasClickAndCollect,
        hasDelivery,
        amenities ? JSON.stringify(amenities) : null,
        legalBusinessName,
        businessType,
        businessRegNumber,
        gstRegistered,
        gstNumber,
        panNumber,
        retriggerVerification,
        clubId
      ]
    );

    return res.rows[0];
  }

  /**
   * Sports Management
   */
  async getClubSports(clubId) {
    const res = await query(
      `SELECT * FROM club_sports WHERE club_id = $1 AND is_active = TRUE ORDER BY created_at ASC`,
      [clubId]
    );
    return res.rows;
  }

  async addClubSport(clubId, sportData) {
    const res = await query(
      `INSERT INTO club_sports (club_id, sport_name, custom_sport_name, description, indoor_outdoor, amenities, images)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        clubId,
        sportData.sportName,
        sportData.customSportName || null,
        sportData.description || null,
        sportData.indoorOutdoor || 'MIXED',
        JSON.stringify(sportData.amenities || []),
        JSON.stringify(sportData.images || [])
      ]
    );
    return res.rows[0];
  }

  async updateClubSport(clubId, sportId, sportData) {
    const res = await query(
      `UPDATE club_sports
       SET sport_name = COALESCE($1, sport_name),
           custom_sport_name = COALESCE($2, custom_sport_name),
           description = COALESCE($3, description),
           indoor_outdoor = COALESCE($4, indoor_outdoor),
           amenities = COALESCE($5, amenities),
           images = COALESCE($6, images)
       WHERE id = $7 AND club_id = $8
       RETURNING *`,
      [
        sportData.sportName,
        sportData.customSportName,
        sportData.description,
        sportData.indoorOutdoor,
        sportData.amenities ? JSON.stringify(sportData.amenities) : null,
        sportData.images ? JSON.stringify(sportData.images) : null,
        sportId,
        clubId
      ]
    );
    return res.rows[0];
  }

  async archiveClubSport(clubId, sportId) {
    const res = await query(
      `UPDATE club_sports SET is_active = FALSE WHERE id = $1 AND club_id = $2 RETURNING id`,
      [sportId, clubId]
    );
    return res.rows[0];
  }

  /**
   * Court Management with Future Bookings Check
   */
  async getFutureBookingsCount(courtId) {
    const res = await query(
      `SELECT COUNT(*)::int as count 
       FROM bookings 
       WHERE court_id = $1 
         AND status = 'CONFIRMED' 
         AND upper(booking_time_range) > NOW()`,
      [courtId]
    );
    return res.rows[0]?.count || 0;
  }

  async addCourt(clubId, courtData) {
    const res = await query(
      `INSERT INTO courts (
        club_id, name, sport_type, base_price_per_hour, max_capacity,
        length, width, dimension_unit, surface_type, indoor_outdoor, status, images, sport_id, open_time, close_time
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        clubId,
        courtData.name,
        courtData.sportType,
        courtData.basePricePerHour || 600,
        courtData.maxCapacity || 4,
        courtData.length || 20,
        courtData.width || 10,
        courtData.dimensionUnit || 'meters',
        courtData.surfaceType || 'Acrylic Hard Court',
        courtData.indoorOutdoor || 'INDOOR',
        courtData.status || 'ACTIVE',
        JSON.stringify(courtData.images || []),
        courtData.sportId || null,
        courtData.openTime || null,
        courtData.closeTime || null
      ]
    );
    return res.rows[0];
  }

  async updateCourt(clubId, courtId, courtData) {
    const res = await query(
      `UPDATE courts
       SET name = COALESCE($1, name),
           sport_type = COALESCE($2, sport_type),
           base_price_per_hour = COALESCE($3, base_price_per_hour),
           max_capacity = COALESCE($4, max_capacity),
           length = COALESCE($5, length),
           width = COALESCE($6, width),
           dimension_unit = COALESCE($7, dimension_unit),
           surface_type = COALESCE($8, surface_type),
           indoor_outdoor = COALESCE($9, indoor_outdoor),
           status = COALESCE($10, status),
           images = COALESCE($11, images),
           open_time = $12,
           close_time = $13
       WHERE id = $14 AND club_id = $15
       RETURNING *`,
      [
        courtData.name,
        courtData.sportType,
        courtData.basePricePerHour,
        courtData.maxCapacity,
        courtData.length,
        courtData.width,
        courtData.dimensionUnit,
        courtData.surfaceType,
        courtData.indoorOutdoor,
        courtData.status,
        courtData.images ? JSON.stringify(courtData.images) : null,
        courtData.openTime || null,
        courtData.closeTime || null,
        courtId,
        clubId
      ]
    );
    return res.rows[0];
  }

  async archiveCourt(clubId, courtId) {
    const res = await query(
      `UPDATE courts SET status = 'ARCHIVED' WHERE id = $1 AND club_id = $2 RETURNING id`,
      [courtId, clubId]
    );
    return res.rows[0];
  }

  async getClubCourts(clubId) {
    const res = await query(
      `SELECT * FROM courts WHERE club_id = $1 AND status != 'ARCHIVED' ORDER BY name ASC`,
      [clubId]
    );
    return res.rows;
  }

  async getClubUsers(clubId) {
    const res = await query(
      `SELECT id, club_id, role, full_name, email, phone, points_balance, current_pay_later_balance, created_at
       FROM users
       WHERE club_id = $1 AND role IN ('MEMBER', 'NON_MEMBER')
       ORDER BY created_at DESC`,
      [clubId]
    );
    return res.rows;
  }

  async getClubEmployees(clubId) {
    const res = await query(
      `SELECT id, club_id, role, full_name, email, phone, status, created_at
       FROM users
       WHERE club_id = $1 AND role IN ('STAFF', 'COACH', 'KITCHEN_MANAGER')
       ORDER BY CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END, full_name ASC`,
      [clubId]
    );
    return res.rows;
  }

  async updateEmployeeStatus(clubId, employeeId, status) {
    const res = await query(
      `UPDATE users
       SET status = $1
       WHERE id = $2 AND club_id = $3 AND role IN ('STAFF', 'COACH', 'KITCHEN_MANAGER')
       RETURNING id, club_id, role, full_name, email, phone, status`,
      [status, employeeId, clubId]
    );
    return res.rows[0] || null;
  }

  async getClubLeads(clubId) {
    const res = await query(
      `SELECT * FROM leads WHERE club_id = $1 ORDER BY created_at DESC`,
      [clubId]
    );
    return res.rows;
  }

  async createClubLead(clubId, data) {
    const res = await query(
      `INSERT INTO leads (club_id, full_name, phone, email, message, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        clubId,
        data.fullName || data.customer_name || 'Enquiry',
        data.phone || '',
        data.email || null,
        data.message || data.notes || '',
        data.status || 'NEW',
      ]
    );
    return res.rows[0];
  }

  async updateClubLead(clubId, leadId, status) {
    const res = await query(
      `UPDATE leads SET status = $1 WHERE id = $2 AND club_id = $3 RETURNING *`,
      [status, leadId, clubId]
    );
    return res.rows[0];
  }

  async getClubTransactions(clubId) {
    const res = await query(
      `SELECT t.*, u.full_name as user_name
       FROM transactions t
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.club_id = $1
       ORDER BY t.created_at DESC`,
      [clubId]
    );
    return res.rows;
  }

  async getClubComplaints(clubId) {
    const res = await query(
      `SELECT * FROM club_complaints WHERE club_id = $1 ORDER BY created_at DESC`,
      [clubId]
    );
    return res.rows;
  }

  async createClubComplaint(clubId, data) {
    const res = await query(
      `INSERT INTO club_complaints (club_id, member_name, issue, status, date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       RETURNING *`,
      [
        clubId,
        data.memberName || data.member_name || 'Member',
        data.issue || '',
        data.status || 'OPEN',
      ]
    );
    return res.rows[0];
  }

  async getClubEvents(clubId) {
    const res = await query(
      `SELECT * FROM club_events WHERE club_id = $1 ORDER BY date ASC`,
      [clubId]
    );
    return res.rows;
  }

  async createClubEvent(clubId, data) {
    const res = await query(
      `INSERT INTO club_events (club_id, title, date, sport, entry_fee, is_inter_club, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        clubId,
        data.title,
        data.date || new Date().toISOString().slice(0, 10),
        data.sport || 'padel',
        data.entry_fee || data.entryFee || 0,
        data.is_inter_club !== undefined ? data.is_inter_club : true,
        data.status || 'UPCOMING',
      ]
    );
    return res.rows[0];
  }
}

module.exports = new ClubsRepository();
