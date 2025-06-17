import { Transaction, CashFlowSummary, CategorySummary, WeeklyCashForecast } from '../types';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear,
         subMonths, format, addWeeks, startOfWeek, isWithinInterval, parseISO } from 'date-fns';

export const calculateCashFlowSummary = (
  transactions: Transaction[],
  period: 'month' | 'quarter' | 'year' | 'all' = 'all'
): CashFlowSummary => {
  const filteredTransactions = filterTransactionsByPeriod(transactions, period);

  const totalInflows = filteredTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflows = Math.abs(filteredTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0));

  const netCashFlow = totalInflows - totalOutflows;

  // Calculate burn rate (average monthly outflows over last 6 months)
  const sixMonthsAgo = subMonths(new Date(), 6);
  const recentTransactions = transactions.filter(t =>
    parseISO(t.date) >= sixMonthsAgo && t.amount < 0
  );
  const burnRate = Math.abs(recentTransactions.reduce((sum, t) => sum + t.amount, 0)) / 6;

  // Calculate runway (current balance / monthly burn rate)
  // Current balance is the cumulative sum of all transactions
  const currentBalance = transactions.reduce((sum, t) => sum + t.amount, 0);
  const runway = burnRate > 0 && currentBalance > 0 ? currentBalance / burnRate : 0;

  return {
    totalInflows,
    totalOutflows,
    netCashFlow,
    burnRate,
    runway
  };
};

export const calculateCategoryBreakdown = (
  transactions: Transaction[],
  type: 'inflow' | 'outflow',
  period: 'month' | 'quarter' | 'year' | 'all' = 'all'
): CategorySummary[] => {
  const filteredTransactions = filterTransactionsByPeriod(transactions, period)
    .filter(t => type === 'inflow' ? t.amount > 0 : t.amount < 0);

  const categoryTotals = filteredTransactions.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = { amount: 0, count: 0 };
    }
    acc[category].amount += Math.abs(transaction.amount);
    acc[category].count += 1;
    return acc;
  }, {} as Record<string, { amount: number; count: number }>);

  const total = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.amount, 0);

  return Object.entries(categoryTotals)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      count: data.count
    }))
    .sort((a, b) => b.amount - a.amount);
};

export const generate13WeekForecast = (transactions: Transaction[]): WeeklyCashForecast[] => {
  const currentDate = new Date();
  const forecast: WeeklyCashForecast[] = [];

  // Calculate average weekly inflows and outflows from historical data
  const last12Weeks = transactions.filter(t => {
    const transactionDate = parseISO(t.date);
    const twelveWeeksAgo = addWeeks(currentDate, -12);
    return transactionDate >= twelveWeeksAgo;
  });

  const weeklyInflows = last12Weeks
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0) / 12;

  const weeklyOutflows = Math.abs(last12Weeks
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0)) / 12;

  // Get current balance
  const sortedTransactions = transactions.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let currentBalance = sortedTransactions.length > 0 ? sortedTransactions[0].balance || 0 : 0;

  // Generate 13-week forecast
  for (let week = 0; week < 13; week++) {
    const weekStart = addWeeks(startOfWeek(currentDate), week);
    const projectedInflows = weeklyInflows;
    const projectedOutflows = weeklyOutflows;

    currentBalance += projectedInflows - projectedOutflows;

    forecast.push({
      week: format(weekStart, 'MMM dd'),
      projectedBalance: currentBalance,
      inflows: projectedInflows,
      outflows: projectedOutflows
    });
  }

  return forecast;
};

const filterTransactionsByPeriod = (
  transactions: Transaction[],
  period: 'month' | 'quarter' | 'year' | 'all'
): Transaction[] => {
  if (period === 'all') return transactions;

  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'month':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      break;
    case 'quarter':
      startDate = startOfQuarter(now);
      endDate = endOfQuarter(now);
      break;
    case 'year':
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      break;
    default:
      return transactions;
  }

  return transactions.filter(transaction => {
    const transactionDate = parseISO(transaction.date);
    return isWithinInterval(transactionDate, { start: startDate, end: endDate });
  });
};

export const getMonthlyTrends = (transactions: Transaction[], months: number = 12) => {
  const trends = [];
  const currentDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(currentDate, i));
    const monthEnd = endOfMonth(subMonths(currentDate, i));

    const monthTransactions = transactions.filter(t => {
      const transactionDate = parseISO(t.date);
      return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd });
    });

    const inflows = monthTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const outflows = Math.abs(monthTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0));

    trends.push({
      month: format(monthStart, 'MMM yyyy'),
      inflows,
      outflows,
      netFlow: inflows - outflows
    });
  }

  return trends;
};
