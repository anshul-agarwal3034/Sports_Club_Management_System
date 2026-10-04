const { query } = require('../../shared/database/db');

class ExpensesRepository {
  async getExpenses(clubId, filters = {}) {
    let sql = `
      SELECT e.*, u.full_name as created_by_name
      FROM expenses e
      LEFT JOIN users u ON u.id = e.created_by
      WHERE e.club_id = $1
    `;
    const params = [clubId];

    if (filters.status) {
      params.push(filters.status);
      sql += ` AND e.status = $${params.length}`;
    }

    if (filters.category) {
      params.push(filters.category);
      sql += ` AND e.category = $${params.length}`;
    }

    if (filters.startDate) {
      params.push(filters.startDate);
      sql += ` AND e.expense_date >= $${params.length}`;
    }

    if (filters.endDate) {
      params.push(filters.endDate);
      sql += ` AND e.expense_date <= $${params.length}`;
    }

    sql += ` ORDER BY e.expense_date DESC, e.created_at DESC`;

    const res = await query(sql, params);
    return res.rows;
  }

  async getExpenseById(id, clubId) {
    const res = await query(
      `SELECT * FROM expenses WHERE id = $1 AND club_id = $2`,
      [id, clubId]
    );
    return res.rows[0];
  }

  async createExpense(clubId, data, createdBy) {
    const isOperating = data.category === 'LOAN_PRINCIPAL' ? false : (data.isOperating !== false);
    const res = await query(
      `INSERT INTO expenses (
        club_id, category, description, amount, expense_date, service_period,
        status, payment_date, payment_method, payee_vendor, receipt_url, notes,
        is_operating, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        clubId,
        data.category,
        data.description,
        data.amount,
        data.expenseDate || new Date().toISOString().split('T')[0],
        data.servicePeriod || null,
        data.status || 'PAID',
        data.status === 'PAID' ? (data.paymentDate || new Date().toISOString().split('T')[0]) : null,
        data.paymentMethod || 'CASH',
        data.payeeVendor || null,
        data.receiptUrl || null,
        data.notes || null,
        isOperating,
        createdBy,
      ]
    );
    return res.rows[0];
  }

  async updateExpense(id, clubId, data) {
    const isOperating = data.category === 'LOAN_PRINCIPAL' ? false : (data.isOperating !== undefined ? data.isOperating : true);
    const res = await query(
      `UPDATE expenses
       SET category = COALESCE($1, category),
           description = COALESCE($2, description),
           amount = COALESCE($3, amount),
           expense_date = COALESCE($4, expense_date),
           service_period = COALESCE($5, service_period),
           status = COALESCE($6, status),
           payment_date = CASE WHEN COALESCE($6, status) = 'PAID' THEN COALESCE($7, payment_date, CURRENT_DATE) ELSE NULL END,
           payment_method = COALESCE($8, payment_method),
           payee_vendor = COALESCE($9, payee_vendor),
           receipt_url = COALESCE($10, receipt_url),
           notes = COALESCE($11, notes),
           is_operating = $12,
           updated_at = NOW()
       WHERE id = $13 AND club_id = $14
       RETURNING *`,
      [
        data.category,
        data.description,
        data.amount,
        data.expenseDate,
        data.servicePeriod,
        data.status,
        data.paymentDate,
        data.paymentMethod,
        data.payeeVendor,
        data.receiptUrl,
        data.notes,
        isOperating,
        id,
        clubId,
      ]
    );
    return res.rows[0];
  }

  async deleteExpense(id, clubId) {
    const res = await query(
      `DELETE FROM expenses WHERE id = $1 AND club_id = $2 RETURNING id`,
      [id, clubId]
    );
    return res.rows[0];
  }

  /**
   * Check for duplicate salary expense for the same payee and service period
   */
  async findDuplicateSalary(clubId, payeeVendor, servicePeriod, excludeId = null) {
    let sql = `
      SELECT id, amount, expense_date, service_period, payee_vendor
      FROM expenses
      WHERE club_id = $1 
        AND category IN ('COACHING_SALARY', 'STAFF_SALARY')
        AND LOWER(TRIM(payee_vendor)) = LOWER(TRIM($2))
        AND LOWER(TRIM(service_period)) = LOWER(TRIM($3))
    `;
    const params = [clubId, payeeVendor, servicePeriod];
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id != $${params.length}`;
    }
    const res = await query(sql, params);
    return res.rows[0];
  }

  /**
   * Aggregates for Net Income and Financial Statements
   */
  async getFinancialOverview(clubId, startDate, endDate) {
    // 1. Earned Revenue & Platform Commission
    // Commission is 10% on courts, memberships, coaching, events; 0% on canteen/shop
    const revRes = await query(
      `SELECT 
        COALESCE(SUM(CASE WHEN income_source != 'REFUND' THEN gross_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN income_source IN ('COURT_BOOKING', 'MEMBERSHIP', 'COACHING', 'EVENT') THEN gross_amount * 0.10 ELSE 0 END), 0) as platform_commission,
        COALESCE(SUM(CASE WHEN income_source = 'COURT_BOOKING' THEN gross_amount ELSE 0 END), 0) as court_revenue,
        COALESCE(SUM(CASE WHEN income_source = 'MEMBERSHIP' THEN gross_amount ELSE 0 END), 0) as membership_revenue,
        COALESCE(SUM(CASE WHEN income_source = 'CANTEEN' THEN gross_amount ELSE 0 END), 0) as canteen_revenue,
        COALESCE(SUM(CASE WHEN income_source = 'COACHING' THEN gross_amount ELSE 0 END), 0) as coaching_revenue,
        COALESCE(SUM(CASE WHEN income_source = 'SHOP' THEN gross_amount ELSE 0 END), 0) as shop_revenue,
        COALESCE(SUM(CASE WHEN income_source = 'REFUND' THEN gross_amount ELSE 0 END), 0) as total_refunds
      FROM transactions
      WHERE club_id = $1
        AND ($2::DATE IS NULL OR created_at::DATE >= $2::DATE)
        AND ($3::DATE IS NULL OR created_at::DATE <= $3::DATE)`,
      [clubId, startDate || null, endDate || null]
    );

    // 2. Operating Expenses (Only PAID & is_operating = TRUE)
    const expRes = await query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_operating_expenses,
        COALESCE(SUM(CASE WHEN category IN ('COACHING_SALARY', 'STAFF_SALARY') THEN amount ELSE 0 END), 0) as salary_expenses,
        COALESCE(SUM(CASE WHEN category = 'UTILITIES' THEN amount ELSE 0 END), 0) as utilities_expenses,
        COALESCE(SUM(CASE WHEN category = 'RENT_LEASE' THEN amount ELSE 0 END), 0) as rent_expenses,
        COALESCE(SUM(CASE WHEN category = 'EQUIPMENT_MAINTENANCE' THEN amount ELSE 0 END), 0) as maintenance_expenses,
        COALESCE(SUM(CASE WHEN category = 'INVENTORY_PURCHASE' THEN amount ELSE 0 END), 0) as inventory_expenses
      FROM expenses
      WHERE club_id = $1 AND status = 'PAID' AND is_operating = TRUE
        AND ($2::DATE IS NULL OR expense_date >= $2::DATE)
        AND ($3::DATE IS NULL OR expense_date <= $3::DATE)`,
      [clubId, startDate || null, endDate || null]
    );

    // 3. Outstanding Liabilities / Unpaid Bills
    const liabRes = await query(
      `SELECT 
        COALESCE(SUM(amount), 0) as total_unpaid_bills,
        COUNT(id) as unpaid_count
      FROM expenses
      WHERE club_id = $1 AND status = 'UNPAID'`,
      [clubId]
    );

    const rev = revRes.rows[0];
    const exp = expRes.rows[0];
    const liab = liabRes.rows[0];

    const totalRevenue = parseFloat(rev.total_revenue) - parseFloat(rev.total_refunds);
    const platformCommission = parseFloat(rev.platform_commission);
    const operatingExpenses = parseFloat(exp.total_operating_expenses);
    const netIncome = totalRevenue - operatingExpenses - platformCommission;

    return {
      totalRevenue,
      platformCommission,
      operatingExpenses,
      netIncome,
      unpaidLiabilities: parseFloat(liab.total_unpaid_bills),
      unpaidBillsCount: parseInt(liab.unpaid_count, 10),
      breakdown: {
        courtRevenue: parseFloat(rev.court_revenue),
        membershipRevenue: parseFloat(rev.membership_revenue),
        canteenRevenue: parseFloat(rev.canteen_revenue),
        coachingRevenue: parseFloat(rev.coaching_revenue),
        shopRevenue: parseFloat(rev.shop_revenue),
        refunds: parseFloat(rev.total_refunds),
        salaries: parseFloat(exp.salary_expenses),
        utilities: parseFloat(exp.utilities_expenses),
        rent: parseFloat(exp.rent_expenses),
        maintenance: parseFloat(exp.maintenance_expenses),
        inventory: parseFloat(exp.inventory_expenses),
      },
    };
  }
}

module.exports = new ExpensesRepository();
