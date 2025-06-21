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
        
        console.log('📄 CSV file has', lines.length, 'lines');
        console.log('📄 Header line:', lines[0]);
        console.log('📄 First data line:', lines[1]);
        
        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/"/g, ''));
        console.log('📄 Parsed headers:', headers);
        console.log('📄 Header count:', headers.length);
        console.log('📄 Individual headers:');
        headers.forEach((header, index) => {
          console.log(`📄   [${index}]: "${header}"`);
        });
        
        const transactions: Transaction[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          
          if (values.length < 3) {
            console.log('⚠️ Skipping incomplete row', i, ':', values);
            continue;
          }
          
          console.log(`📄 Row ${i} values:`, values);
          
          // Try to find common column patterns with more variations
          const dateIndex = findColumnIndex(headers, [
            'date', 'transaction date', 'trans date', 'posting date', 'post date', 
            'effective date', 'value date', 'settlement date'
          ]);
          const descIndex = findColumnIndex(headers, [
            'description', 'desc', 'memo', 'details', 'merchant name', 'payee', 
            'reference', 'transaction description', 'narrative', 'particulars'
          ]);
          const amountIndex = findColumnIndex(headers, [
            'amount', 'transaction amount', 'net amount', 'value', 'sum', 
            'transaction value', 'net value'
          ]);
          const debitIndex = findColumnIndex(headers, [
            'debit', 'debit amount', 'withdrawal', 'withdrawals', 'outgoing', 
            'debit value', 'dr', 'out'
          ]);
          const creditIndex = findColumnIndex(headers, [
            'credit', 'credit amount', 'deposit', 'deposits', 'incoming', 
            'credit value', 'cr', 'in'
          ]);
          const categoryIndex = findColumnIndex(headers, [
            'category', 'type', 'transaction type', 'classification', 'class', 
            'expense type', 'income type'
          ]);
          const balanceIndex = findColumnIndex(headers, [
            'balance', 'running balance', 'account balance', 'current balance', 
            'available balance', 'closing balance'
          ]);
          
          console.log(`📄 Column indices for row ${i}:`);
          console.log(`📄   Date: ${dateIndex} (${dateIndex >= 0 ? headers[dateIndex] : 'not found'})`);
          console.log(`📄   Description: ${descIndex} (${descIndex >= 0 ? headers[descIndex] : 'not found'})`);
          console.log(`📄   Amount: ${amountIndex} (${amountIndex >= 0 ? headers[amountIndex] : 'not found'})`);
          console.log(`📄   Debit: ${debitIndex} (${debitIndex >= 0 ? headers[debitIndex] : 'not found'})`);
          console.log(`📄   Credit: ${creditIndex} (${creditIndex >= 0 ? headers[creditIndex] : 'not found'})`);
          console.log(`📄   Category: ${categoryIndex} (${categoryIndex >= 0 ? headers[categoryIndex] : 'not found'})`);
          console.log(`📄   Balance: ${balanceIndex} (${balanceIndex >= 0 ? headers[balanceIndex] : 'not found'})`);
          
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
            // Try to guess from the data structure
            console.log('⚠️ Could not determine amount column, trying to guess from data');
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
          
          // Get description
          let description = 'Imported transaction';
          if (descIndex >= 0 && values[descIndex]) {
            description = values[descIndex].replace(/"/g, '').trim();
          } else {
            // Try to find a text field that looks like a description
            for (let j = 0; j < values.length; j++) {
              const value = values[j]?.replace(/"/g, '').trim();
              if (value && value.length > 3 && isNaN(parseFloat(value)) && !value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                description = value;
                break;
              }
            }
          }
          
          // Get category
          let category = categorizeTransaction(description);
          if (categoryIndex >= 0 && values[categoryIndex]) {
            category = values[categoryIndex].replace(/"/g, '').trim();
          }
          
          // Get date
          let date = new Date().toISOString().split('T')[0];
          if (dateIndex >= 0 && values[dateIndex]) {
            date = normalizeDate(values[dateIndex]);
          }
          
          // Get balance
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
          
          console.log(`✅ Created transaction ${i}:`, transaction);
          transactions.push(transaction);
        }
        
        console.log('✅ Total transactions parsed:', transactions.length);
        
        // Remove duplicates based on multiple criteria
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
        
        // Final validation - ensure we don't have an unreasonable number of transactions
        const expectedMax = lines.length - 1; // Subtract header row
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

const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
  console.log('🔍 Looking for columns:', possibleNames, 'in headers:', headers);
  
  for (const name of possibleNames) {
    const index = headers.findIndex(h => {
      const headerLower = h.toLowerCase().trim();
      const nameLower = name.toLowerCase().trim();
      
      // Exact match
      if (headerLower === nameLower) {
        console.log('✅ Exact match found:', name, 'at index', index);
        return true;
      }
      
      // Contains match
      if (headerLower.includes(nameLower)) {
        console.log('✅ Contains match found:', name, 'in', headerLower, 'at index', index);
        return true;
      }
      
      // Partial word match (for things like "trans date" matching "date")
      const headerWords = headerLower.split(/\s+/);
      const nameWords = nameLower.split(/\s+/);
      
      for (const nameWord of nameWords) {
        if (headerWords.some(headerWord => headerWord.includes(nameWord) || nameWord.includes(headerWord))) {
          console.log('✅ Word match found:', name, 'in', headerLower, 'at index', index);
          return true;
        }
      }
      
      return false;
    });
    
    if (index >= 0) {
      console.log('✅ Found', name, 'at index', index);
      return index;
    }
  }
  
  console.log('❌ No matching column found for:', possibleNames);
  console.log('❌ Available headers:', headers);
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
