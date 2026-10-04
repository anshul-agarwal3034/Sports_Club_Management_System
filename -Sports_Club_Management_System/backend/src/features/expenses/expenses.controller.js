const expensesService = require('./expenses.service');
const { sendSuccess } = require('../../shared/utils/response');

class ExpensesController {
  async getExpenses(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user.clubId;
      const { status, category, startDate, endDate } = req.query;
      const expenses = await expensesService.getExpenses(req.user, clubId, { status, category, startDate, endDate });
      return sendSuccess(res, expenses, 'Expenses retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getExpenseById(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user.clubId;
      const { id } = req.params;
      const expense = await expensesService.getExpenseById(req.user, clubId, id);
      return sendSuccess(res, expense, 'Expense retrieved successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async createExpense(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user.clubId;
      const expense = await expensesService.createExpense(req.user, clubId, req.body);
      return sendSuccess(res, expense, 'Expense recorded successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateExpense(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user.clubId;
      const { id } = req.params;
      const updated = await expensesService.updateExpense(req.user, clubId, id, req.body);
      return sendSuccess(res, updated, 'Expense updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async deleteExpense(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user.clubId;
      const { id } = req.params;
      const result = await expensesService.deleteExpense(req.user, clubId, id);
      return sendSuccess(res, result, result.message, 200);
    } catch (err) {
      next(err);
    }
  }

  async getFinancialOverview(req, res, next) {
    try {
      const clubId = req.params.clubId || req.user.clubId;
      const { startDate, endDate } = req.query;
      const overview = await expensesService.getFinancialOverview(req.user, clubId, startDate, endDate);
      return sendSuccess(res, overview, 'Financial overview calculated successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExpensesController();
