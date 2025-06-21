// src/services/aiColumnMappingService.ts

import { ColumnMapping, AIColumnMappingResponse } from '../types/columnMapping';

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
}

export default AIColumnMappingService;
export type { ColumnMapping };
   