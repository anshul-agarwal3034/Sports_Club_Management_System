const express = require('express');
const expensesController = require('./expenses.controller');
const { authenticate } = require('../../shared/middlewares/auth.middleware');
const { requireRoles } = require('../../shared/middlewares/rbac.middleware');

const router = express.Router({ mergeParams: true });

router.use(authenticate);
router.use(requireRoles(['CLUB_OWNER', 'PLATFORM_ADMIN']));

// Financial Overview (Net Income, Operating Expenses, Commission, Breakdown)
router.get('/overview', (req, res, next) => expensesController.getFinancialOverview(req, res, next));

// Expenses List & Creation
router.get('/', (req, res, next) => expensesController.getExpenses(req, res, next));
router.post('/', (req, res, next) => expensesController.createExpense(req, res, next));

// Single Expense Operations
router.get('/:id', (req, res, next) => expensesController.getExpenseById(req, res, next));
router.put('/:id', (req, res, next) => expensesController.updateExpense(req, res, next));
router.delete('/:id', (req, res, next) => expensesController.deleteExpense(req, res, next));

module.exports = router;
