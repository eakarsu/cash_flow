
export interface ExportData {
  [key: string]: any;
}

export const exportToCSV = (data: ExportData[], filename: string = 'transformed_data.csv'): void => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get all unique headers from the data
  const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));
  
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

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export const exportToJSON = (data: ExportData[], filename: string = 'transformed_data.json'): void => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
import { Transaction } from '../types';

export const exportToCSV = (transactions: Transaction[], filename: string = 'transactions.csv') => {
  const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Balance'];
  const csvContent = [
    headers.join(','),
    ...transactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`, // Escape quotes in description
      t.amount,
      t.type,
      `"${t.category.replace(/"/g, '""')}"`, // Escape quotes in category
      t.balance || ''
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
  
  console.log(`✅ File exported: ${filename}`);
};

export const exportToJSON = (transactions: Transaction[], filename: string = 'transactions.json') => {
  const jsonContent = JSON.stringify(transactions, null, 2);
  
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`✅ File exported: ${filename}`);
};

export const exportTransformedDataToCSV = (data: any[], filename: string = 'transformed_data.csv') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle strings with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
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
  
  console.log(`✅ Transformed data exported: ${filename}`);
};
