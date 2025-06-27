// src/services/aiColumnMappingService.ts

import { ColumnMapping, AIColumnMappingResponse, DataTransformation, AITransformationResponse, TransformedData } from '../types/columnMapping';
import OpenRouterService from './OpenRouterService.ts';

class AIColumnMappingService {
  private openRouterService: OpenRouterService;

  constructor(apiKey?: string) {
    this.openRouterService = new OpenRouterService(apiKey);
  }

  createColumnMappingPrompt(headers: string[]): string {
    return `You are a financial data expert. I need you to map CSV column headers from a bank statement to our standard transaction fields.

CSV COLUMN HEADERS:
${headers.map((header, index) => `${index}: "${header}"`).join('\n')}

STANDARD FIELDS TO MAP TO:
- date: Transaction date/posting date
- description: Transaction description/memo/narrative
- amount: Single transaction amount (positive/negative)
- debit: Debit amount (money going out)
- credit: Credit amount (money coming in)
- category: Transaction category/type
- balance: Account balance after transaction

Return ONLY a JSON response in this exact format:
{
  "mapping": {
    "date": "header_name_or_null",
    "description": "header_name_or_null", 
    "amount": "header_name_or_null",
    "debit": "header_name_or_null",
    "credit": "header_name_or_null",
    "category": "header_name_or_null",
    "balance": "header_name_or_null"
  },
  "confidence": 0.95,
  "notes": "Optional explanation of mapping decisions"
}

Use the exact header names from the CSV. Set fields to null if no appropriate header is found.`;
  }

  // --- NEW LOGS ADDED TO THIS FUNCTION ---
  parseAIColumnMappingResponse(content: string, originalHeaders: string[]): ColumnMapping {
    console.log("🤖 [AI PARSER] Starting to parse AI Response...");
    console.log("   [AI PARSER] Raw content from AI:", content);

    if (!content) {
      console.error("   [AI PARSER] Error: Received empty content from AI.");
      throw new Error('No content received from AI model for column mapping parsing.');
    }

    let aiResponse: AIColumnMappingResponse;
    try {
      aiResponse = JSON.parse(content);
      console.log("   [AI PARSER] Successfully parsed AI JSON:", aiResponse);
    } catch (error) {
      console.error("   [AI PARSER] Error: Failed to parse JSON from AI response.", error);
      throw new Error("Failed to parse JSON from AI. Raw content: " + content);
    }
    
    const cleanMapping: ColumnMapping = {};

    if (aiResponse && aiResponse.mapping) {
      console.log("   [AI PARSER] Validating received mapping against original headers...");
      Object.entries(aiResponse.mapping).forEach(([field, headerName]) => {
        const isHeaderValid = headerName && headerName !== 'null' && originalHeaders.includes(headerName);
        console.log(`   - [AI PARSER] Validating: Field='${field}', Header='${headerName}'. Is Valid: ${isHeaderValid}`);
        if (isHeaderValid) {
          (cleanMapping as any)[field] = headerName;
        }
      });
    } else {
        console.warn("   [AI PARSER] Warning: AI response did not contain a 'mapping' object.");
    }
    
    console.log("✅ [AI PARSER] Final Cleaned AI Mapping:", cleanMapping);
    return cleanMapping;
  }

  // --- NEW LOGS ADDED TO THIS FUNCTION ---
  fallbackMapping(headers: string[]): ColumnMapping {
    console.log("🔄 [FALLBACK] AI mapping failed or was skipped. Using Fallback Heuristic Mapping...");
    console.log("   [FALLBACK] Input Headers:", headers);

    const mapping: ColumnMapping = {};
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());

    const patterns: { [key: string]: string[] } = {
      date: ['date', 'transaction period'],
      description: ['description', 'memo', 'details'],
      amount: ['amount', 'cost/price', 'net amount', 'value'],
      debit: ['debit', 'withdrawal'],
      credit: ['credit', 'deposit'],
      category: ['category', 'merchant categ'],
      balance: ['balance', 'remaining']
    };

    console.log("   [FALLBACK] Searching for matches using these patterns:", patterns);

    for (const [field, fieldPatterns] of Object.entries(patterns)) {
      let matchFound = false;
      for (const pattern of fieldPatterns) {
        const index = lowerHeaders.findIndex(h => h.includes(pattern));
        if (index >= 0) {
          const matchedHeader = headers[index];
          (mapping as any)[field] = matchedHeader;
          console.log(`   - [FALLBACK] ✅ Match found for '${field}': Header '${matchedHeader}' matched pattern '${pattern}'.`);
          matchFound = true;
          break; // Stop searching for this field once a match is found
        }
      }
      if (!matchFound) {
        console.warn(`   - [FALLBACK] ⚠️ No match found for field: '${field}'`);
      }
    }
    
    console.log("✅ [FALLBACK] Final Fallback Mapping Result:", mapping);
    return mapping;
  }

  // NEW: AI Data Transformation Methods
  async suggestDataTransformations(data: any[], headers: string[]): Promise<AITransformationResponse> {
    console.log("🤖 [AI TRANSFORM] Requesting AI data transformation suggestions...");
    
    if (!this.openRouterService.isConfigured()) {
      throw new Error('AI service not configured. Cannot suggest transformations.');
    }

    // Sample first few rows for AI analysis
    const sampleData = data.slice(0, 5);
    
    const prompt = this.createTransformationPrompt(headers, sampleData);
    
    try {
      const response = await this.openRouterService.callAI([
        { role: 'user', content: prompt }
      ], 'anthropic/claude-3.5-sonnet', 0.3, 2000);
      
      return this.parseTransformationResponse(response);
    } catch (error) {
      console.error("❌ [AI TRANSFORM] Error getting AI transformation suggestions:", error);
      throw error;
    }
  }

  private createTransformationPrompt(headers: string[], sampleData: any[]): string {
    return `You are a financial data transformation expert. Analyze this CSV data and suggest useful transformations to create new columns that would provide business insights.

AVAILABLE COLUMNS:
${headers.map((header, index) => `${index}: "${header}"`).join('\n')}

SAMPLE DATA (first 5 rows):
${sampleData.map((row, index) => `Row ${index + 1}: ${JSON.stringify(row)}`).join('\n')}

Suggest transformations that would create valuable new columns such as:
- Transaction categorization based on description
- Calculated fields (running totals, percentages, etc.)
- Data enrichment (extracting merchant names, locations, etc.)
- Data cleaning (standardizing formats, removing duplicates)

Return ONLY a JSON response in this exact format:
{
  "transformations": [
    {
      "id": "unique_id",
      "name": "Transformation Name",
      "description": "What this transformation does",
      "sourceColumn": "source_column_name",
      "targetColumn": "new_column_name",
      "transformationType": "categorize|calculate|enrich|clean",
      "aiPrompt": "AI prompt for this transformation (if applicable)",
      "formula": "calculation formula (if applicable)"
    }
  ],
  "confidence": 0.85,
  "reasoning": "Why these transformations are recommended"
}`;
  }

  private parseTransformationResponse(content: string): AITransformationResponse {
    console.log("🤖 [AI TRANSFORM] Parsing transformation response:", content);
    
    try {
      const response = JSON.parse(content);
      console.log("✅ [AI TRANSFORM] Successfully parsed transformation suggestions:", response);
      return response;
    } catch (error) {
      console.error("❌ [AI TRANSFORM] Failed to parse transformation response:", error);
      throw new Error("Failed to parse AI transformation response");
    }
  }

  async applyTransformations(data: any[], transformations: DataTransformation[]): Promise<TransformedData> {
    console.log("🔄 [TRANSFORM] Applying transformations to data...");
    console.log("   [TRANSFORM] Data rows:", data.length);
    console.log("   [TRANSFORM] Transformations:", transformations.length);

    const transformedData = [...data];
    const newColumns: string[] = [];

    for (const transformation of transformations) {
      console.log(`   [TRANSFORM] Applying: ${transformation.name}`);
      
      try {
        switch (transformation.transformationType) {
          case 'categorize':
            await this.applyCategorization(transformedData, transformation);
            break;
          case 'calculate':
            this.applyCalculation(transformedData, transformation);
            break;
          case 'enrich':
            await this.applyEnrichment(transformedData, transformation);
            break;
          case 'clean':
            this.applyDataCleaning(transformedData, transformation);
            break;
        }
        
        newColumns.push(transformation.targetColumn);
        console.log(`   ✅ [TRANSFORM] Successfully applied: ${transformation.name}`);
      } catch (error) {
        console.error(`   ❌ [TRANSFORM] Failed to apply ${transformation.name}:`, error);
      }
    }

    return {
      originalData: data,
      transformedData,
      transformations,
      newColumns
    };
  }

  private async applyCategorization(data: any[], transformation: DataTransformation): Promise<void> {
    if (!this.openRouterService.isConfigured() || !transformation.aiPrompt) {
      // Fallback categorization
      data.forEach(row => {
        row[transformation.targetColumn] = this.fallbackCategorize(row[transformation.sourceColumn]);
      });
      return;
    }

    // AI-powered categorization for each row
    for (const row of data) {
      try {
        const prompt = `${transformation.aiPrompt}\n\nTransaction: "${row[transformation.sourceColumn]}"\n\nReturn only the category name.`;
        const category = await this.openRouterService.callAI([
          { role: 'user', content: prompt }
        ], 'anthropic/claude-3.5-sonnet', 0.1, 50);
        
        row[transformation.targetColumn] = category.trim();
      } catch (error) {
        console.warn(`Failed to categorize "${row[transformation.sourceColumn]}", using fallback`);
        row[transformation.targetColumn] = this.fallbackCategorize(row[transformation.sourceColumn]);
      }
    }
  }

  private fallbackCategorize(description: string): string {
    const desc = description.toLowerCase();
    if (desc.includes('grocery') || desc.includes('food') || desc.includes('restaurant')) return 'Food & Dining';
    if (desc.includes('gas') || desc.includes('fuel') || desc.includes('station')) return 'Transportation';
    if (desc.includes('amazon') || desc.includes('store') || desc.includes('shop')) return 'Shopping';
    if (desc.includes('salary') || desc.includes('payroll') || desc.includes('income')) return 'Income';
    if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('utilities')) return 'Housing';
    return 'Other';
  }

  private applyCalculation(data: any[], transformation: DataTransformation): void {
    // Simple calculation support
    if (transformation.formula) {
      data.forEach((row, index) => {
        try {
          // Basic formula evaluation (extend as needed)
          if (transformation.formula === 'running_total') {
            const runningTotal = data.slice(0, index + 1)
              .reduce((sum, r) => sum + (parseFloat(r[transformation.sourceColumn]) || 0), 0);
            row[transformation.targetColumn] = runningTotal;
          }
        } catch (error) {
          row[transformation.targetColumn] = null;
        }
      });
    }
  }

  private async applyEnrichment(data: any[], transformation: DataTransformation): Promise<void> {
    // Data enrichment logic (extract merchant names, locations, etc.)
    data.forEach(row => {
      const sourceValue = row[transformation.sourceColumn];
      if (transformation.name.includes('merchant')) {
        // Extract merchant name from description
        const merchantMatch = sourceValue.match(/^([A-Z\s]+)/);
        row[transformation.targetColumn] = merchantMatch ? merchantMatch[1].trim() : sourceValue;
      }
    });
  }

  private applyDataCleaning(data: any[], transformation: DataTransformation): void {
    // Data cleaning logic
    data.forEach(row => {
      let cleanedValue = row[transformation.sourceColumn];
      
      if (typeof cleanedValue === 'string') {
        // Remove extra spaces, standardize case, etc.
        cleanedValue = cleanedValue.trim().replace(/\s+/g, ' ');
      }
      
      row[transformation.targetColumn] = cleanedValue;
    });
  }

  async saveTransformedDataToFile(transformedData: TransformedData, originalFilename?: string): Promise<string> {
    console.log("💾 [SAVE] Saving transformed data to file...");
    
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const baseFilename = originalFilename ? originalFilename.replace('.csv', '') : 'transformed_data';
      const filename = `${baseFilename}_transformed_${timestamp}.csv`;
      
      // Convert transformed data to CSV format
      const csvContent = this.convertToCSV(transformedData.transformedData);
      
      // Create blob and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Use a more reliable download method
      if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
        // IE/Edge support
        (window.navigator as any).msSaveOrOpenBlob(blob, filename);
      } else {
        // Modern browsers
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        // Ensure the link is added to DOM before clicking
        document.body.appendChild(link);
        
        // Force click and cleanup
        setTimeout(() => {
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      }
      
      console.log(`✅ [SAVE] Transformed data saved as: ${filename}`);
      return filename;
    } catch (error) {
      console.error("❌ [SAVE] Failed to save transformed data:", error);
      throw error;
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV values
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  }
}

export default AIColumnMappingService;
export type { ColumnMapping, DataTransformation, TransformedData };
   
