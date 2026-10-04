import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Printer,
  Filter,
  CheckCircle2,
  FileText,
  TrendingUp,
  Receipt,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  Building2,
  Clock,
  ShieldCheck,
  CreditCard,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/services/api';
import { Expense, FinancialOverview } from '@/types';

type FinanceTab = 'overview' | 'income' | 'expenses' | 'liabilities' | 'commission' | 'statement';

export default function FinancePayoutsPage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [period, setPeriod] = useState<'current_month' | 'last_30' | 'all'>('current_month');
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<FinancialOverview>({
    totalRevenue: 59437,
    platformCommission: 4344,
    operatingExpenses: 28450,
    netIncome: 26643,
    unpaidLiabilities: 8500,
    unpaidBillsCount: 1,
    breakdown: {
      courtRevenue: 18450,
      membershipRevenue: 24997,
      canteenRevenue: 6840,
      coachingRevenue: 0,
      shopRevenue: 9150,
      refunds: 0,
      salaries: 18000,
      utilities: 4200,
      rent: 0,
      maintenance: 3250,
      inventory: 3000,
    },
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseFilter, setExpenseFilter] = useState('ALL');

  // Add / Edit Expense Modal State
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    category: 'UTILITIES',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    servicePeriod: '2026-10',
    payeeVendor: '',
    paymentMethod: 'UPI',
    status: 'PAID',
    notes: '',
  });
  const [modalError, setModalError] = useState<string | null>(null);

  const storedUser = localStorage.getItem('sportshub_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const clubId = currentUser?.club_id || '11111111-1111-1111-1111-111111111111';

  // Load Financial Data
  const loadFinanceData = async () => {
    setLoading(true);
    try {
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (period === 'current_month') {
        startDate = '2026-10-01';
        endDate = '2026-10-31';
      }

      const overviewData = await api.getFinancialOverview(clubId, startDate, endDate);
      if (overviewData) {
        setOverview(overviewData);
      }

      const expList = await api.getExpenses(clubId);
      if (Array.isArray(expList)) {
        setExpenses(expList);
      }
    } catch (err) {
      console.warn('Using existing financial dataset', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, [clubId, period]);

  // Open Modal for New Expense
  const handleOpenAddExpense = () => {
    setEditingExpenseId(null);
    setExpenseForm({
      category: 'UTILITIES',
      description: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      servicePeriod: '2026-10',
      payeeVendor: '',
      paymentMethod: 'UPI',
      status: 'PAID',
      notes: '',
    });
    setModalError(null);
    setExpenseModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setExpenseForm({
      category: exp.category,
      description: exp.description,
      amount: String(exp.amount),
      expenseDate: exp.expense_date?.split('T')[0] || exp.expense_date,
      servicePeriod: exp.service_period || '2026-10',
      payeeVendor: exp.payee_vendor || '',
      paymentMethod: exp.payment_method || 'UPI',
      status: exp.status,
      notes: exp.notes || '',
    });
    setModalError(null);
    setExpenseModalOpen(true);
  };

  // Save Expense Form
  const handleSaveExpense = async () => {
    if (!expenseForm.description.trim()) {
      setModalError('Description is required.');
      return;
    }
    const amt = parseFloat(expenseForm.amount);
    if (!amt || amt <= 0) {
      setModalError('Valid expense amount is required.');
      return;
    }

    setModalError(null);
    try {
      const payload = {
        category: expenseForm.category,
        description: expenseForm.description,
        amount: amt,
        expenseDate: expenseForm.expenseDate,
        servicePeriod: expenseForm.servicePeriod,
        payeeVendor: expenseForm.payeeVendor,
        paymentMethod: expenseForm.paymentMethod,
        status: expenseForm.status,
        notes: expenseForm.notes,
      };

      if (editingExpenseId) {
        await api.updateExpense(editingExpenseId, payload, clubId);
      } else {
        await api.createExpense(payload, clubId);
      }

      setExpenseModalOpen(false);
      await loadFinanceData();
    } catch (err: any) {
      setModalError(err.response?.data?.message || err.message || 'Failed to save expense.');
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(id, clubId);
      await loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  // Mark Unpaid Bill as Paid
  const handleMarkAsPaid = async (exp: Expense) => {
    try {
      await api.updateExpense(
        exp.id,
        {
          status: 'PAID',
          paymentDate: new Date().toISOString().split('T')[0],
        },
        clubId
      );
      await loadFinanceData();
    } catch (err: any) {
      alert(err.message || 'Failed to settle bill.');
    }
  };

  // Filtered Expenses
  const filteredExpenses = expenses.filter((e) => {
    if (expenseFilter === 'PAID') return e.status === 'PAID';
    if (expenseFilter === 'UNPAID') return e.status === 'UNPAID';
    if (expenseFilter === 'SALARY') return ['COACHING_SALARY', 'STAFF_SALARY'].includes(e.category);
    return true;
  });

  const unpaidLiabilitiesList = expenses.filter((e) => e.status === 'UNPAID');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#006c49] uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4" /> Finance &amp; Expense Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
            Club Financial Performance &amp; Net Income
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track earned revenue, operating expenses, platform settlements, unpaid liabilities, and net profit.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <select
            value={period}
            onChange={(e: any) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="current_month">October 2026 (Current)</option>
            <option value="last_30">Last 30 Days</option>
            <option value="all">All-Time Fiscal History</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 cursor-pointer text-xs"
          >
            <Printer className="w-3.5 h-3.5" /> Print Statement
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddExpense}
            className="bg-[#006c49] hover:bg-[#005237] gap-1.5 cursor-pointer text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Record Expense
          </Button>
        </div>
      </div>

      {/* 4 Financial Cards: Net Income = Earned Revenue - Operating Expenses - Platform Commission */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <Card padded="sm" className="space-y-1.5 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Earned Revenue</span>
            <DollarSign className="w-4 h-4 text-[#006c49]" />
          </div>
          <div className="text-2xl font-black text-[#0b1c30]">
            ₹{overview.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500">
            Bookings, memberships, canteen, shop
          </div>
        </Card>

        {/* Card 2: Operating Expenses */}
        <Card padded="sm" className="space-y-1.5 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Operating Expenses</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-[#0b1c30]">
            ₹{overview.operatingExpenses.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500">
            Salaries, utilities, maintenance, inventory
          </div>
        </Card>

        {/* Card 3: Platform Commission */}
        <Card padded="sm" className="space-y-1.5 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Platform Commission</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-[#0b1c30]">
            ₹{overview.platformCommission.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500">
            10% on courts &amp; plans (0% canteen/shop)
          </div>
        </Card>

        {/* Card 4: NET INCOME */}
        <Card padded="sm" className={`space-y-1.5 border-2 ${overview.netIncome >= 0 ? 'border-emerald-500/40 bg-emerald-50/20' : 'border-rose-400 bg-rose-50/20'}`}>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>NET INCOME</span>
            <TrendingUp className={`w-4 h-4 ${overview.netIncome >= 0 ? 'text-[#006c49]' : 'text-rose-600'}`} />
          </div>
          <div className={`text-2xl font-black ${overview.netIncome >= 0 ? 'text-[#006c49]' : 'text-rose-600'}`}>
            ₹{overview.netIncome.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">
            *Reflects recorded operating expenses only. Excludes loan principal financing and pending bills.
          </div>
        </Card>
      </div>

      {/* Outstanding Liabilities Banner if any */}
      {overview.unpaidLiabilities > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-900 font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Outstanding Bills &amp; Liabilities: ₹{overview.unpaidLiabilities.toLocaleString('en-IN')} ({overview.unpaidBillsCount} pending {overview.unpaidBillsCount === 1 ? 'bill' : 'bills'}).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('liabilities')}
            className="text-amber-800 font-bold hover:underline cursor-pointer"
          >
            Review Bills &rarr;
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-semibold">
        {[
          { key: 'overview', label: 'Financial Overview', icon: TrendingUp },
          { key: 'expenses', label: `Operating Expenses (${expenses.length})`, icon: Receipt },
          { key: 'liabilities', label: `Unpaid Liabilities (${unpaidLiabilitiesList.length})`, icon: Clock },
          { key: 'commission', label: 'Commission & Payout Rules', icon: ShieldCheck },
          { key: 'statement', label: 'Income & Expense Statement', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as FinanceTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-[#006c49] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Financial Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Source Breakdown */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base text-[#0b1c30] border-b border-slate-100 pb-2">
              Revenue Sources
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Court Bookings</span>
                <span className="font-bold text-[#0b1c30]">₹{overview.breakdown.courtRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Membership Subscriptions</span>
                <span className="font-bold text-[#0b1c30]">₹{overview.breakdown.membershipRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Pro Shop &amp; Equipment</span>
                <span className="font-bold text-[#0b1c30]">₹{overview.breakdown.shopRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Canteen &amp; Cafe</span>
                <span className="font-bold text-[#0b1c30]">₹{overview.breakdown.canteenRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-2 font-bold text-sm text-[#006c49]">
                <span>Total Earned Revenue</span>
                <span>₹{overview.totalRevenue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </Card>

          {/* Operating Expense Breakdown */}
          <Card className="p-6 space-y-4">
            <h3 className="font-bold text-base text-[#0b1c30] border-b border-slate-100 pb-2">
              Operating Expense Categories
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Staff &amp; Coaching Salaries</span>
                <span className="font-bold text-slate-800">₹{overview.breakdown.salaries.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Electricity &amp; Utilities</span>
                <span className="font-bold text-slate-800">₹{overview.breakdown.utilities.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Equipment Maintenance &amp; Repairs</span>
                <span className="font-bold text-slate-800">₹{overview.breakdown.maintenance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-600 font-medium">Inventory &amp; Supplies Purchases</span>
                <span className="font-bold text-slate-800">₹{overview.breakdown.inventory.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center pt-2 font-bold text-sm text-amber-700">
                <span>Total Operating Outflows</span>
                <span>₹{overview.operatingExpenses.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: Operating Expenses */}
      {activeTab === 'expenses' && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-base text-[#0b1c30]">Operating Expense Ledger</h3>
              <p className="text-xs text-slate-500">Record payments for coaches, staff, power, maintenance, and supplies.</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={expenseFilter}
                onChange={(e) => setExpenseFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
              >
                <option value="ALL">All Expenses</option>
                <option value="PAID">Paid Only</option>
                <option value="UNPAID">Unpaid Only</option>
                <option value="SALARY">Salaries Only</option>
              </select>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddExpense}
                className="bg-[#006c49] gap-1 cursor-pointer text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Expense
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Description / Payee</th>
                  <th className="py-2.5 px-3 font-semibold">Period</th>
                  <th className="py-2.5 px-3 font-semibold">Payment Mode</th>
                  <th className="py-2.5 px-3 font-semibold">Amount</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {exp.expense_date ? exp.expense_date.split('T')[0] : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {exp.category.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#0b1c30]">{exp.description}</div>
                        {exp.payee_vendor && (
                          <div className="text-[11px] text-slate-500">Payee: {exp.payee_vendor}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                        {exp.service_period || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {exp.payment_method || 'UPI'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#0b1c30]">
                        ₹{Number(exp.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge
                          variant="outline"
                          className={
                            exp.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }
                        >
                          {exp.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditExpense(exp)}
                          className="text-[#006c49] hover:underline font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-rose-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Outstanding Liabilities */}
      {activeTab === 'liabilities' && (
        <Card className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-[#0b1c30]">Outstanding Liabilities &amp; Payables</h3>
            <p className="text-xs text-slate-500">
              Unpaid invoices, utility dues, or contractor retainers. Settling updates payment status directly without double-counting expenses.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2.5 px-3 font-semibold">Bill Date</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Description / Vendor</th>
                  <th className="py-2.5 px-3 font-semibold">Due Amount</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Settlement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unpaidLiabilitiesList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      🎉 No outstanding liabilities. All vendor bills and salaries are settled!
                    </td>
                  </tr>
                ) : (
                  unpaidLiabilitiesList.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{exp.expense_date?.split('T')[0]}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{exp.category.replace(/_/g, ' ')}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#0b1c30]">{exp.description}</div>
                        <div className="text-[11px] text-slate-500">Vendor: {exp.payee_vendor || 'N/A'}</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-amber-700 text-sm">
                        ₹{Number(exp.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleMarkAsPaid(exp)}
                          className="bg-[#006c49] hover:bg-[#005237] text-xs cursor-pointer"
                        >
                          Mark as Paid (Settle)
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: Commission & Payout Rules */}
      {activeTab === 'commission' && (
        <Card className="p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-[#0b1c30]">Platform Fee Schedules &amp; Settlement Rules</h3>
            <p className="text-xs text-slate-500">
              Clear breakdown of platform fees across booking channels and auxiliary operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-900 text-sm">Court &amp; Membership Bookings</span>
                <Badge variant="outline" className="bg-emerald-100 text-[#006c49] border-emerald-300 font-bold">
                  10.0% Commission
                </Badge>
              </div>
              <p className="text-slate-600 text-[11px]">
                Platform service charge covers hosting, dynamic pricing engine, waitlist waterfall allocations, SMS/WhatsApp notifications, and gateway costs.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-900 text-sm">Pro Shop &amp; Canteen Sales</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 font-bold">
                  0.0% Commission
                </Badge>
              </div>
              <p className="text-slate-600 text-[11px]">
                Auxiliary on-premise sales (canteen orders, racket stringing, gear purchases) carry 0% platform commission fee.
              </p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-bold text-[#0b1c30]">Direct Payout Coordinate</div>
            <div>Bank: HDFC Bank • Account: *******5012 • IFSC: HDFC0001234</div>
            <div>Settlement Cycle: T+1 Direct Bank Transfer (Automatic batch transfer every morning at 06:00 IST).</div>
          </div>
        </Card>
      )}

      {/* TAB 5: Statement */}
      {activeTab === 'statement' && (
        <Card className="p-6 sm:p-8 space-y-6 print:border-none print:shadow-none">
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-[#0b1c30]">INCOME &amp; EXPENSE STATEMENT</h2>
              <p className="text-xs text-slate-500">Period: October 1, 2026 – October 31, 2026</p>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-[#0b1c30]">Skyline Sports Arena</div>
              <div className="text-slate-500">GSTIN: 23AAHCS1234D1Z5</div>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Operating Revenue */}
            <div>
              <h3 className="font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">1. Operating Revenues</h3>
              <div className="divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span>Court Bookings (Peak &amp; Off-Peak)</span>
                  <span className="font-semibold">₹{overview.breakdown.courtRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Annual Memberships (Gold, Silver, Junior)</span>
                  <span className="font-semibold">₹{overview.breakdown.membershipRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Pro Shop &amp; Merchandise</span>
                  <span className="font-semibold">₹{overview.breakdown.shopRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Canteen &amp; Cafe Counter</span>
                  <span className="font-semibold">₹{overview.breakdown.canteenRevenue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-slate-900 border-t border-slate-200">
                  <span>Total Gross Earned Revenue (A)</span>
                  <span>₹{overview.totalRevenue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* 2. Platform Deductions */}
            <div>
              <h3 className="font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">2. Platform Commission</h3>
              <div className="divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span>Standard 10% Platform Fee on Courts &amp; Memberships</span>
                  <span className="font-semibold text-blue-700">-₹{overview.platformCommission.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-slate-900 border-t border-slate-200">
                  <span>Total Platform Commission (B)</span>
                  <span className="text-blue-700">-₹{overview.platformCommission.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* 3. Operating Expenses */}
            <div>
              <h3 className="font-bold text-slate-700 uppercase border-b border-slate-200 pb-1">3. Recorded Operating Expenses</h3>
              <div className="divide-y divide-slate-100">
                <div className="flex justify-between py-1.5">
                  <span>Staff &amp; Coaching Salaries</span>
                  <span className="font-semibold text-amber-700">-₹{overview.breakdown.salaries.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Electricity &amp; Utilities</span>
                  <span className="font-semibold text-amber-700">-₹{overview.breakdown.utilities.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Equipment Maintenance &amp; Court Repairs</span>
                  <span className="font-semibold text-amber-700">-₹{overview.breakdown.maintenance.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Inventory &amp; Supplies Purchase</span>
                  <span className="font-semibold text-amber-700">-₹{overview.breakdown.inventory.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-slate-900 border-t border-slate-200">
                  <span>Total Operating Expenses (C)</span>
                  <span className="text-amber-700">-₹{overview.operatingExpenses.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Bottom Line Net Income */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-sm font-bold">
              <div>
                <span className="text-emerald-950">NET OPERATING INCOME (A - B - C)</span>
                <p className="text-[10px] text-slate-500 font-normal">
                  Reflects earned income less operating outflows and platform fees.
                </p>
              </div>
              <span className="text-xl font-black text-[#006c49]">
                ₹{overview.netIncome.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Add / Edit Expense Modal */}
      {expenseModalOpen && (
        <Modal
          isOpen={expenseModalOpen}
          onClose={() => setExpenseModalOpen(false)}
          title={editingExpenseId ? 'Edit Expense Record' : 'Record New Expense'}
        >
          <div className="space-y-4 text-xs">
            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Expense Category *</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="COACHING_SALARY">Coaching Salary / Payout</option>
                <option value="STAFF_SALARY">Staff / Reception Salary</option>
                <option value="UTILITIES">Electricity &amp; Power Utilities</option>
                <option value="EQUIPMENT_MAINTENANCE">Equipment Maintenance</option>
                <option value="FACILITY_REPAIRS">Facility &amp; Court Repairs</option>
                <option value="INVENTORY_PURCHASE">Inventory &amp; Supplies Purchase</option>
                <option value="RENT_LEASE">Land / Court Rent Lease</option>
                <option value="MARKETING">Marketing &amp; Promotions</option>
                <option value="LOAN_PRINCIPAL">Loan Principal Repayment (Financing)</option>
                <option value="OTHER">Other Operating Expense</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Description / Notes *</label>
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="e.g. October Electricity Bill - High Tension Line"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="₹ Amount"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#006c49]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Date *</label>
                <input
                  type="date"
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payee / Vendor Name</label>
                <input
                  type="text"
                  value={expenseForm.payeeVendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, payeeVendor: e.target.value })}
                  placeholder="e.g. MP State Power Corp / Coach Rajesh"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Service Period (YYYY-MM)</label>
                <input
                  type="text"
                  value={expenseForm.servicePeriod}
                  onChange={(e) => setExpenseForm({ ...expenseForm, servicePeriod: e.target.value })}
                  placeholder="2026-10"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={expenseForm.paymentMethod}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="UPI">UPI / Instant Transfer</option>
                  <option value="BANK_TRANSFER">NEFT / RTGS Bank Transfer</option>
                  <option value="CASH">Cash Voucher</option>
                  <option value="CARD">Debit / Corporate Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                <select
                  value={expenseForm.status}
                  onChange={(e) => setExpenseForm({ ...expenseForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  <option value="PAID">PAID (Settled Outflow)</option>
                  <option value="UNPAID">UNPAID (Pending Liability)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setExpenseModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveExpense} className="bg-[#006c49]">
                Save Expense Record
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
