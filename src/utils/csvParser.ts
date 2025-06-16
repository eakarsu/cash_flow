import Papa from 'papaparse';
import { Transaction } from '../types';

export const parseCSV = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const transactions: Transaction[] = results.data
            .filter((row: any) => row['Transaction date'] && row['Transaction ID'])
            .map((row: any, index: number) => {
              const debitAmount = parseFloat(row['Debit amount']) || 0;
              const creditAmount = parseFloat(row['Credit amount']) || 0;
              const amount = creditAmount > 0 ? creditAmount : -debitAmount;

              return {
                id: row['Transaction ID'] || `txn-${index}`,
                date: row['Transaction date'],
                amount,
                description: row['Description'] || '',
                category: categorizeTransaction(row['Merchant name'], row['Description']),
                type: amount > 0 ? 'inflow' : 'outflow',
                merchant: row['Merchant name'] || '',
                paymentRef: row['Payment ref ID / Check No'] || '',
                balance: parseFloat(row['Balance']) || 0,
              } as Transaction;
            });

          resolve(transactions);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

const categorizeTransaction = (merchant: string, description: string): string => {
  const merchantLower = (merchant || '').toLowerCase();
  const descriptionLower = (description || '').toLowerCase();

  // Revenue categories
  if (merchantLower.includes('stripe') || merchantLower.includes('square') ||
      descriptionLower.includes('customer payment') || descriptionLower.includes('pos sale')) {
    return 'Revenue';
  }

  // Operating expenses
  if (merchantLower.includes('rent') || descriptionLower.includes('rent')) {
    return 'Rent';
  }

  if (merchantLower.includes('utilities') || descriptionLower.includes('utilities')) {
    return 'Utilities';
  }

  if (merchantLower.includes('payroll') || descriptionLower.includes('payroll')) {
    return 'Payroll';
  }

  // Inventory and supplies
  if (merchantLower.includes('sysco') || merchantLower.includes('us foods') ||
      merchantLower.includes('gordon food') || merchantLower.includes('local farm') ||
      merchantLower.includes('local butcher') || descriptionLower.includes('food inventory')) {
    return 'Food Inventory';
  }

  if (merchantLower.includes('pepsi') || merchantLower.includes('coca-cola') ||
      descriptionLower.includes('beverage')) {
    return 'Beverages';
  }

  if (merchantLower.includes('bakery supply') || descriptionLower.includes('baking')) {
    return 'Baking Supplies';
  }

  // Equipment and maintenance
  if (merchantLower.includes('kitchen depot') || descriptionLower.includes('equipment') ||
      descriptionLower.includes('maintenance')) {
    return 'Equipment & Maintenance';
  }

  // General supplies
  if (merchantLower.includes('amazon') || merchantLower.includes('walmart') ||
      merchantLower.includes('costco') || descriptionLower.includes('supplies')) {
    return 'General Supplies';
  }

  // Banking and fees
  if (merchantLower.includes('chase bank') || descriptionLower.includes('banking fee') ||
      descriptionLower.includes('service fee')) {
    return 'Banking Fees';
  }

  return 'Other';
};

export const exportToCSV = (transactions: Transaction[], filename: string = 'transactions.csv') => {
  const csv = Papa.unparse(transactions);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};