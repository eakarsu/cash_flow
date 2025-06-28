const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const GenericExcelUploadService = require('../../services/GenericExcelUploadService');
const FileProcessor = require('../../processors/FileProcessor');
const DatabaseProcessor = require('../../processors/DatabaseProcessor');
const QuickBooksProcessor = require('../../processors/QuickBooksProcessor');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Generic Excel upload endpoint
router.post('/generic', upload.single('transactionFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please select an Excel (.xlsx, .xls) or CSV file'
      });
    }

    console.log(`Processing generic upload: ${req.file.originalname}`);

    // Configure the generic service
    const uploadService = new GenericExcelUploadService({
      validation: {
        requireDate: true,
        requireDescription: true,
        requireAmount: true,
        allowNegativeAmounts: true
      }
    });

    // Add processors based on request parameters
    const { processors = 'file' } = req.body;
    const processorList = processors.split(',');

    if (processorList.includes('file')) {
      const fileProcessor = new FileProcessor({ 
        dataDir: './data',
        filename: 'transactions.json'
      });
      uploadService.addProcessor(fileProcessor);
    }

    if (processorList.includes('database')) {
      const dbProcessor = new DatabaseProcessor({
        tableName: 'transactions',
        dbPath: './data/cashflow.db'
      });
      uploadService.addProcessor(dbProcessor);
    }

    if (processorList.includes('quickbooks') && req.userTokens?.accessToken) {
      const qbProcessor = new QuickBooksProcessor(
        req.userTokens.accessToken,
        req.userTokens.refreshToken,
        req.userTokens.realmId
      );
      uploadService.addProcessor(qbProcessor);
    }

    // Process the file
    const results = await uploadService.processUpload(req.file.path);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'File processed successfully!',
      data: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        totalProcessed: results.totalProcessed,
        successfulProcessors: results.successfulProcessors,
        processorResults: results.processorResults,
        errors: results.errors.length,
        errorDetails: results.errors.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('Generic upload processing error:', error);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: error.message,
      details: 'Failed to process uploaded file'
    });
  }
});

// Configuration endpoint to set up processors
router.post('/configure-processors', (req, res) => {
  const { columnMappings, processors } = req.body;
  
  res.json({
    success: true,
    message: 'Processors configured successfully',
    configuration: {
      columnMappings,
      processors,
      timestamp: new Date().toISOString()
    }
  });
});

// Get supported file formats and configurations
router.get('/formats', (req, res) => {
  res.json({
    success: true,
    data: {
      supportedFormats: ['.xlsx', '.xls', '.csv'],
      maxFileSize: '10MB',
      availableProcessors: [
        {
          name: 'database',
          description: 'Save to database',
          required: false
        },
        {
          name: 'quickbooks',
          description: 'Sync to QuickBooks',
          required: req.userTokens?.accessToken ? false : true,
          requiresAuth: true
        }
      ],
      columnMappings: {
        required: ['date', 'amount'],
        optional: ['description', 'category', 'reference'],
        supportedDateFormats: ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY']
      },
      sampleData: {
        'Date': '2024-06-01',
        'Description': 'Monthly Rent',
        'Amount': '-2500'
      }
    }
  });
});

module.exports = router;
