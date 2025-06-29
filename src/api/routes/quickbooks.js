import express from 'express';
import QuickBooksService from '../../services/QuickBooksService.js';
import { Parser } from 'json2csv';
import FileProcessor from '../../processors/FileProcessor.js';
import 'dotenv/config'
import axios from 'axios';
import QuickBooks from 'node-quickbooks';
import { Transaction } from '../types';
const router = express.Router();


import { API_ENDPOINTS,  apiCall,API_BASE_URL } from '../../config/api.ts';

// Initialize services
const qbService = new QuickBooksService();
let userTokens = {};


// QuickBooks Authorization endpoint
router.get('/auth', async (req, res) => {
  console.log('🎯 QuickBooks /auth route hit!');
  console.log('📍 Request path:', req.path);
  console.log('📍 Request method:', req.method);
  
  try {
    const authUri = qbService.getAuthUri();
    console.log('✅ Generated auth URI successfully');
    
    res.json({ 
      success: true,
      authUri: authUri,
      message: 'Visit this URL to authorize QuickBooks access'
    });
  } catch (error) {
    console.error('❌ Error in QuickBooks auth route:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/callback', async (req, res) => {
  try {
    const tokenData = await qbService.handleCallback(req.url);
    userTokens = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      realmId: tokenData.realmId
    };
    
    res.json({ 
      success: true, 
      message: 'QuickBooks connected successfully! You can now upload transaction files.',
      realmId: tokenData.realmId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get all transactions (combined view)
router.get('/transactions', async (req, res) => {
  try {
    if (!userTokens.accessToken) {
      return res.status(401).json({
        error: 'QuickBooks not connected',
        message: 'Please authenticate with QuickBooks first'
      });
    }

    
    const qbo = new QuickBooks(
      process.env.QB_CLIENT_ID,
      process.env.QB_CLIENT_SECRET,
      userTokens.accessToken,
      false,
      userTokens.realmId,
      process.env.NODE_ENV !== 'production',
      true,
      null,
      '2.0',
      userTokens.refreshToken
    );

    console.log('🔍 Fetching transactions from QuickBooks...');

    // Get all transaction types
    const [purchases, journalEntries] = await Promise.all([
      getPurchases(qbo),
      getJournalEntries(qbo)
    ]);

    console.log(`📊 Retrieved: ${purchases.length} purchases, ${journalEntries.length} journal entries`);

    // Transform purchases (expenses) with subcategory extraction
    const expenseTransactions = purchases.map(purchase => {
      const line = purchase.Line?.[0] || {};
      const description = line.Description || 'No description';
      
      // Extract subcategory from brackets like "Banking fee [Bank Fees]"
      const subcategoryMatch = description.match(/\[(.*?)\]$/);
      const subcategory = subcategoryMatch ? subcategoryMatch[1] : null;
      const cleanDescription = description.replace(/\s*\[.*?\]$/, '');

      return {
        id: purchase.Id,
        date: purchase.TxnDate,
        type: 'expense',
        subType: 'purchase',
        amount: -(purchase.TotalAmt || 0),
        description: cleanDescription,
        subcategory: subcategory,
        category: line.AccountBasedExpenseLineDetail?.AccountRef?.name || 'Unknown',
        account: line.AccountBasedExpenseLineDetail?.AccountRef?.name || 'Unknown',
        quickbooksId: purchase.Id,
        metadata: {
          syncToken: purchase.SyncToken,
          lastUpdated: purchase.MetaData?.LastUpdatedTime
        }
      };
    });

    // Transform journal entries (income) with subcategory extraction
    const incomeTransactions = journalEntries.map(entry => {
      const line = entry.Line?.[0] || {};
      const description = line.Description || 'No description';
      
      // Extract subcategory from brackets
      const subcategoryMatch = description.match(/\[(.*?)\]$/);
      const subcategory = subcategoryMatch ? subcategoryMatch[1] : null;
      const cleanDescription = description.replace(/\s*\[.*?\]$/, '');

      return {
        id: entry.Id,
        date: entry.TxnDate,
        type: 'income',
        subType: 'journal_entry',
        amount: entry.Line?.find(l => l.JournalEntryLineDetail?.PostingType === 'Credit')?.Amount || 0,
        description: cleanDescription,
        subcategory: subcategory,
        category: 'Sales',
        account: entry.Line?.find(l => l.JournalEntryLineDetail?.PostingType === 'Credit')?.JournalEntryLineDetail?.AccountRef?.name || 'Sales',
        quickbooksId: entry.Id,
        metadata: {
          syncToken: entry.SyncToken,
          lastUpdated: entry.MetaData?.LastUpdatedTime
        }
      };
    });

    const allTransactions = [...expenseTransactions, ...incomeTransactions];
    
    // Sort by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate summary
    const expenses = allTransactions.filter(t => t.type === 'expense');
    const income = allTransactions.filter(t => t.type === 'income');
    const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

    console.log(`✅ Returning ${allTransactions.length} transactions with subcategories`);

    res.json({
      success: true,
      data: {
        transactions: allTransactions,
        summary: {
          total: allTransactions.length,
          expenses: expenses.length,
          income: income.length,
          totalIncome,
          totalExpenses,
          netCashFlow: totalIncome - totalExpenses
        }
      }
    });

  } catch (error) {
    console.error('Error fetching QuickBooks transactions:', error);
    res.status(500).json({
      error: error.message,
      details: 'Failed to fetch transactions from QuickBooks'
    });
  }
});

// Get expenses only
router.get('/expenses', async (req, res) => {
  try {
    if (!userTokens.accessToken) {
      return res.status(401).json({ 
        error: 'QuickBooks not connected'
      });
    }

    const QuickBooks = require('node-quickbooks');
    const qbo = new QuickBooks(
      process.env.QB_CLIENT_ID,
      process.env.QB_CLIENT_SECRET,
      userTokens.accessToken,
      false,
      userTokens.realmId,
      process.env.NODE_ENV !== 'production',
      true,
      null,
      '2.0',
      userTokens.refreshToken
    );

    const purchases = await getPurchases(qbo);

    res.json({
      success: true,
      data: {
        expenses: purchases.map(p => ({
          id: p.Id,
          date: p.TxnDate,
          amount: parseFloat(p.TotalAmt),
          description: p.Line?.[0]?.Description || 'Expense',
          account: p.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || 'Unknown',
          paymentType: p.PaymentType,
          quickbooksId: p.Id
        })),
        total: purchases.length,
        totalAmount: purchases.reduce((sum, p) => sum + parseFloat(p.TotalAmt), 0)
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get income only  
router.get('/income', async (req, res) => {
  try {
    if (!userTokens.accessToken) {
      return res.status(401).json({ 
        error: 'QuickBooks not connected'
      });
    }

    const QuickBooks = require('node-quickbooks');
    const qbo = new QuickBooks(
      process.env.QB_CLIENT_ID,
      process.env.QB_CLIENT_SECRET,
      userTokens.accessToken,
      false,
      userTokens.realmId,
      process.env.NODE_ENV !== 'production',
      true,
      null,
      '2.0',
      userTokens.refreshToken
    );

    const [journalEntries, salesReceipts] = await Promise.all([
      getJournalEntries(qbo),
      getSalesReceipts(qbo)
    ]);

    const incomeTransactions = [
      ...journalEntries.map(j => {
        const debitLine = j.Line?.find(line => 
          line.JournalEntryLineDetail?.PostingType === 'Debit' &&
          line.JournalEntryLineDetail?.AccountRef?.name === 'Undeposited Funds'
        );
        return debitLine ? {
          id: j.Id,
          date: j.TxnDate,
          amount: parseFloat(debitLine.Amount),
          description: debitLine.Description || 'Income',
          type: 'journal_entry',
          quickbooksId: j.Id
        } : null;
      }).filter(Boolean),
      ...salesReceipts.map(s => ({
        id: s.Id,
        date: s.TxnDate,
        amount: parseFloat(s.TotalAmt),
        description: s.Line?.[0]?.Description || 'Sale',
        type: 'sales_receipt',
        quickbooksId: s.Id
      }))
    ];

    res.json({
      success: true,
      data: {
        income: incomeTransactions,
        total: incomeTransactions.length,
        totalAmount: incomeTransactions.reduce((sum, i) => sum + i.amount, 0)
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all transactions
router.delete('/transactions/all', async (req, res) => {
  try {
    if (!userTokens.accessToken) {
      return res.status(401).json({
        error: 'QuickBooks not connected',
        message: 'Please authenticate with QuickBooks first'
      });
    }

    const QuickBooks = require('node-quickbooks');
    const qbo = new QuickBooks(
      process.env.QB_CLIENT_ID,
      process.env.QB_CLIENT_SECRET,
      userTokens.accessToken,
      false,
      userTokens.realmId,
      process.env.NODE_ENV !== 'production',
      true,
      null,
      '2.0',
      userTokens.refreshToken
    );

    console.log('🗑️ Starting bulk deletion of all QuickBooks transactions...');

    // Get all transaction types
    const [purchases, journalEntries, salesReceipts] = await Promise.all([
      getPurchases(qbo),
      getJournalEntries(qbo),
      getSalesReceipts(qbo)
    ]);

    const deleteResults = {
      totalFound: 0,
      totalDeleted: 0,
      failed: 0,
      errors: [],
      details: {
        purchases: { found: 0, deleted: 0, failed: 0 },
        journalEntries: { found: 0, deleted: 0, failed: 0 },
        salesReceipts: { found: 0, deleted: 0, failed: 0 }
      }
    };

    deleteResults.totalFound = purchases.length + journalEntries.length + salesReceipts.length;

    console.log(`📊 Found ${deleteResults.totalFound} transactions to delete`);

    // Delete Purchases (Expenses)
    deleteResults.details.purchases.found = purchases.length;
    for (const purchase of purchases) {
      try {
        await deletePurchase(qbo, purchase.Id, purchase.SyncToken);
        deleteResults.details.purchases.deleted++;
        deleteResults.totalDeleted++;
        console.log(`✅ Deleted Purchase: ${purchase.Id} - $${purchase.TotalAmt}`);
      } catch (error) {
        deleteResults.details.purchases.failed++;
        deleteResults.failed++;
        deleteResults.errors.push({
          type: 'Purchase',
          id: purchase.Id,
          error: error.message
        });
        console.error(`❌ Failed to delete Purchase ${purchase.Id}:`, error.message);
      }
    }

    // Delete Journal Entries (Income)
    deleteResults.details.journalEntries.found = journalEntries.length;
    for (const journalEntry of journalEntries) {
      try {
        await deleteJournalEntry(qbo, journalEntry.Id, journalEntry.SyncToken);
        deleteResults.details.journalEntries.deleted++;
        deleteResults.totalDeleted++;
        console.log(`✅ Deleted Journal Entry: ${journalEntry.Id}`);
      } catch (error) {
        deleteResults.details.journalEntries.failed++;
        deleteResults.failed++;
        deleteResults.errors.push({
          type: 'JournalEntry',
          id: journalEntry.Id,
          error: error.message
        });
        console.error(`❌ Failed to delete Journal Entry ${journalEntry.Id}:`, error.message);
      }
    }

    // Delete Sales Receipts
    deleteResults.details.salesReceipts.found = salesReceipts.length;
    for (const salesReceipt of salesReceipts) {
      try {
        await deleteSalesReceipt(qbo, salesReceipt.Id, salesReceipt.SyncToken);
        deleteResults.details.salesReceipts.deleted++;
        deleteResults.totalDeleted++;
        console.log(`✅ Deleted Sales Receipt: ${salesReceipt.Id} - $${salesReceipt.TotalAmt}`);
      } catch (error) {
        deleteResults.details.salesReceipts.failed++;
        deleteResults.failed++;
        deleteResults.errors.push({
          type: 'SalesReceipt',
          id: salesReceipt.Id,
          error: error.message
        });
        console.error(`❌ Failed to delete Sales Receipt ${salesReceipt.Id}:`, error.message);
      }
    }

    console.log(`🎯 Deletion complete: ${deleteResults.totalDeleted}/${deleteResults.totalFound} transactions deleted`);

    res.json({
      success: true,
      message: `Successfully deleted ${deleteResults.totalDeleted} out of ${deleteResults.totalFound} transactions`,
      data: deleteResults
    });

  } catch (error) {
    console.error('Error deleting all transactions:', error);
    res.status(500).json({
      error: error.message,
      details: 'Failed to delete all transactions'
    });
  }
});

// Delete with confirmation endpoint (safer)
router.post('/transactions/delete-all-confirm', async (req, res) => {
  try {
    const { confirmPhrase } = req.body;
    
    // Require confirmation phrase for safety
    if (confirmPhrase !== 'DELETE ALL TRANSACTIONS') {
      return res.status(400).json({
        error: 'Invalid confirmation phrase',
        message: 'Please provide the exact confirmation phrase: "DELETE ALL TRANSACTIONS"'
      });
    }

    // Call the delete endpoint internally
    const deleteRequest = await axios.delete('/api/quickbooks/transactions/all');
    res.json(deleteRequest.data);

  } catch (error) {
    console.error('Error in confirmed deletion:', error);
    res.status(500).json({
      error: error.message,
      details: 'Failed to delete all transactions'
    });
  }
});

router.get('/export', async (req, res) => {
  try {
    console.log('export called');
    const format = req.query.format || 'csv'; // Default to CSV for backward compatibility
    
    // Fetch real data from your API on Express server
    const response = await axios.get(API_ENDPOINTS.QUICKBOOKS.TRANSACTIONS);
    if (!response.data || !response.data.data || !response.data.data.transactions) {
      return res.status(500).json({ error: 'Invalid transactions data' });
    }

    const rawTransactions = response.data.data.transactions;
    // Ensure rawTransactions is an array
    if (!Array.isArray(rawTransactions)) {
      return res.status(500).json({ error: 'Transactions data is not an array' });
    }

    // Transform to Transaction interface
    const transformed = rawTransactions.map(t => ({
      id: t.id || '',
      date: t.date || '',
      amount: typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0,
      description: t.description || '',
      category: t.account || '',
      subcategory: t.subcategory || '',
      type: (t.type === 'income' || t.type === 'inflow') ? 'inflow' : 'outflow',
      merchant: t.merchant || '',
      paymentRef: t.paymentRef || '',
      balance: typeof t.balance === 'number' ? t.balance : (t.balance ? parseFloat(t.balance) : ''),
    }));

    // Return JSON format if requested
    if (format === 'json') {
      return res.json({
        success: true,
        data: {
          transactions: transformed,
          count: transformed.length,
          summary: {
            totalInflow: transformed.filter(t => t.type === 'inflow').reduce((sum, t) => sum + t.amount, 0),
            totalOutflow: transformed.filter(t => t.type === 'outflow').reduce((sum, t) => sum + Math.abs(t.amount), 0),
            netCashFlow: transformed.reduce((sum, t) => sum + t.amount, 0)
          }
        }
      });
    }

    // Default CSV format
    const fields = [
      { label: 'id', value: 'id' },
      { label: 'date', value: 'date' },
      { label: 'amount', value: 'amount' },
      { label: 'description', value: 'description' },
      { label: 'category', value: 'category' },
      { label: 'subcategory', value: 'subcategory' },
      { label: 'type', value: 'type' },
      { label: 'merchant', value: 'merchant' },
      { label: 'paymentRef', value: 'paymentRef' },
      { label: 'balance', value: 'balance' }
    ];

    // Create CSV parser
    const parser = new Parser({ fields });
    const csv = parser.parse(transformed);

    // Set headers for CSV download
    res.header('Content-Type', 'text/csv');
    res.attachment('exported_transactions.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({ error: error.message });
  }
});


// Helper functions
async function getPurchases(qbo) {
  return new Promise((resolve, reject) => {
    qbo.findPurchases({}, (err, purchases) => {
      if (err) {
        console.error('Error fetching purchases:', err);
        reject(err);
      } else {
        const purchaseList = purchases.QueryResponse?.Purchase || [];
        console.log(`📊 Found ${purchaseList.length} purchase transactions`);
        resolve(purchaseList);
      }
    });
  });
}

async function getJournalEntries(qbo) {
  return new Promise((resolve, reject) => {
    qbo.findJournalEntries({}, (err, journalEntries) => {
      if (err) {
        console.error('Error fetching journal entries:', err);
        reject(err);
      } else {
        const journalList = journalEntries.QueryResponse?.JournalEntry || [];
        console.log(`📊 Found ${journalList.length} journal entry transactions`);
        resolve(journalList);
      }
    });
  });
}

async function getSalesReceipts(qbo) {
  return new Promise((resolve, reject) => {
    qbo.findSalesReceipts({}, (err, receipts) => {
      if (err) reject(err);
      else resolve(receipts.QueryResponse?.SalesReceipt || []);
    });
  });
}

async function deletePurchase(qbo, id, syncToken) {
  return new Promise((resolve, reject) => {
    const purchaseToDelete = {
      Id: id,
      SyncToken: syncToken
    };
    
    qbo.deletePurchase(purchaseToDelete, (err, result) => {
      if (err) {
        reject(new Error(`Delete Purchase failed: ${err.Fault?.Error?.[0]?.Detail || err.message}`));
      } else {
        resolve(result);
      }
    });
  });
}

async function deleteJournalEntry(qbo, id, syncToken) {
  return new Promise((resolve, reject) => {
    const journalEntryToDelete = {
      Id: id,
      SyncToken: syncToken
    };
    
    qbo.deleteJournalEntry(journalEntryToDelete, (err, result) => {
      if (err) {
        reject(new Error(`Delete Journal Entry failed: ${err.Fault?.Error?.[0]?.Detail || err.message}`));
      } else {
        resolve(result);
      }
    });
  });
}

async function deleteSalesReceipt(qbo, id, syncToken) {
  return new Promise((resolve, reject) => {
    const salesReceiptToDelete = {
      Id: id,
      SyncToken: syncToken
    };
    
    qbo.deleteSalesReceipt(salesReceiptToDelete, (err, result) => {
      if (err) {
        reject(new Error(`Delete Sales Receipt failed: ${err.Fault?.Error?.[0]?.Detail || err.message}`));
      } else {
        resolve(result);
      }
    });
  });
}

export default router;

