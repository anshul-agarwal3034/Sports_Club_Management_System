const express = require('express');
const inventoryController = require('./inventory.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requireRoles } = require('../../shared/middlewares/rbac.middleware');

const router = express.Router();

// Public / Authenticated product catalog listing
router.get('/products', (req, res, next) => inventoryController.getProducts(req, res, next));
router.get('/products/club/:clubId', (req, res, next) => inventoryController.getProducts(req, res, next));
router.get('/products/:id', (req, res, next) => inventoryController.getProductById(req, res, next));

// Staff & Owner management routes
router.post(
  '/products',
  authenticate,
  requireRoles(['STAFF', 'CLUB_OWNER', 'PLATFORM_ADMIN']),
  (req, res, next) => inventoryController.createProduct(req, res, next)
);

router.patch(
  '/products/:id/restock',
  authenticate,
  requireRoles(['STAFF', 'CLUB_OWNER', 'PLATFORM_ADMIN']),
  (req, res, next) => inventoryController.restock(req, res, next)
);

router.put(
  '/products/:id',
  authenticate,
  requireRoles(['STAFF', 'CLUB_OWNER', 'PLATFORM_ADMIN']),
  (req, res, next) => inventoryController.updateProduct(req, res, next)
);

router.delete(
  '/products/:id',
  authenticate,
  requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']),
  (req, res, next) => inventoryController.deleteProduct(req, res, next)
);

module.exports = router;
