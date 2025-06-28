const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

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


// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));







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

// Option A: Add the missing endpoint to server.js

// Handle React Router - send index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/auth/') || 
      req.path.startsWith('/oauth/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

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

