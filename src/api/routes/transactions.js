const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Parser } = require('json2csv');
const FileProcessor = require('../../processors/FileProcessor');

// Get all transactions from file storage
router.get('/', async (req, res) => {
  try {
    const fileProcessor = new FileProcessor({
      dataDir: './data',
      filename: 'transactions.json'
    });
    
    const transactions = await fileProcessor.getTransactions();
    
    res.json({
      success: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export transactions to CSV
router.get('/export', async (req, res) => {
  try {
    // Fetch real data from your API on Express server
    const response = await axios.get('http://localhost:3001/api/quickbooks/transactions');
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
      category: t.account|| '',
      type: (t.type === 'income' || t.type === 'inflow') ? 'inflow' : 'outflow',
      merchant: t.merchant || '',
      paymentRef: t.paymentRef || '',
      balance: typeof t.balance === 'number' ? t.balance : (t.balance ? parseFloat(t.balance) : ''),

      subcategory: t.subcategory

    }));

    // Define CSV fields
    const fields = [
      { label: 'id', value: 'id' },
      { label: 'date', value: 'date' },
      { label: 'amount', value: 'amount' },
      { label: 'description', value: 'description' },
      { label: 'category', value: 'category' },
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

module.exports = router;
