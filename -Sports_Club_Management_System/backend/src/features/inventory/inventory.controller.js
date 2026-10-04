const inventoryService = require('./inventory.service');
const { validate, CreateProductSchema, UpdateProductSchema, RestockSchema } = require('./inventory.validator');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class InventoryController {
  async createProduct(req, res, next) {
    try {
      const validatedData = validate(CreateProductSchema, req.body);
      const clubId = req.user?.clubId || validatedData.clubId;
      const product = await inventoryService.createProduct(clubId, validatedData);
      return sendSuccess(res, product, 'Product created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getProducts(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user?.clubId || req.query.clubId;
      if (!clubId) {
        return sendError(res, 'Club ID is required to fetch products', 400);
      }
      const category = req.query.category || null;
      const products = await inventoryService.getProductsByClub(clubId, category);
      return sendSuccess(res, products, 'Products retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await inventoryService.getProductById(req.params.id);
      return sendSuccess(res, product, 'Product details retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async restock(req, res, next) {
    try {
      const { quantityToAdd } = validate(RestockSchema, req.body);
      const updatedProduct = await inventoryService.restock(req.params.id, quantityToAdd);
      return sendSuccess(res, updatedProduct, `Restocked ${quantityToAdd} units successfully`);
    } catch (err) {
      next(err);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const validatedData = validate(UpdateProductSchema, req.body);
      const updatedProduct = await inventoryService.updateProduct(req.params.id, validatedData);
      return sendSuccess(res, updatedProduct, 'Product updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await inventoryService.deleteProduct(req.params.id);
      return sendSuccess(res, null, 'Product deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InventoryController();
