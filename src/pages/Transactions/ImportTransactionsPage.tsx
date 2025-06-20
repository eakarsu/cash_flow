import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, AlertCircle } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext.tsx';
import { parseCSV } from '../../utils/csvParser.ts';

const ImportTransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { replaceAllTransactions, resetAppState } = useTransactions();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Log component mount
  React.useEffect(() => {
    console.log('🔥 ImportTransactionsPage mounted');
    console.log('🔥 File input ref on mount:', fileInputRef.current);
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔥🔥🔥 handleFileChange ACTUALLY CALLED!', event);
    console.log('🔥 Event target:', event.target);
    console.log('🔥 Files array:', event.target.files);
    console.log('🔥 Files length:', event.target.files?.length);
    console.log('🔥 File input value:', event.target.value);
    
    const file = event.target.files?.[0];
    console.log('🔥 Selected file object:', file);
    
    if (file) {
      console.log('🔥🔥🔥 FILE FOUND! Name:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // FORCE clear all existing data first
      console.log('🗑️ FORCE clearing all existing transactions before import');
      resetAppState();
      setIsImporting(true);
      setImportResult(null);
      
      try {
        console.log('📁 Starting file import:', file.name, 'Size:', file.size, 'bytes');
        
        const importedTransactions = await parseCSV(file);
        
        if (importedTransactions.length === 0) {
          throw new Error('No valid transactions found in the CSV file');
        }
        
        console.log('✅ Parsed transactions from CSV:', importedTransactions.length);
        
        // Validate transaction count makes sense
        if (importedTransactions.length === 0) {
          throw new Error('No valid transactions found in the CSV file');
        }
        
        // Sort transactions by date (newest first)
        const sortedTransactions = importedTransactions.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        // FORCE replace with ONLY uploaded data
        console.log('🚀 FORCE setting ONLY uploaded transactions:', sortedTransactions.length);
        replaceAllTransactions(sortedTransactions);
        
        setImportResult(`Successfully imported ${importedTransactions.length} transactions. All previous data has been completely replaced.`);
        
        // Auto-navigate back to transactions page after successful import
        setTimeout(() => {
          navigate('/transactions');
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error importing CSV:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setImportResult(`Error importing CSV file: ${errorMessage}. Please check the format and try again.`);
      } finally {
        setIsImporting(false);
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/transactions')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Transactions
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Import Transactions</h1>
          <p className="text-gray-600">Upload a CSV file to import your transaction data</p>
        </div>

        {/* Import Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload CSV File</h3>
            <p className="text-sm text-gray-500 mb-6">
              Select a CSV file containing your transaction data. The file should include columns for date, description, amount, category, and balance.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <button
              onClick={() => {
                console.log('🔥 Button clicked!');
                if (fileInputRef.current) {
                  console.log('🔥 Triggering file input click');
                  fileInputRef.current.click();
                } else {
                  console.error('🔥 File input ref is null!');
                }
              }}
              disabled={isImporting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              <Upload className="h-5 w-5 mr-2" />
              {isImporting ? 'Importing...' : 'Choose File'}
            </button>
          </div>

          {importResult && (
            <div className={`mt-6 p-4 rounded-md ${
              importResult.includes('Error') ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex">
                <AlertCircle className={`h-5 w-5 ${
                  importResult.includes('Error') ? 'text-red-400' : 'text-green-400'
                } mr-2`} />
                <p className={`text-sm ${
                  importResult.includes('Error') ? 'text-red-700' : 'text-green-700'
                }`}>
                  {importResult}
                </p>
              </div>
            </div>
          )}

          {/* CSV Format Guide */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">CSV Format Requirements</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>• <strong>Date:</strong> YYYY-MM-DD format (e.g., 2024-06-15)</p>
              <p>• <strong>Description:</strong> Transaction description</p>
              <p>• <strong>Amount:</strong> Positive for inflows, negative for outflows</p>
              <p>• <strong>Category:</strong> Transaction category</p>
              <p>• <strong>Balance:</strong> Account balance after transaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportTransactionsPage;
