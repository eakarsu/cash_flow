import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create exports directory if it doesn't exist
const exportsDir = path.join(__dirname, '../../exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
  console.log(`📁 Created exports directory: ${exportsDir}`);
}

// Export data to CSV
router.post('/csv', (req, res) => {
  try {
    const { data, filename = 'export.csv' } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'No data provided for export' });
    }

    console.log(`📁 Server: Starting CSV export for ${filename} with ${data.length} rows`);

    // Get all unique headers from the data
    const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));
    console.log(`📁 Server: CSV headers: ${headers.join(', ')}`);
    
    // Create CSV content
    const csvContent = [
      // Header row
      headers.join(','),
      // Data rows
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape values that contain commas, quotes, or newlines
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    console.log(`📁 Server: CSV content length: ${csvContent.length} characters`);

    // Save file to local file system
    const filePath = path.join(exportsDir, filename);
    fs.writeFileSync(filePath, csvContent, 'utf8');
    
    console.log(`✅ Server: CSV file saved to local filesystem: ${filePath}`);

    // Return success response with file path
    res.json({ 
      success: true, 
      message: 'CSV file saved successfully',
      filename: filename,
      filePath: filePath,
      rowCount: data.length
    });

  } catch (error) {
    console.error('❌ Server: CSV export error:', error);
    res.status(500).json({ error: 'Failed to export CSV', details: error.message });
  }
});

// Export data to JSON
router.post('/json', (req, res) => {
  try {
    const { data, filename = 'export.json' } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: 'No data provided for export' });
    }

    console.log(`📁 Server: Starting JSON export for ${filename} with ${data.length} rows`);

    const jsonContent = JSON.stringify(data, null, 2);

    // Save file to local file system
    const filePath = path.join(exportsDir, filename);
    fs.writeFileSync(filePath, jsonContent, 'utf8');
    
    console.log(`✅ Server: JSON file saved to local filesystem: ${filePath}`);

    // Return success response with file path
    res.json({ 
      success: true, 
      message: 'JSON file saved successfully',
      filename: filename,
      filePath: filePath,
      rowCount: data.length
    });

  } catch (error) {
    console.error('❌ Server: JSON export error:', error);
    res.status(500).json({ error: 'Failed to export JSON', details: error.message });
  }
});

export default router

