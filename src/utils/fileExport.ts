
export interface ExportData {
  [key: string]: any;
}

export const exportToCSV = async (data: ExportData[], filename: string = 'transformed_data.csv'): Promise<void> => {
  if (!data || data.length === 0) {
    console.error('❌ No data to export');
    throw new Error('No data to export');
  }

  console.log(`📁 Starting server-side CSV export: ${filename} with ${data.length} rows`);

  try {
    const response = await fetch('/api/export/csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        filename
      })
    });

    if (!response.ok) {
      // Check if response is HTML (server error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('❌ Server returned HTML instead of JSON - likely server not running or route not found');
        throw new Error('Server export service unavailable. Check if server is running.');
      }
      
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export CSV');
      } catch (parseError) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    // Get the response data (file saved on server)
    const result = await response.json();
    
    console.log(`✅ File saved on server: ${result.filePath}`);
    console.log(`📊 Export summary: ${result.rowCount} rows saved as ${result.filename}`);
    
  } catch (error) {
    console.error('❌ Server export failed:', error);
    
    // Fallback to client-side export if server fails
    console.log('🔄 Falling back to client-side export...');
    try {
      const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`✅ File exported via client fallback: ${filename}`);
    } catch (fallbackError) {
      console.error('❌ Client fallback also failed:', fallbackError);
      throw error; // Throw original server error
    }
  }
};

export const exportToJSON = async (data: ExportData[], filename: string = 'transformed_data.json'): Promise<void> => {
  if (!data || data.length === 0) {
    console.error('❌ No data to export');
    throw new Error('No data to export');
  }

  console.log(`📁 Starting server-side JSON export: ${filename} with ${data.length} rows`);

  try {
    const response = await fetch('/api/export/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        filename
      })
    });

    if (!response.ok) {
      // Check if response is HTML (server error page)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('❌ Server returned HTML instead of JSON - likely server not running or route not found');
        throw new Error('Server export service unavailable. Check if server is running.');
      }
      
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export JSON');
      } catch (parseError) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    // Get the response data (file saved on server)
    const result = await response.json();
    
    console.log(`✅ File saved on server: ${result.filePath}`);
    console.log(`📊 Export summary: ${result.rowCount} rows saved as ${result.filename}`);
    
  } catch (error) {
    console.error('❌ Server export failed:', error);
    
    // Fallback to client-side export if server fails
    console.log('🔄 Falling back to client-side export...');
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log(`✅ File exported via client fallback: ${filename}`);
    } catch (fallbackError) {
      console.error('❌ Client fallback also failed:', fallbackError);
      throw error; // Throw original server error
    }
  }
};
