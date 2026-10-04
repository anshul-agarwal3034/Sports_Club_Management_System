const { pool } = require('../../shared/database/db');

class InventoryRepository {
  /**
   * Create a new product record
   */
  async createProduct({ clubId, name, category, price, stockQuantity, isRental, lowStockThreshold }) {
    const query = `
      INSERT INTO products (
        club_id, name, category, price, stock_quantity, is_rental, low_stock_threshold
      )
      VALUES ($1, $2, UPPER($3), $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [clubId, name, category, price, stockQuantity, isRental, lowStockThreshold];
    const { rows } = await pool.query(query, values);
    return this.mapProductRow(rows[0]);
  }

  /**
   * Find product by ID
   */
  async findById(productId) {
    const query = `SELECT * FROM products WHERE id = $1;`;
    const { rows } = await pool.query(query, [productId]);
    return rows[0] ? this.mapProductRow(rows[0]) : null;
  }

  /**
   * Find product by ID with FOR UPDATE lock for transactions
   */
  async findByIdForUpdate(client, productId) {
    const query = `SELECT * FROM products WHERE id = $1 FOR UPDATE;`;
    const { rows } = await client.query(query, [productId]);
    return rows[0] ? this.mapProductRow(rows[0]) : null;
  }

  /**
   * List all products for a club
   */
  async listByClubId(clubId, category = null) {
    let query = `
      SELECT * FROM products 
      WHERE club_id = $1
    `;
    const values = [clubId];

    if (category && category !== 'all') {
      query += ` AND (LOWER(category) LIKE $2 OR UPPER(category) LIKE $2)`;
      values.push(`%${category}%`);
    }

    query += ` ORDER BY name ASC;`;
    const { rows } = await pool.query(query, values);
    return rows.map((r) => this.mapProductRow(r));
  }

  /**
   * Restock quantity
   */
  async addStock(productId, quantityToAdd) {
    const query = `
      UPDATE products
      SET stock_quantity = stock_quantity + $2
      WHERE id = $1
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [productId, quantityToAdd]);
    return rows[0] ? this.mapProductRow(rows[0]) : null;
  }

  /**
   * Update product details
   */
  async updateProduct(productId, updates) {
    const { name, category, price, stockQuantity, isRental, lowStockThreshold } = updates;
    const query = `
      UPDATE products
      SET 
        name = COALESCE($2, name),
        category = COALESCE(UPPER($3), category),
        price = COALESCE($4, price),
        stock_quantity = COALESCE($5, stock_quantity),
        is_rental = COALESCE($6, is_rental),
        low_stock_threshold = COALESCE($7, low_stock_threshold)
      WHERE id = $1
      RETURNING *;
    `;
    const values = [productId, name, category, price, stockQuantity, isRental, lowStockThreshold];
    const { rows } = await pool.query(query, values);
    return rows[0] ? this.mapProductRow(rows[0]) : null;
  }

  /**
   * Delete product
   */
  async deleteProduct(productId) {
    const query = `DELETE FROM products WHERE id = $1 RETURNING id;`;
    const { rows } = await pool.query(query, [productId]);
    return rows.length > 0;
  }

  /**
   * Map database row to standard DTO matching frontend interface
   */
  mapProductRow(row) {
    return {
      id: row.id,
      club_id: row.club_id,
      name: row.name,
      category: row.category ? row.category.toLowerCase() : 'gear',
      price: parseFloat(row.price),
      stock: row.stock_quantity,
      stock_quantity: row.stock_quantity,
      is_rental: row.is_rental || false,
      low_stock_threshold: row.low_stock_threshold || 5,
      created_at: row.created_at,
    };
  }
}

module.exports = new InventoryRepository();
