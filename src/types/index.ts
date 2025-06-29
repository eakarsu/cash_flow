export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: string;
  subcategory?: string;
  type: 'inflow' | 'outflow';
  merchant?: string;
  paymentRef?: string;
  balance?: number;
}

export interface CashFlowSummary {
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  burnRate: number;
  runway: number;
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface WeeklyCashForecast {
  week: string;
  projectedBalance: number;
  inflows: number;
  outflows: number;
}

export interface PeriodFilter {
  period: 'month' | 'quarter' | 'year' | 'all';
  startDate?: string;
  endDate?: string;
}

export interface ScenarioType {
  optimistic: number;
  realistic: number;
  pessimistic: number;
}