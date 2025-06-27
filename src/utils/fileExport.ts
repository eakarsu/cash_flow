
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

    // Get the CSV content as blob
    const blob = await response.blob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`✅ File exported via server: ${filename}`);
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

    // Get the JSON content as blob
    const blob = await response.blob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`✅ File exported via server: ${filename}`);
  } catch (error) {
    console.error('❌ Server export failed:', error);
    throw error;
  }
};
