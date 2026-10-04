const expensesRepository = require('./expenses.repository');

class ExpensesService {
  async getExpenses(user, clubId, filters) {
    if (user.role !== 'PLATFORM_ADMIN' && user.clubId !== clubId) {
      const err = new Error('Unauthorized to view expenses for this club.');
      err.statusCode = 403;
      throw err;
    }
    return await expensesRepository.getExpenses(clubId, filters);
  }

  async getExpenseById(user, clubId, id) {
    if (user.role !== 'PLATFORM_ADMIN' && user.clubId !== clubId) {
      const err = new Error('Unauthorized.');
      err.statusCode = 403;
      throw err;
    }
    const expense = await expensesRepository.getExpenseById(id, clubId);
    if (!expense) {
      const err = new Error('Expense record not found.');
      err.statusCode = 404;
      throw err;
    }
    return expense;
  }

  async createExpense(user, clubId, data) {
    if (user.role !== 'PLATFORM_ADMIN' && user.clubId !== clubId) {
      const err = new Error('Unauthorized to add expenses for this club.');
      err.statusCode = 403;
      throw err;
    }

    if (!data.category || !data.amount || !data.description) {
      const err = new Error('Category, description, and amount are required.');
      err.statusCode = 400;
      throw err;
    }

    // Salary double-counting prevention
    if (['COACHING_SALARY', 'STAFF_SALARY'].includes(data.category) && data.payeeVendor && data.servicePeriod) {
      const duplicate = await expensesRepository.findDuplicateSalary(clubId, data.payeeVendor, data.servicePeriod);
      if (duplicate) {
        const err = new Error(
          `Duplicate salary expense detected: A salary payout for ${data.payeeVendor} covering period ${data.servicePeriod} was already recorded on ${duplicate.expense_date} (ID: ${duplicate.id}).`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    return await expensesRepository.createExpense(clubId, data, user.id);
  }

  async updateExpense(user, clubId, id, data) {
    if (user.role !== 'PLATFORM_ADMIN' && user.clubId !== clubId) {
      const err = new Error('Unauthorized to update this expense.');
      err.statusCode = 403;
      throw err;
    }

    const existing = await expensesRepository.getExpenseById(id, clubId);
    if (!existing) {
      const err = new Error('Expense not found.');
      err.statusCode = 404;
      throw err;
    }

    // Check duplicate salary on update if period/payee changed
    const targetCategory = data.category || existing.category;
    const targetPayee = data.payeeVendor || existing.payee_vendor;
    const targetPeriod = data.servicePeriod || existing.service_period;

    if (['COACHING_SALARY', 'STAFF_SALARY'].includes(targetCategory) && targetPayee && targetPeriod) {
      const duplicate = await expensesRepository.findDuplicateSalary(clubId, targetPayee, targetPeriod, id);
      if (duplicate) {
        const err = new Error(
          `Duplicate salary expense detected: Another payout for ${targetPayee} covering period ${targetPeriod} already exists.`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    return await expensesRepository.updateExpense(id, clubId, data);
  }

  async deleteExpense(user, clubId, id) {
    if (user.role !== 'PLATFORM_ADMIN' && user.clubId !== clubId) {
      const err = new Error('Unauthorized to delete this expense.');
      err.statusCode = 403;
      throw err;
    }

    const existing = await expensesRepository.getExpenseById(id, clubId);
    if (!existing) {
      const err = new Error('Expense not found.');
      err.statusCode = 404;
      throw err;
    }

    await expensesRepository.deleteExpense(id, clubId);
    return { message: 'Expense record deleted successfully.' };
  }

  async getFinancialOverview(user, clubId, startDate, endDate) {
    if (user.role !== 'PLATFORM_ADMIN' && user.clubId !== clubId) {
      const err = new Error('Unauthorized to view financial records.');
      err.statusCode = 403;
      throw err;
    }

    return await expensesRepository.getFinancialOverview(clubId, startDate, endDate);
  }
}

module.exports = new ExpensesService();
