import { Transaction } from '../types';

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  // Remove quotes and trim
  const cleaned = dateStr.replace(/"/g, '').trim();
  
  // Try to parse various date formats
  const date = new Date(cleaned);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  // Try MM/DD/YYYY format
  const mmddyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try DD/MM/YYYY format
  const ddmmyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return new Date().toISOString().split('T')[0];
};

const parseAmount = (amountStr: string): number => {
  if (!amountStr) return 0;
  
  // Remove quotes, dollar signs, commas, and trim
  const cleaned = amountStr.replace(/["$,]/g, '').trim();
  
  // Handle parentheses as negative (accounting format)
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    const amount = parseFloat(cleaned.slice(1, -1));
    return isNaN(amount) ? 0 : -Math.abs(amount);
  }
  
  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
};

export const parseCSV = (file: File): Promise<Transaction[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV file must contain at least a header row and one data row');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        const transactions: Transaction[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          
          if (values.length < 3) continue; // Skip incomplete rows
          
          // Try to find common column patterns
          const dateIndex = findColumnIndex(headers, ['date', 'transaction date', 'trans date']);
          const descIndex = findColumnIndex(headers, ['description', 'desc', 'memo', 'details', 'merchant name']);
          const amountIndex = findColumnIndex(headers, ['amount', 'transaction amount']);
          const debitIndex = findColumnIndex(headers, ['debit', 'debit amount']);
          const creditIndex = findColumnIndex(headers, ['credit', 'credit amount']);
          const categoryIndex = findColumnIndex(headers, ['category', 'type']);
          const balanceIndex = findColumnIndex(headers, ['balance', 'running balance']);
          const merchantIndex = findColumnIndex(headers, ['merchant name', 'merchant', 'payee']);
          
          let amount = 0;
          if (amountIndex >= 0) {
            amount = parseAmount(values[amountIndex]);
          } else if (debitIndex >= 0 && creditIndex >= 0) {
            const debit = parseAmount(values[debitIndex]);
            const credit = parseAmount(values[creditIndex]);
            // Credit amount - Debit amount (credit is positive inflow, debit is negative outflow)
            amount = credit - debit;
          }
          
          // Get description from either description column or merchant name
          const description = (values[descIndex] || values[merchantIndex] || 'Imported transaction').replace(/"/g, '').trim();
          
          const transaction: Transaction = {
            id: `imported-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            date: normalizeDate(values[dateIndex]),
            description: description,
            amount: Math.abs(amount), // Store absolute value
            type: amount >= 0 ? 'inflow' : 'outflow',
            category: values[categoryIndex]?.replace(/"/g, '').trim() || categorizeTransaction(description),
            balance: balanceIndex >= 0 ? parseAmount(values[balanceIndex]) : 0
          };
          
          transactions.push(transaction);
        }
        
        resolve(transactions);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name) || h === name);
    if (index >= 0) return index;
  }
  return -1;
};

const categorizeTransaction = (description: string): string => {
  const descriptionLower = (description || '').toLowerCase();

  // Revenue categories - check for payment processors and sales
  if (descriptionLower.includes('stripe') || descriptionLower.includes('square') ||
      descriptionLower.includes('payment') || descriptionLower.includes('revenue') ||
      descriptionLower.includes('income') || descriptionLower.includes('sale') ||
      descriptionLower.includes('pos sale') || descriptionLower.includes('customer payment')) {
    return 'Revenue';
  }

  // Operating expenses
  if (descriptionLower.includes('rent')) {
    return 'Rent';
  }

  if (descriptionLower.includes('utilities') || descriptionLower.includes('electric') ||
      descriptionLower.includes('gas') || descriptionLower.includes('water') ||
      descriptionLower.includes('utilities co')) {
    return 'Utilities';
  }

  if (descriptionLower.includes('payroll') || descriptionLower.includes('salary') ||
      descriptionLower.includes('wages')) {
    return 'Payroll';
  }

  if (descriptionLower.includes('marketing') || descriptionLower.includes('advertising')) {
    return 'Marketing';
  }

  if (descriptionLower.includes('office') || descriptionLower.includes('supplies') ||
      descriptionLower.includes('amazon') || descriptionLower.includes('equipment')) {
    return 'Office Supplies';
  }

  if (descriptionLower.includes('software') || descriptionLower.includes('subscription')) {
    return 'Software';
  }

  if (descriptionLower.includes('travel') || descriptionLower.includes('fuel') ||
      descriptionLower.includes('gas station')) {
    return 'Travel';
  }

  if (descriptionLower.includes('bank') || descriptionLower.includes('fee') ||
      descriptionLower.includes('chase bank') || descriptionLower.includes('banking fee')) {
    return 'Banking Fees';
  }

  // Food and inventory
  if (descriptionLower.includes('sysco') || descriptionLower.includes('food') ||
      descriptionLower.includes('inventory') || descriptionLower.includes('pepsico') ||
      descriptionLower.includes('beverage')) {
    return 'Inventory';
  }

  return 'Other';
};

export const exportToCSV = (transactions: Transaction[], filename: string = 'transactions.csv') => {
  const headers = ['Date', 'Description', 'Amount', 'Category', 'Balance'];
  const csvContent = [
    headers.join(','),
    ...transactions.map(t => [
      t.date,
      `"${t.description}"`,
      t.amount,
      t.category,
      t.balance
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
