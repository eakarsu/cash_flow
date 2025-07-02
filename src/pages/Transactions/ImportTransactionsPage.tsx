import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, AlertCircle, Download, Wand2, Eye } from 'lucide-react';
import { useTransactions } from '../../context/TransactionContext';
import { parseCSV } from '../../utils/csvParser';
import AIColumnMappingService, { DataTransformation, TransformedData } from '../../services/aiColumnMappingService';
import { exportToCSV, exportToJSON } from '../../utils/fileExport';

const ImportTransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { replaceAllTransactions, resetAppState } = useTransactions();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [transformedData, setTransformedData] = useState<TransformedData | null>(null);
  const [suggestedTransformations, setSuggestedTransformations] = useState<DataTransformation[]>([]);
  const [selectedTransformations, setSelectedTransformations] = useState<string[]>([]);
  const [rawData, setRawData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [enableAI, setEnableAI] = useState(false); // ✅ ADD: AI toggle
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Log component mount
  React.useEffect(() => {
    console.log('🔥 ImportTransactionsPage mounted');
    console.log('🔥 File input ref on mount:', fileInputRef.current);
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🚨🚨🚨 IMPORT TRANSACTIONS PAGE handleFileChange CALLED!!! 🚨🚨🚨');
    console.log('🔥🔥🔥 handleFileChange ACTUALLY CALLED!', event);
    console.log('🔥 Event target:', event.target);
    console.log('🔥 Files array:', event.target.files);
    console.log('🔥 Files length:', event.target.files?.length);
    console.log('🔥 File input value:', event.target.value);
    
    const file = event.target.files?.[0];
    console.log('🔥 Selected file object:', file);
    
    if (file) {
      console.log('🔥🔥🔥 FILE FOUND! Name:', file.name, 'Size:', file.size, 'Type:', file.type);
      setIsImporting(true);
      setImportResult(null);
      
      try {
        console.log('📁 Starting file import:', file.name, 'Size:', file.size, 'bytes');
        
        const importedTransactions = await parseCSV(file);
        
        if (importedTransactions.length === 0) {
          throw new Error('No valid transactions found in the CSV file');
        }
        
        console.log('✅ Parsed transactions from CSV:', importedTransactions.length);
        
        // IMMEDIATELY replace all transactions with the new imported ones
        console.log('🔄 IMMEDIATELY replacing all transactions with imported data');
        replaceAllTransactions(importedTransactions);
        
        // Store raw data for transformation
        setRawData(importedTransactions);
        
        // ✅ IMPROVED: Only get AI suggestions if enabled, don't auto-apply
        if (enableAI) {
          try {
            console.log('🤖 Getting AI transformation suggestions...');
            const aiService = new AIColumnMappingService();
            const headers = Object.keys(importedTransactions[0] || {});
            const suggestions = await aiService.suggestDataTransformations(importedTransactions, headers);
            setSuggestedTransformations(suggestions.transformations);
            setImportResult(`Successfully imported ${importedTransactions.length} transactions. ${suggestions.transformations.length} AI transformations suggested. Choose which ones to apply below.`);
          } catch (aiError) {
            console.warn('AI transformation suggestions failed:', aiError);
            setImportResult(`Successfully imported ${importedTransactions.length} transactions. AI transformations not available.`);
          }
        } else {
          setImportResult(`Successfully imported ${importedTransactions.length} transactions and replaced all existing data.`);
        }
        
        // Navigate to dashboard after successful import
        setTimeout(() => {
          console.log("🏠 Navigating to dashboard after successful import");
          navigate('/');
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

  const handleApplyTransformations = async () => {
    if (!rawData.length || selectedTransformations.length === 0) return;
    
    setIsTransforming(true);
    try {
      const aiService = new AIColumnMappingService();
      const transformationsToApply = suggestedTransformations.filter(t => 
        selectedTransformations.includes(t.id)
      );
      
      const result = await aiService.applyTransformations(rawData, transformationsToApply);
      setTransformedData(result);
      
      // Automatically save transformed data to file as side effect
      try {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `transformed_transactions_${timestamp}.csv`;
        exportToCSV(result.transformedData, filename);
        console.log(`✅ Automatically saved transformed data as: ${filename}`);
        setImportResult(`Applied ${transformationsToApply.length} transformations. ${result.newColumns.length} new columns created. File automatically saved as ${filename}.`);
      } catch (saveError) {
        console.warn('⚠️ Failed to auto-save transformed data:', saveError);
        setImportResult(`Applied ${transformationsToApply.length} transformations. ${result.newColumns.length} new columns created. (Auto-save failed)`);
      }
    } catch (error) {
      console.error('Transformation failed:', error);
      setImportResult(`Error applying transformations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTransforming(false);
    }
  };

  const handleImportToApp = () => {
    if (!transformedData) return;
    
    // Sort transactions by date (newest first)
    const sortedTransactions = transformedData.transformedData.sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // FORCE replace with transformed data
    console.log('🚀 FORCE setting transformed transactions:', sortedTransactions.length);
    replaceAllTransactions(sortedTransactions);
    
    setImportResult(`Successfully imported ${sortedTransactions.length} transformed transactions to the app.`);
    
    // Auto-navigate back to dashboard after successful import
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const handleExportTransformed = async (format: 'csv' | 'json') => {
    if (!transformedData) return;
    
    const filename = `transformed_transactions_${new Date().toISOString().split('T')[0]}`;
    
    try {
      if (format === 'csv') {
        await exportToCSV(transformedData.transformedData, `${filename}.csv`);
      } else {
        await exportToJSON(transformedData.transformedData, `${filename}.json`);
      }
      setImportResult(`Successfully exported transformed data as ${format.toUpperCase()}.`);
    } catch (error) {
      setImportResult(`Error exporting data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
              onChange={(e) => {
                console.log('🔥🔥🔥 FILE INPUT ONCHANGE TRIGGERED!', e);
                console.log('🔥 Files:', e.target.files);
                handleFileChange(e);
              }}
              style={{ display: 'none' }}
            />
            
            {/* ✅ ADD: AI Toggle */}
            <div className="mb-4">
              <label className="flex items-center justify-center space-x-2">
                <input
                  type="checkbox"
                  checked={enableAI}
                  onChange={(e) => setEnableAI(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Enable AI transformations (uses API credits)</span>
              </label>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                console.log('🔥 Button clicked!');
                console.log('🔥 File input ref:', fileInputRef.current);
                if (fileInputRef.current) {
                  console.log('🔥 Triggering file input click');
                  fileInputRef.current.value = ''; // Reset input
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

          {/* Navigation Button */}
          {suggestedTransformations.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Skip Transformations & Go to Dashboard
              </button>
            </div>
          )}

          {/* AI Transformations Section */}
          {suggestedTransformations.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <Wand2 className="h-4 w-4 mr-2" />
                AI Suggested Transformations
              </h4>
              <div className="space-y-3">
                {suggestedTransformations.map((transformation) => (
                  <label key={transformation.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedTransformations.includes(transformation.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTransformations([...selectedTransformations, transformation.id]);
                        } else {
                          setSelectedTransformations(selectedTransformations.filter(id => id !== transformation.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{transformation.name}</div>
                      <div className="text-gray-600">{transformation.description}</div>
                      <div className="text-xs text-gray-500">
                        {transformation.sourceColumn} → {transformation.targetColumn}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleApplyTransformations}
                  disabled={isTransforming || selectedTransformations.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  {isTransforming ? 'Transforming...' : 'Apply Transformations'}
                </button>
                
                {transformedData && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Hide Preview' : 'Preview Data'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Data Preview */}
          {showPreview && transformedData && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Transformed Data Preview</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(transformedData.transformedData[0] || {}).map((header) => (
                        <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                          {transformedData.newColumns.includes(header) && (
                            <span className="ml-1 text-purple-600">*</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transformedData.transformedData.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value: any, cellIndex) => (
                          <td key={cellIndex} className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                * New columns created by AI transformations. Showing first 5 rows of {transformedData.transformedData.length} total.
              </p>
            </div>
          )}

          {/* Export and Import Actions */}
          {transformedData && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Actions</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleImportToApp}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import to App
                </button>
                
                <button
                  onClick={() => handleExportTransformed('csv')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </button>
                
                <button
                  onClick={() => handleExportTransformed('json')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </button>
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
