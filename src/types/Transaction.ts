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
  balance?: number | string;
}
