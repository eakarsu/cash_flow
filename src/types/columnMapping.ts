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
