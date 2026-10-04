const inventoryRepository = require('./inventory.repository');

class InventoryService {
  /**
   * Create a new product for a club
   */
  async createProduct(clubId, dto) {
    const finalClubId = clubId || dto.clubId;
    if (!finalClubId) {
      const err = new Error('Club ID is required to create a product.');
      err.statusCode = 400;
      throw err;
    }

    return await inventoryRepository.createProduct({
      clubId: finalClubId,
      name: dto.name,
      category: dto.category,
      price: dto.price,
      stockQuantity: dto.stockQuantity ?? 0,
      isRental: dto.isRental ?? false,
      lowStockThreshold: dto.lowStockThreshold ?? 5,
    });
  }

  /**
   * List products by club
   */
  async getProductsByClub(clubId, category) {
    return await inventoryRepository.listByClubId(clubId, category);
  }

  /**
   * Get single product details
   */
  async getProductById(productId) {
    const product = await inventoryRepository.findById(productId);
    if (!product) {
      const err = new Error(`Product with ID '${productId}' not found.`);
      err.statusCode = 404;
      throw err;
    }
    return product;
  }

  /**
   * Restock product quantity
   */
  async restock(productId, quantityToAdd) {
    const existing = await inventoryRepository.findById(productId);
    if (!existing) {
      const err = new Error(`Product with ID '${productId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    return await inventoryRepository.addStock(productId, quantityToAdd);
  }

  /**
   * Update product details
   */
  async updateProduct(productId, updates) {
    const existing = await inventoryRepository.findById(productId);
    if (!existing) {
      const err = new Error(`Product with ID '${productId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    return await inventoryRepository.updateProduct(productId, updates);
  }

  /**
   * Delete product
   */
  async deleteProduct(productId) {
    const existing = await inventoryRepository.findById(productId);
    if (!existing) {
      const err = new Error(`Product with ID '${productId}' not found.`);
      err.statusCode = 404;
      throw err;
    }

    return await inventoryRepository.deleteProduct(productId);
  }
}

module.exports = new InventoryService();
