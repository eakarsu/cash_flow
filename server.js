
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import dotenv from 'dotenv';
import history from 'connect-history-api-fallback';
import axios from 'axios';
import { Parser } from 'json2csv';
import GenericExcelUploadService from './src/services/GenericExcelUploadService.js';
import FileProcessor from './src/processors/FileProcessor.js';
import DatabaseProcessor from './src/processors/DatabaseProcessor.js';
import QuickBooksProcessor from './src/processors/QuickBooksProcessor.js';
import QuickBooksService from './src/services/QuickBooksService.js';

// Import routers
import contactRouter from './src/api/routes/contact.js';
import exportRouter from './src/api/routes/export.js';

import quickbooksRouter from './src/api/routes/quickbooks.js';
import uploadRouter from './src/api/routes/upload.js';
import transactionsRouter from './src/api/routes/transactions.js';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Load env vars first

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import services and processors

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize services
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


// API routes
app.use('/api/contact', contactRouter);
app.use('/api/export', exportRouter);

app.use('/api/quickbooks', quickbooksRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/transactions', transactionsRouter);

// Debug: Log all registered routes
console.log('🔧 Registered routes:');
console.log('  - /api/contact');
console.log('  - /api/export');
console.log('  - /api/quickbooks');
console.log('  - /api/upload');
console.log('  - /api/transactions');

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

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// Simple catch-all handler for frontend routes (after API routes)
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/auth/') && !req.path.startsWith('/oauth/')) {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  } else {
    // This should not be reached if routes are properly defined
    console.error(`❌ Unmatched API route: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'API endpoint not found', path: req.path });
  }
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

