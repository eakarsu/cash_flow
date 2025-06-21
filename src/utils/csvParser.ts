// src/utils/csvParser.ts

import { Transaction } from '../types';
import { ColumnMapping } from '../types/columnMapping.ts';

async function getAICashFlowService() {
  try {
    const existingService = (window as any).aiCashFlowService;
    if (existingService && existingService.getCSVImportInsights) {
      return existingService;
    }
  } catch (error) {
    console.log('🤖 Could not get existing AI service:', error);
  }
  
  const { default: AICashFlowService } = await import('../services/aiCashFlowService.ts');
  return new AICashFlowService();
}

const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  const cleaned = dateStr.replace(/"/g, '').trim();
  const date = new Date(cleaned);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  const mmddyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyy) {
    const [, month, day, year] = mmddyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const ddmmyyyy = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return new Date().toISOString().split('T')[0];
};

const parseAmount = (amountStr: string): number => {
  if (!amountStr) return 0;

  const cleaned = amountStr.replace(/["$,]/g, '').trim();
  
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    const amount = parseFloat(cleaned.slice(1, -1));
    return isNaN(amount) ? 0 : -Math.abs(amount);
  }

  const amount = parseFloat(cleaned);
  return isNaN(amount) ? 0 : amount;
};

export const parseCSV = (file: File): Promise<Transaction[]> => {
  return new Promise(async (resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          throw new Error('CSV file must contain at least a header row and one data row');
        }

        console.log('📄 CSV file has', lines.length, 'lines');
        console.log('📄 Header line:', lines[0]);
        console.log('📄 First data line:', lines[1]);

        const originalHeaders = parseCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
        console.log('📄 Original headers:', originalHeaders);

        console.log('🤖 Starting AI insights for CSV import...');

        const aiCashFlowService = await getAICashFlowService();
        const firstDataLineValues = parseCSVLine(lines[1]);

        const { columnMapping, suggestedCategoryForFirstRow } = await aiCashFlowService.getCSVImportInsights(
          originalHeaders,
          firstDataLineValues
        );

        console.log('✅ AI CSV import insights completed:', { columnMapping, suggestedCategoryForFirstRow });

        const transactions: Transaction[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);

          if (values.length < 3) {
            console.log('⚠️ Skipping incomplete row', i, ':', values);
            continue;
          }

          //console.log(`📄 Row ${i} values:`, values);

          const dateIndex = columnMapping.date ? originalHeaders.indexOf(columnMapping.date) : -1;
          const descIndex = columnMapping.description ? originalHeaders.indexOf(columnMapping.description) : -1;
          const amountIndex = columnMapping.amount ? originalHeaders.indexOf(columnMapping.amount) : -1;
          const debitIndex = columnMapping.debit ? originalHeaders.indexOf(columnMapping.debit) : -1;
          const creditIndex = columnMapping.credit ? originalHeaders.indexOf(columnMapping.credit) : -1;
          const categoryIndex = columnMapping.category ? originalHeaders.indexOf(columnMapping.category) : -1;
          const balanceIndex = columnMapping.balance ? originalHeaders.indexOf(columnMapping.balance) : -1;

          let amount = 0;
          let transactionType: 'inflow' | 'outflow' = 'outflow';

          if (amountIndex >= 0 && values[amountIndex]) {
            amount = parseAmount(values[amountIndex]);
            transactionType = amount >= 0 ? 'inflow' : 'outflow';
          } else if (debitIndex >= 0 && creditIndex >= 0) {
            const debit = parseAmount(values[debitIndex] || '0');
            const credit = parseAmount(values[creditIndex] || '0');

            if (debit > 0) {
              amount = debit;
              transactionType = 'outflow';
            } else if (credit > 0) {
              amount = credit;
              transactionType = 'inflow';
            }
          } else {
            console.log('⚠️ Could not determine amount column from AI mapping, trying to guess from data');
            for (let j = 0; j < values.length; j++) {
              const testAmount = parseAmount(values[j]);
              if (!isNaN(testAmount) && testAmount !== 0) {
                amount = Math.abs(testAmount);
                transactionType = testAmount >= 0 ? 'inflow' : 'outflow';
                console.log(`📄 Guessed amount from column ${j}:`, testAmount);
                break;
              }
            }
          }

          let description = 'Imported transaction';
          if (descIndex >= 0 && values[descIndex]) {
            description = values[descIndex].replace(/"/g, '').trim();
          } else {
            for (let j = 0; j < values.length; j++) {
              const value = values[j]?.replace(/"/g, '').trim();
              if (value && value.length > 3 && isNaN(parseFloat(value)) && !value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                description = value;
                break;
              }
            }
          }

          let category = categorizeTransaction(description);
          if (categoryIndex >= 0 && values[categoryIndex]) {
            category = values[categoryIndex].replace(/"/g, '').trim();
          }

          let date = new Date().toISOString().split('T')[0];
          if (dateIndex >= 0 && values[dateIndex]) {
            date = normalizeDate(values[dateIndex]);
          }

          let balance = 0;
          if (balanceIndex >= 0 && values[balanceIndex]) {
            balance = parseAmount(values[balanceIndex]);
          }

          const transaction: Transaction = {
            id: `imported-${file.name.replace(/[^a-zA-Z0-9]/g, '')}-row-${i}`,
            date: date,
            description: description,
            amount: Math.abs(amount),
            type: transactionType,
            category: category,
            balance: balance
          };

          //console.log(`✅ Created transaction ${i}:`, transaction);
          transactions.push(transaction);
        }

        console.log('✅ Total transactions parsed:', transactions.length);

        const uniqueTransactions = transactions.filter((transaction, index, self) => {
          return index === self.findIndex(t =>
            t.date === transaction.date &&
            t.description === transaction.description &&
            t.amount === transaction.amount &&
            t.type === transaction.type &&
            t.category === transaction.category
          );
        });

        console.log('✅ Unique transactions after deduplication:', uniqueTransactions.length);

        if (uniqueTransactions.length !== transactions.length) {
          console.warn('⚠️ Removed', transactions.length - uniqueTransactions.length, 'duplicate transactions');
        }

        const expectedMax = lines.length - 1;
        if (uniqueTransactions.length > expectedMax) {
          console.error('❌ Too many transactions generated! Expected max:', expectedMax, 'Got:', uniqueTransactions.length);
          throw new Error(`CSV parsing error: Generated ${uniqueTransactions.length} transactions from ${expectedMax} data rows. This suggests a parsing issue.`);
        }

        console.log('✅ Final validation passed. Returning', uniqueTransactions.length, 'transactions');
        resolve(uniqueTransactions);

      } catch (error) {
        console.error('❌ CSV parsing error:', error);
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

const categorizeTransaction = (description: string): string => {
  const descriptionLower = (description || '').toLowerCase();

  if (descriptionLower.includes('stripe') || descriptionLower.includes('square') ||
      descriptionLower.includes('payment') || descriptionLower.includes('revenue') ||
      descriptionLower.includes('income') || descriptionLower.includes('sale') ||
      descriptionLower.includes('pos sale') || descriptionLower.includes('customer payment')) {
    return 'Revenue';
  }

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
