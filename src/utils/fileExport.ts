
export interface ExportData {
  [key: string]: any;
}

export const exportToCSV = (data: ExportData[], filename: string = 'transformed_data.csv'): void => {
  if (!data || data.length === 0) {
    console.error('❌ No data to export');
    throw new Error('No data to export');
  }

  console.log(`📁 Starting CSV export: ${filename} with ${data.length} rows`);

  // Get all unique headers from the data
  const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));
  console.log(`📁 CSV headers: ${headers.join(', ')}`);
  
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

  console.log(`📁 CSV content length: ${csvContent.length} characters`);

  // Simple file download
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log(`✅ File saved: ${filename}`);
};

export const exportToJSON = (data: ExportData[], filename: string = 'transformed_data.json'): void => {
  if (!data || data.length === 0) {
    console.error('❌ No data to export');
    throw new Error('No data to export');
  }

  console.log(`📁 Starting JSON export: ${filename} with ${data.length} rows`);

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    
    console.log(`📁 Triggering download for: ${filename}`);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`✅ File exported successfully: ${filename}`);
  } else {
    console.error('❌ Browser does not support file downloads');
    throw new Error('Browser does not support file downloads');
  }
};
