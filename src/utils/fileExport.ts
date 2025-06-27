
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to export CSV');
    }

    // Get the response data (file saved on server)
    const result = await response.json();
    
    console.log(`✅ File saved on server: ${result.filePath}`);
    console.log(`📊 Export summary: ${result.rowCount} rows saved as ${result.filename}`);
    
  } catch (error) {
    console.error('❌ Server export failed:', error);
    throw error;
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
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to export JSON');
    }

    // Get the response data (file saved on server)
    const result = await response.json();
    
    console.log(`✅ File saved on server: ${result.filePath}`);
    console.log(`📊 Export summary: ${result.rowCount} rows saved as ${result.filename}`);
    
  } catch (error) {
    console.error('❌ Server export failed:', error);
    throw error;
  }
};
