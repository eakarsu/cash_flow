const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();
const history = require('connect-history-api-fallback'); // <-- add this
const axios = require('axios');
const { Parser } = require('json2csv');
// Import services and processors

const GenericExcelUploadService = require('./src/services/GenericExcelUploadService');
const FileProcessor = require('./src/processors/FileProcessor'); // ← ADD THIS LINE
const DatabaseProcessor = require('./src/processors/DatabaseProcessor');
const QuickBooksProcessor = require('./src/processors/QuickBooksProcessor');
const QuickBooksService = require('./src/services/QuickBooksService');

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize services
const qbService = new QuickBooksService();
let userTokens = {};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Middleware to attach user tokens to requests
app.use((req, res, next) => {
  req.userTokens = userTokens;
  next();
});

// Import routes
const contactRouter = require('./src/api/routes/contact');
const exportRouter = require('./src/api/routes/export');
const authRouter = require('./src/api/routes/auth');
const quickbooksRouter = require('./src/api/routes/quickbooks');
const uploadRouter = require('./src/api/routes/upload');
const transactionsRouter = require('./src/api/routes/transactions');

// API routes
app.use('/api/contact', contactRouter);
app.use('/api/export', exportRouter);
app.use('/auth', authRouter);
app.use('/api/quickbooks', quickbooksRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/transactions', transactionsRouter);



// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'Generic Excel Upload API',
    timestamp: new Date().toISOString(),
    quickbooksConnected: !!userTokens.accessToken,
    uploadEnabled: true
  });
});


// 1. Use history fallback BEFORE static
app.use(
  history({
    // Only rewrite for non-API requests
    rewrites: [
      { from: /^\/api\/.*$/, to: context => context.parsedUrl.path },
      { from: /^\/auth\/.*$/, to: context => context.parsedUrl.path },
      { from: /^\/oauth\/.*$/, to: context => context.parsedUrl.path }
    ]
  })
);

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));


// ==========================================
// HELPER FUNCTIONS
// ==========================================


app.listen(PORT, () => {
  console.log(`🚀 Generic Excel Upload API running on port ${PORT}`);
  console.log(`📁 Generic Upload: http://localhost:${PORT}/api/upload-generic`);
  console.log(`⚙️  Configuration: http://localhost:${PORT}/api/configure-processors`);
  console.log(`📋 Formats Info: http://localhost:${PORT}/api/upload-formats`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

