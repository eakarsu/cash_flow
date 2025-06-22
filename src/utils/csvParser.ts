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
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    const fullYear = parseInt(year) < 100 ? `20${year}` : year;
    const formattedDate = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(formattedDate.getTime())) {
      return formattedDate.toISOString().split('T')[0];
    }
  }
  console.warn(`⚠️ Could not parse date: "${dateStr}". Using today's date.`);
  return new Date().toISOString().split('T')[0];
};

const parseAmount = (amountStr: string): number => {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/["$,]/g, '').trim();
  
  // DEBUG LOG
  console.log(`[DEBUG] parseAmount input: '${amountStr}', cleaned: '${cleaned}'`);

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

        const originalHeaders = parseCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
        
        // Let's use the fallback mapping for now to ensure consistency, as AI mapping can vary.
        // This makes debugging predictable.
        const columnMapping = new (await import('../services/aiColumnMappingService.ts')).default().fallbackMapping(originalHeaders);
        console.log('✅ Using Fallback Column mapping for predictable debugging:', columnMapping);
        
        const transactions: Transaction[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          if (values.length < originalHeaders.length) {
            continue; // Skip malformed rows
          }

          const dateIndex = columnMapping.date ? originalHeaders.indexOf(columnMapping.date) : -1;
          const descIndex = columnMapping.description ? originalHeaders.indexOf(columnMapping.description) : -1;
          const amountIndex = columnMapping.amount ? originalHeaders.indexOf(columnMapping.amount) : -1;
          const debitIndex = columnMapping.debit ? originalHeaders.indexOf(columnMapping.debit) : -1;
          const creditIndex = columnMapping.credit ? originalHeaders.indexOf(columnMapping.credit) : -1;
          const categoryIndex = columnMapping.category ? originalHeaders.indexOf(columnMapping.category) : -1;
          const balanceIndex = columnMapping.balance ? originalHeaders.indexOf(columnMapping.balance) : -1;

          let rawAmount = 0;
          let transactionType: 'inflow' | 'outflow' | null = null;
          
          const amountStr = values[amountIndex] || '';
          const description = values[descIndex] || 'Imported Transaction';
          const category = values[categoryIndex] || categorizeTransaction(description);
          
          if (amountStr) {
            rawAmount = Math.abs(parseAmount(amountStr)); // Always get positive amount first
            
            // Determine if this should be a debit (negative) or credit (positive) based on transaction type
            const isExpense = isExpenseTransaction(description, category);
            
            if (isExpense) {
              transactionType = 'outflow';
              rawAmount = -rawAmount; // Make it negative for expenses
            } else {
              transactionType = 'inflow';
              // Keep it positive for income/sales
            }
          }

          // DEBUG LOG
          console.log(`[DEBUG] Row ${i+1}: Amount String = '${amountStr}', Description = '${description}', Category = '${category}', Is Expense = ${isExpenseTransaction(description, category)}, Final Amount = ${rawAmount}, Type = ${transactionType}`);

          if (transactionType) {
            const date = normalizeDate(values[dateIndex] || '');
            const balance = parseAmount(values[balanceIndex] || '0');

            const transaction: Transaction = {
              id: `imported-${file.name.replace(/[^a-zA-Z0-9]/g, '')}-row-${i}`,
              date: date,
              description: description,
              amount: rawAmount, // Store with correct sign
              type: transactionType,
              category: category,
              balance: balance
            };
            transactions.push(transaction);
          }
        }
        
        console.log('✅ Total transactions parsed:', transactions.length);
        resolve(transactions);

      } catch (error) {
        console.error('❌ CSV parsing error:', error);
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
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

export const parseCSV2 = (file: File): Promise<Transaction[]> => {
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
          let rawAmount = 0;

          if (amountIndex >= 0 && values[amountIndex]) {
            rawAmount = parseAmount(values[amountIndex]);
            amount = rawAmount; // Keep the original sign for calculations
            transactionType = rawAmount >= 0 ? 'inflow' : 'outflow';
          } else if (debitIndex >= 0 && creditIndex >= 0) {
            const debit = parseAmount(values[debitIndex] || '0');
            const credit = parseAmount(values[creditIndex] || '0');

            // Handle cases where both columns might have values
            if (Math.abs(debit) > 0 && Math.abs(credit) > 0) {
              // Use the larger absolute value
              if (Math.abs(debit) > Math.abs(credit)) {
                rawAmount = Math.abs(debit);
                transactionType = 'outflow';
              } else {
                rawAmount = Math.abs(credit);
                transactionType = 'inflow';
              }
            } else if (Math.abs(debit) > 0) {
              rawAmount = Math.abs(debit);
              transactionType = 'outflow';
            } else if (Math.abs(credit) > 0) {
              rawAmount = Math.abs(credit);
              transactionType = 'inflow';
            }
          } else {
            console.log('⚠️ Could not determine amount column from AI mapping, trying to guess from data');
            for (let j = 0; j < values.length; j++) {
              const testAmount = parseAmount(values[j]);
              if (!isNaN(testAmount) && testAmount !== 0) {
                rawAmount = Math.abs(testAmount);
                // Determine transaction type based on description/category
                const description = values[descIndex] || 'Imported transaction';
                const category = values[categoryIndex] || categorizeTransaction(description);
                transactionType = isExpenseTransaction(description, category) ? 'outflow' : 'inflow';
                console.log(`📄 Guessed amount from column ${j}:`, testAmount, 'Type:', transactionType);
                break;
              }
            }
          }

          // Apply correct sign based on transaction type
          if (transactionType === 'outflow') {
            amount = -rawAmount; // Make expenses negative
          } else {
            amount = rawAmount; // Keep income positive
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
            amount: amount, // Store with correct sign (negative for expenses, positive for income)
            type: transactionType,
            category: category,
            balance: balance
          };

          // Validate transaction data
          if (Math.abs(amount) <= 0) {
            console.warn(`⚠️ Transaction ${i} has zero amount:`, transaction);
          }
          
          if (!date || date === new Date().toISOString().split('T')[0]) {
            console.warn(`⚠️ Transaction ${i} has invalid or missing date:`, transaction);
          }

          //console.log(`✅ Created transaction ${i}:`, transaction);
          transactions.push(transaction);
        }

        console.log('✅ Total transactions parsed:', transactions.length);

        // More strict deduplication - only remove exact duplicates
        const uniqueTransactions = transactions.filter((transaction, index, self) => {
          return index === self.findIndex(t =>
            t.date === transaction.date &&
            t.description === transaction.description &&
            t.amount === transaction.amount &&
            t.type === transaction.type &&
            Math.abs(t.balance - transaction.balance) < 0.01 // Allow small floating point differences
          );
        });

        console.log('✅ Unique transactions after deduplication:', uniqueTransactions.length);

        if (uniqueTransactions.length !== transactions.length) {
          console.warn('⚠️ Removed', transactions.length - uniqueTransactions.length, 'duplicate transactions');
          
          // Log some examples of removed duplicates for debugging
          const removed = transactions.filter(t => !uniqueTransactions.includes(t));
          console.log('📄 Sample removed duplicates:', removed.slice(0, 3));
        }

        // Validate transaction flow consistency
        const totalInflows = uniqueTransactions
          .filter(t => t.type === 'inflow')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalOutflows = uniqueTransactions
          .filter(t => t.type === 'outflow')
          .reduce((sum, t) => sum + t.amount, 0);

        const netFlow = totalInflows - totalOutflows;

        console.log('💰 Transaction validation:');
        console.log('💰 Sum of Inflow:', totalInflows.toLocaleString());
        console.log('💰 Sum of Outflow:', totalOutflows.toLocaleString());
        console.log('💰 Net Flow (Inflows - Outflows):', netFlow.toLocaleString());
        console.log('💰 Inflow transactions:', uniqueTransactions.filter(t => t.type === 'inflow').length);
        console.log('💰 Outflow transactions:', uniqueTransactions.filter(t => t.type === 'outflow').length);
        
        // Expected values based on your requirements:
        // Sum of Inflow: 3,297,894
        // Sum of Outflow: 811,099 (stored as positive, displayed as negative)
        // Remaining Balance: 2,486,795
        console.log('💰 Expected: Inflows=3,297,894, Outflows=811,099, Balance=2,486,795');

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

const parseCSVLine2 = (line: string): string[] => {
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

const isExpenseTransaction = (description: string, category: string): boolean => {
  const descriptionLower = (description || '').toLowerCase();
  const categoryLower = (category || '').toLowerCase();

  // Sales/Revenue transactions (should be positive/credits)
  if (descriptionLower.includes('sale') || descriptionLower.includes('pos') ||
      descriptionLower.includes('ubereats') || descriptionLower.includes('square') ||
      descriptionLower.includes('revenue') || descriptionLower.includes('income') ||
      categoryLower.includes('sales') || categoryLower.includes('revenue')) {
    return false; // Not an expense
  }

  // All other transactions are expenses (should be negative/debits)
  return true;
};

const categorizeTransaction = (description: string): string => {
  const descriptionLower = (description || '').toLowerCase();

  if (descriptionLower.includes('sale') || descriptionLower.includes('pos') ||
      descriptionLower.includes('ubereats') || descriptionLower.includes('square payment') ||
      descriptionLower.includes('revenue') || descriptionLower.includes('income')) {
    return 'Sales';
  }

  if (descriptionLower.includes('rent')) {
    return 'Rent';
  }

  if (descriptionLower.includes('utilities') || descriptionLower.includes('electric') ||
      descriptionLower.includes('gas') || descriptionLower.includes('water')) {
    return 'Utilities';
  }

  if (descriptionLower.includes('payroll') || descriptionLower.includes('salary') ||
      descriptionLower.includes('wages')) {
    return 'Payroll';
  }

  if (descriptionLower.includes('marketing') || descriptionLower.includes('advertising')) {
    return 'Marketing';
  }

  if (descriptionLower.includes('equipment') || descriptionLower.includes('repair') ||
      descriptionLower.includes('maintenance') || descriptionLower.includes('cleaning')) {
    return 'Maintenance';
  }

  if (descriptionLower.includes('sysco') || descriptionLower.includes('food') ||
      descriptionLower.includes('farmers market') || descriptionLower.includes('restaurant depot') ||
      descriptionLower.includes('us foods')) {
    return 'Food Supplies';
  }

  if (descriptionLower.includes('license') || descriptionLower.includes('fee')) {
    return 'Miscellaneous';
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
