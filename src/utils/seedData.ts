import { Transaction } from '../types';

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

let runningBalance = 50000;

function makeTransaction(
  daysBack: number,
  description: string,
  amount: number,
  category: string,
  type: 'inflow' | 'outflow',
  merchant?: string,
  paymentRef?: string,
  subcategory?: string
): Transaction {
  runningBalance += amount;
  return {
    id: `seed-${daysBack}-${Math.random().toString(36).substr(2, 6)}`,
    date: daysAgo(daysBack),
    amount,
    description,
    category,
    subcategory,
    type,
    merchant,
    paymentRef,
    balance: runningBalance,
  };
}

export const SEED_TRANSACTIONS: Transaction[] = [
  // ── Inflows ──────────────────────────────────────────────────────────────
  makeTransaction(175, 'Monthly Sales Revenue – Jan', 28500, 'Sales', 'inflow', 'POS System', 'INV-2025-001'),
  makeTransaction(170, 'Consulting Services – ABC Corp', 7200, 'Professional Services', 'inflow', 'ABC Corp', 'INV-2025-002', 'Consulting'),
  makeTransaction(145, 'Monthly Sales Revenue – Feb', 31200, 'Sales', 'inflow', 'POS System', 'INV-2025-003'),
  makeTransaction(140, 'Online Store Revenue', 4850, 'Sales', 'inflow', 'Shopify', 'INV-2025-004', 'E-commerce'),
  makeTransaction(115, 'Monthly Sales Revenue – Mar', 29800, 'Sales', 'inflow', 'POS System', 'INV-2025-005'),
  makeTransaction(112, 'Equipment Rental Income', 2400, 'Other Income', 'inflow', 'Rent-It-All', 'INV-2025-006'),
  makeTransaction(90,  'Monthly Sales Revenue – Apr', 33100, 'Sales', 'inflow', 'POS System', 'INV-2025-007'),
  makeTransaction(85,  'Franchise Royalty Payment', 5600, 'Professional Services', 'inflow', 'Brand HQ', 'INV-2025-008'),
  makeTransaction(65,  'Monthly Sales Revenue – May', 30900, 'Sales', 'inflow', 'POS System', 'INV-2025-009'),
  makeTransaction(62,  'Catering Event – City Hall', 8750, 'Catering', 'inflow', 'City Hall', 'INV-2025-010'),
  makeTransaction(42,  'Monthly Sales Revenue – Jun', 35400, 'Sales', 'inflow', 'POS System', 'INV-2025-011'),
  makeTransaction(38,  'Grant – Small Business Fund', 10000, 'Grants & Subsidies', 'inflow', 'SBA', 'GRANT-2025-01'),
  makeTransaction(20,  'Online Store Revenue', 6100, 'Sales', 'inflow', 'Shopify', 'INV-2025-012', 'E-commerce'),
  makeTransaction(10,  'Loyalty Programme Reimbursement', 1250, 'Other Income', 'inflow', 'Loyalty Co', 'LR-2025-01'),
  makeTransaction(5,   'Customer Deposit – Event Jul', 3500, 'Deposits', 'inflow', 'Private Client', 'DEP-2025-01'),

  // ── Outflows ─────────────────────────────────────────────────────────────
  makeTransaction(172, 'Monthly Rent – Commercial Premises', -6500, 'Rent', 'outflow', 'Landlord LLC', 'CHK-10021', 'Office Rent'),
  makeTransaction(168, 'Payroll – January', -18200, 'Payroll', 'outflow', 'Gusto Payroll', 'PYRL-JAN-25', 'Staff Wages'),
  makeTransaction(162, 'Food & Beverage Supplies', -4320, 'Food Supplies', 'outflow', 'Metro Food Dist.', 'PO-2025-031'),
  makeTransaction(155, 'Electricity & Gas Bill', -920, 'Utilities', 'outflow', 'Energy Co', 'UTIL-JAN-25'),
  makeTransaction(150, 'Insurance Premium – Q1', -2100, 'Insurance', 'outflow', 'InsurePro', 'INS-Q1-25'),
  makeTransaction(142, 'Monthly Rent – Commercial Premises', -6500, 'Rent', 'outflow', 'Landlord LLC', 'CHK-10022', 'Office Rent'),
  makeTransaction(138, 'Payroll – February', -18500, 'Payroll', 'outflow', 'Gusto Payroll', 'PYRL-FEB-25', 'Staff Wages'),
  makeTransaction(133, 'Marketing – Social Media Ads', -1850, 'Marketing', 'outflow', 'Meta Ads', 'AD-FEB-25'),
  makeTransaction(128, 'Food & Beverage Supplies', -4890, 'Food Supplies', 'outflow', 'Metro Food Dist.', 'PO-2025-032'),
  makeTransaction(120, 'Electricity & Gas Bill', -875, 'Utilities', 'outflow', 'Energy Co', 'UTIL-FEB-25'),
  makeTransaction(115, 'Equipment Maintenance', -1200, 'Maintenance', 'outflow', 'TechFix Inc.', 'MNT-2025-01'),
  makeTransaction(112, 'Monthly Rent – Commercial Premises', -6500, 'Rent', 'outflow', 'Landlord LLC', 'CHK-10023', 'Office Rent'),
  makeTransaction(108, 'Payroll – March', -19100, 'Payroll', 'outflow', 'Gusto Payroll', 'PYRL-MAR-25', 'Staff Wages'),
  makeTransaction(100, 'Internet & Phone Services', -480, 'Utilities', 'outflow', 'TelecomCo', 'UTIL-MAR-25'),
  makeTransaction(95,  'Food & Beverage Supplies', -5200, 'Food Supplies', 'outflow', 'Metro Food Dist.', 'PO-2025-033'),
  makeTransaction(90,  'Accounting & Legal Fees', -2800, 'Professional Services', 'outflow', 'Smith & Jones LLP', 'INV-SJ-2025-01', 'Legal'),
  makeTransaction(88,  'Monthly Rent – Commercial Premises', -6500, 'Rent', 'outflow', 'Landlord LLC', 'CHK-10024', 'Office Rent'),
  makeTransaction(84,  'Payroll – April', -19400, 'Payroll', 'outflow', 'Gusto Payroll', 'PYRL-APR-25', 'Staff Wages'),
  makeTransaction(78,  'Electricity & Gas Bill', -1050, 'Utilities', 'outflow', 'Energy Co', 'UTIL-APR-25'),
  makeTransaction(72,  'Marketing – Print & Digital', -2400, 'Marketing', 'outflow', 'AdAgency Co', 'AD-APR-25'),
  makeTransaction(65,  'Food & Beverage Supplies', -4650, 'Food Supplies', 'outflow', 'Metro Food Dist.', 'PO-2025-034'),
  makeTransaction(60,  'Monthly Rent – Commercial Premises', -6500, 'Rent', 'outflow', 'Landlord LLC', 'CHK-10025', 'Office Rent'),
  makeTransaction(56,  'Payroll – May', -19800, 'Payroll', 'outflow', 'Gusto Payroll', 'PYRL-MAY-25', 'Staff Wages'),
  makeTransaction(50,  'Software Subscriptions', -890, 'Software', 'outflow', 'SaaS Bundle', 'SUB-MAY-25'),
  makeTransaction(45,  'Internet & Phone Services', -480, 'Utilities', 'outflow', 'TelecomCo', 'UTIL-MAY-25'),
  makeTransaction(40,  'Food & Beverage Supplies', -5800, 'Food Supplies', 'outflow', 'Metro Food Dist.', 'PO-2025-035'),
  makeTransaction(35,  'Monthly Rent – Commercial Premises', -6500, 'Rent', 'outflow', 'Landlord LLC', 'CHK-10026', 'Office Rent'),
  makeTransaction(30,  'Payroll – June', -20100, 'Payroll', 'outflow', 'Gusto Payroll', 'PYRL-JUN-25', 'Staff Wages'),
  makeTransaction(25,  'Electricity & Gas Bill', -980, 'Utilities', 'outflow', 'Energy Co', 'UTIL-JUN-25'),
  makeTransaction(18,  'Insurance Premium – Q3', -2100, 'Insurance', 'outflow', 'InsurePro', 'INS-Q3-25'),
  makeTransaction(12,  'Food & Beverage Supplies', -4200, 'Food Supplies', 'outflow', 'Metro Food Dist.', 'PO-2025-036'),
  makeTransaction(7,   'Marketing – Google Ads', -1500, 'Marketing', 'outflow', 'Google Ads', 'AD-JUL-25'),
  makeTransaction(3,   'Equipment Maintenance', -750, 'Maintenance', 'outflow', 'TechFix Inc.', 'MNT-2025-02'),
];
