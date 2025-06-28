// src/types/columnMapping.ts

export interface ColumnMapping {
  date?: string;
  description?: string;
  amount?: string;
  debit?: string;
  credit?: string;
  category?: string;
  balance?: string;
}

export interface AIColumnMappingResponse {
  mapping: ColumnMapping;
  confidence: number;
  notes?: string;
}

export interface CSVImportInsights {
  columnMapping: ColumnMapping;
  suggestedCategoryForFirstRow?: {
    category: string;
    confidence: number;
    reasoning?: string;
  };
}

export interface DataTransformation {
  id: string;
  name: string;
  description: string;
  sourceColumn: string;
  targetColumn: string;
  transformationType: 'categorize' | 'calculate' | 'enrich' | 'clean';
  aiPrompt?: string;
  formula?: string;
}

export interface TransformedData {
  originalData: any[];
  transformedData: any[];
  transformations: DataTransformation[];
  newColumns: string[];
}

export interface AITransformationResponse {
  transformations: DataTransformation[];
  confidence: number;
  reasoning?: string;
}

export interface SavedTransformationResult {
  filename: string;
  timestamp: string;
  originalRowCount: number;
  transformedRowCount: number;
  newColumnsAdded: string[];
}
