const canteenService = require('./canteen.service');
const { validate, CreateOrderSchema, UpdateOrderStatusSchema } = require('./canteen.validator');
const { sendSuccess, sendError } = require('../../shared/utils/response');

class CanteenController {
  async createOrder(req, res, next) {
    try {
      const validatedData = validate(CreateOrderSchema, req.body);
      const order = await canteenService.createOrder(validatedData, req.user);
      return sendSuccess(res, order, 'Canteen order placed successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async getActiveKitchenQueue(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user?.clubId || req.query.clubId;
      if (!clubId) {
        return sendError(res, 'Club ID is required to view Kitchen Display System queue', 400);
      }
      const orders = await canteenService.getActiveKitchenQueue(clubId);
      return sendSuccess(res, orders, 'Kitchen queue retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getClubOrders(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user?.clubId;
      if (!clubId) {
        return sendError(res, 'Club ID is required to view orders', 400);
      }
      const orders = await canteenService.getClubOrders(clubId);
      return sendSuccess(res, orders, 'Orders retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async updateOrderStatus(req, res, next) {
    try {
      const { status } = validate(UpdateOrderStatusSchema, req.body);
      const updatedOrder = await canteenService.updateOrderStatus(req.params.id, status);
      return sendSuccess(res, updatedOrder, `Order status updated to '${status}' successfully`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CanteenController();
