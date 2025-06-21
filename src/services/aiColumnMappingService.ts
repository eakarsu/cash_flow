// src/services/aiColumnMappingService.ts

import { ColumnMapping, AIColumnMappingResponse } from '../types/columnMapping.ts';

class AIColumnMappingService {
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

MAPPING RULES:
1. Map each CSV header to the most appropriate standard field
2. If a header doesn't match any standard field, don't include it in the mapping
3. Some banks use separate debit/credit columns, others use a single amount column
4. Look for date-related terms for 'date' field
5. Look for description/memo/narrative terms for 'description' field
6. Look for amount/value/debit/credit terms for money fields
7. Look for balance/running balance terms for 'balance' field

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

  parseAIColumnMappingResponse(content: string, originalHeaders: string[]): ColumnMapping {
    if (!content) {
      throw new Error('No content received from AI model for column mapping parsing.');
    }
    
    const aiResponse: AIColumnMappingResponse = JSON.parse(content);
    console.log('✅ AI Column Mapping successful:');
    console.log('🤖 Mapping:', aiResponse.mapping);
    console.log('🤖 Confidence:', aiResponse.confidence);
    
    if (aiResponse.notes) {
      console.log('🤖 Notes:', aiResponse.notes);
    }

    // Validate and clean the mapping
    const cleanMapping: ColumnMapping = {};
    Object.entries(aiResponse.mapping).forEach(([field, headerName]) => {
      if (headerName && headerName !== 'null' && originalHeaders.includes(headerName)) {
        (cleanMapping as any)[field] = headerName;
      }
    });
    
    console.log('✅ Cleaned mapping:', cleanMapping);
    return cleanMapping;
  }

  fallbackMapping(headers: string[]): ColumnMapping {
    console.log('🔄 Using fallback heuristic mapping for headers:', headers);
    const mapping: ColumnMapping = {};
    
    const lowerHeaders = headers.map(h => h.toLowerCase().trim());

    const datePatterns = ['date', 'transaction date', 'trans date', 'posting date', 'post date', 'effective date', 'value date'];
    for (const pattern of datePatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern));
      if (index >= 0) {
        mapping.date = headers[index];
        break;
      }
    }

    const descPatterns = ['description', 'desc', 'memo', 'details', 'merchant', 'payee', 'reference', 'narrative'];
    for (const pattern of descPatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern));
      if (index >= 0) {
        mapping.description = headers[index];
        break;
      }
    }

    const amountPatterns = ['amount', 'transaction amount', 'net amount', 'value'];
    for (const pattern of amountPatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern) && !h.includes('debit') && !h.includes('credit'));
      if (index >= 0) {
        mapping.amount = headers[index];
        break;
      }
    }

    const debitPatterns = ['debit', 'withdrawal', 'outgoing', 'dr'];
    for (const pattern of debitPatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern));
      if (index >= 0) {
        mapping.debit = headers[index];
        break;
      }
    }

    const creditPatterns = ['credit', 'deposit', 'incoming', 'cr'];
    for (const pattern of creditPatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern));
      if (index >= 0) {
        mapping.credit = headers[index];
        break;
      }
    }

    const categoryPatterns = ['category', 'type', 'classification'];
    for (const pattern of categoryPatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern));
      if (index >= 0) {
        mapping.category = headers[index];
        break;
      }
    }

    const balancePatterns = ['balance', 'running balance', 'account balance', 'current balance'];
    for (const pattern of balancePatterns) {
      const index = lowerHeaders.findIndex(h => h.includes(pattern));
      if (index >= 0) {
        mapping.balance = headers[index];
        break;
      }
    }

    console.log('✅ Fallback mapping result:', mapping);
    return mapping;
  }
}

export default AIColumnMappingService;
export type { ColumnMapping };
