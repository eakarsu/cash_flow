// src/services/aiCashFlowService.ts

import OpenRouterService from './OpenRouterService.ts';
import AIColumnMappingService from './aiColumnMappingService.ts';
import { ColumnMapping, CSVImportInsights } from '../types/columnMapping.ts';

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface CashFlowPrediction {
  weeklyForecasts: Array<{
    week: string;
    projectedBalance: number;
    inflows: number;
    outflows: number;
    optimistic: number;
    realistic: number;
    pessimistic: number;
  }>;
  runwayAnalysis: {
    currentRunway: number;
    projectedRunway: number;
    burnRate: number;
    recommendations: string[];
  };
  categoryInsights: Array<{
    category: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    projectedAmount: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  summary: {
    overallTrend: 'positive' | 'negative' | 'stable';
    keyInsights: string[];
    actionItems: string[];
  };
}

class AICashFlowService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private model = 'anthropic/claude-3.5-sonnet';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REACT_APP_OPENROUTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ No OpenRouter API key provided. AI features will not work.');
    }
  }

  getApiKey(): string {
    return this.apiKey;
  }

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('🔑 API key updated:', !!apiKey);
  }

  // NEW METHOD: Combined CSV Import Insights
  async getCSVImportInsights(headers: string[], firstDataRow: string[]): Promise<CSVImportInsights> {
    const openRouterService = new OpenRouterService();
    const aiColumnMappingService = new AIColumnMappingService();

    if (!openRouterService.isConfigured()) {
      console.warn('⚠️ AI not configured, using fallback heuristic mapping.');
      return {
        columnMapping: aiColumnMappingService.fallbackMapping(headers)
      };
    }

    try {
      const columnMappingPrompt = aiColumnMappingService.createColumnMappingPrompt(headers);
      
      const combinedPrompt = `
You are a financial data expert assisting with CSV imports.
Please provide insights in JSON format.

PART 1: CSV Column Mapping
${columnMappingPrompt}

PART 2: First Row Analysis
Based on the following data row, suggest a primary category (e.g., "Food", "Rent", "Income", "Utilities") and confidence:
Data Row: ${firstDataRow.map(val => `"${val}"`).join(', ')}

Return a single JSON object with two top-level keys: "columnMapping" and "firstRowAnalysis".

Example structure:
{
  "columnMapping": {
    "mapping": { ... },
    "confidence": 0.98,
    "notes": "..."
  },
  "firstRowAnalysis": {
    "category": "Groceries",
    "confidence": 0.95,
    "reasoning": "Description contains grocery store name"
  }
}`;

      console.log('🤖 Sending combined AI request for CSV import insights...');
      const rawAIResponse = await openRouterService.callAI(
        [{ role: 'user', content: combinedPrompt }],
        'anthropic/claude-3.5-sonnet',
        0.1,
        2000
      );

      const combinedResult = JSON.parse(rawAIResponse);
      const columnMapping = aiColumnMappingService.parseAIColumnMappingResponse(
        JSON.stringify(combinedResult.columnMapping),
        headers
      );
      const suggestedCategoryForFirstRow = combinedResult.firstRowAnalysis;

      return {
        columnMapping,
        suggestedCategoryForFirstRow
      };

    } catch (error) {
      console.error('❌ Error getting CSV import insights:', error);
      console.log('🔄 Falling back to heuristic mapping.');
      return {
        columnMapping: aiColumnMappingService.fallbackMapping(headers)
      };
    }
  }

  private createPrompt(transactions: any[], currentBalance: number): string {
    const transactionSummary = this.summarizeTransactions(transactions);
    return `You are a financial analyst AI. Analyze the following cash flow data and provide predictions in JSON format.

TRANSACTION DATA:
${JSON.stringify(transactionSummary, null, 2)}

CURRENT BALANCE: $${currentBalance.toLocaleString()}

Please analyze this data and return a JSON response with the following structure:
{
  "weeklyForecasts": [
    {
      "week": "Dec 17",
      "projectedBalance": 50000,
      "inflows": 15000,
      "outflows": 12000,
      "optimistic": 55000,
      "realistic": 50000,
      "pessimistic": 45000
    }
    // ... 13 weeks total
  ],
  "runwayAnalysis": {
    "currentRunway": 8.5,
    "projectedRunway": 7.2,
    "burnRate": 6500,
    "recommendations": ["Reduce marketing spend by 15%", "Negotiate payment terms"]
  },
  "categoryInsights": [
    {
      "category": "Marketing",
      "trend": "increasing",
      "projectedAmount": 8000,
      "riskLevel": "medium"
    }
  ],
  "summary": {
    "overallTrend": "positive",
    "keyInsights": ["Revenue growth accelerating", "Expenses well controlled"],
    "actionItems": ["Focus on customer retention", "Optimize operational costs"]
  }
}

ANALYSIS REQUIREMENTS:
1. Generate 13 weeks of forecasts starting from today
2. Consider seasonal patterns, growth trends, and expense patterns
3. Provide optimistic (+15% variance), realistic (base case), and pessimistic (-15% variance) scenarios
4. Calculate runway in months based on current burn rate
5. Identify spending categories with concerning trends
6. Provide actionable insights and recommendations

Return ONLY the JSON response, no additional text.`;
  }

  private summarizeTransactions(transactions: any[]) {
    const monthlyData: Record<string, any> = {};
    const categoryData: Record<string, any> = {};
    
    console.log('📊 Summarizing transactions:', transactions.length);
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const category = transaction.category;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { inflows: 0, outflows: 0, netFlow: 0 };
      }

      if (transaction.type === 'inflow') {
        monthlyData[monthKey].inflows += Math.abs(transaction.amount);
      } else if (transaction.type === 'outflow') {
        monthlyData[monthKey].outflows += Math.abs(transaction.amount);
      }

      monthlyData[monthKey].netFlow = monthlyData[monthKey].inflows - monthlyData[monthKey].outflows;

      if (!categoryData[category]) {
        categoryData[category] = { total: 0, count: 0, avgAmount: 0, type: transaction.type };
      }

      categoryData[category].total += Math.abs(transaction.amount);
      categoryData[category].count += 1;
      categoryData[category].avgAmount = categoryData[category].total / categoryData[category].count;
    });

    return {
      monthlyTrends: monthlyData,
      categoryBreakdown: categoryData,
      totalTransactions: transactions.length,
      dateRange: {
        start: transactions.length > 0 ? Math.min(...transactions.map(t => new Date(t.date).getTime())) : null,
        end: transactions.length > 0 ? Math.max(...transactions.map(t => new Date(t.date).getTime())) : null
      }
    };
  }

  async getPredictions(transactions: any[], currentBalance?: number): Promise<CashFlowPrediction> {
    try {
      console.log('🤖 AI Cash Flow Service: Starting prediction analysis');
      console.log('📊 Received transaction count:', transactions.length);

      if (!this.isConfigured()) {
        console.warn('⚠️ No API key configured. Using fallback prediction.');
        const calculatedBalance = this.calculateCurrentBalance(transactions);
        const actualCurrentBalance = currentBalance && currentBalance !== 0 ? currentBalance : calculatedBalance;
        return this.generateFallbackPrediction(transactions, actualCurrentBalance);
      }

      const calculatedBalance = this.calculateCurrentBalance(transactions);
      const actualCurrentBalance = currentBalance && currentBalance !== 0 ? currentBalance : calculatedBalance;
      const prompt = this.createPrompt(transactions, actualCurrentBalance);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Cash Flow Manager'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content received from AI model');
      }

      const prediction = JSON.parse(content) as CashFlowPrediction;
      return this.validatePrediction(prediction);

    } catch (error) {
      console.error('❌ AI prediction error:', error);
      const calculatedBalance = this.calculateCurrentBalance(transactions);
      const actualCurrentBalance = currentBalance && currentBalance !== 0 ? currentBalance : calculatedBalance;
      return this.generateFallbackPrediction(transactions, actualCurrentBalance);
    }
  }

  private validatePrediction(prediction: any): CashFlowPrediction {
    const validated: CashFlowPrediction = {
      weeklyForecasts: Array.isArray(prediction.weeklyForecasts)
        ? prediction.weeklyForecasts.slice(0, 13).map((week: any) => ({
            week: week.week || 'Unknown',
            projectedBalance: Number(week.projectedBalance) || 0,
            inflows: Number(week.inflows) || 0,
            outflows: Number(week.outflows) || 0,
            optimistic: Number(week.optimistic) || 0,
            realistic: Number(week.realistic) || 0,
            pessimistic: Number(week.pessimistic) || 0
          }))
        : [],
      runwayAnalysis: {
        currentRunway: Number(prediction.runwayAnalysis?.currentRunway) || 0,
        projectedRunway: Number(prediction.runwayAnalysis?.projectedRunway) || 0,
        burnRate: Number(prediction.runwayAnalysis?.burnRate) || 0,
        recommendations: Array.isArray(prediction.runwayAnalysis?.recommendations)
          ? prediction.runwayAnalysis.recommendations
          : []
      },
      categoryInsights: Array.isArray(prediction.categoryInsights)
        ? prediction.categoryInsights.map((insight: any) => ({
            category: insight.category || 'Unknown',
            trend: ['increasing', 'decreasing', 'stable'].includes(insight.trend)
              ? insight.trend
              : 'stable',
            projectedAmount: Number(insight.projectedAmount) || 0,
            riskLevel: ['low', 'medium', 'high'].includes(insight.riskLevel)
              ? insight.riskLevel
              : 'medium'
          }))
        : [],
      summary: {
        overallTrend: ['positive', 'negative', 'stable'].includes(prediction.summary?.overallTrend)
          ? prediction.summary.overallTrend
          : 'stable',
        keyInsights: Array.isArray(prediction.summary?.keyInsights)
          ? prediction.summary.keyInsights
          : [],
        actionItems: Array.isArray(prediction.summary?.actionItems)
          ? prediction.summary.actionItems
          : []
      }
    };

    return validated;
  }

  private calculateCurrentBalance(transactions: any[]): number {
    if (!transactions || transactions.length === 0) {
      return 0;
    }

    const sortedTransactions = [...transactions].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const transactionsWithBalance = sortedTransactions.filter(t => t.balance && t.balance !== 0);
    if (transactionsWithBalance.length > 0) {
      return transactionsWithBalance[0].balance;
    }

    const chronologicalTransactions = [...transactions].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let balance = 0;
    for (const transaction of chronologicalTransactions) {
      if (transaction.type === 'inflow') {
        balance += Math.abs(transaction.amount);
      } else if (transaction.type === 'outflow') {
        balance -= Math.abs(transaction.amount);
      }
    }

    return balance;
  }

  private generateFallbackPrediction(transactions: any[], currentBalance: number): CashFlowPrediction {
    const weeklyForecasts: Array<{
      week: string;
      projectedBalance: number;
      inflows: number;
      outflows: number;
      optimistic: number;
      realistic: number;
      pessimistic: number;
    }> = [];

    const sortedTransactions = [...transactions].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentTransactions = sortedTransactions.filter(t =>
      new Date(t.date).getTime() >= ninetyDaysAgo.getTime()
    );

    const inflowTransactions = recentTransactions.filter(t => t.type === 'inflow');
    const outflowTransactions = recentTransactions.filter(t => t.type === 'outflow');

    const totalInflows = inflowTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalOutflows = outflowTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const weeksOfData = Math.max(1, 13);
    const weeklyInflows = totalInflows / weeksOfData;
    const weeklyOutflows = totalOutflows / weeksOfData;
    const weeklyNetFlow = weeklyInflows - weeklyOutflows;

  
    let balance = currentBalance;
    for (let i = 0; i < 13; i++) {
      const date = new Date();
      date.setDate(date.getDate() + (i * 7));
      balance += weeklyNetFlow;

      weeklyForecasts.push({
        week: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        projectedBalance: Math.round(balance),
        inflows: Math.round(weeklyInflows),
        outflows: Math.round(weeklyOutflows),
        optimistic: Math.round(balance * 1.15),
        realistic: Math.round(balance),
        pessimistic: Math.round(balance * 0.85)
      });
    }

    const monthlyBurnRate = weeklyOutflows * 4.33;
    const currentRunway = monthlyBurnRate > 0 ? currentBalance / monthlyBurnRate : 999;
    const projectedRunway = monthlyBurnRate > 0 ? balance / monthlyBurnRate : 999;

    const categoryInsights = this.generateCategoryInsights(recentTransactions);

    return {
      weeklyForecasts,
      runwayAnalysis: {
        currentRunway: Math.round(currentRunway * 10) / 10,
        projectedRunway: Math.round(projectedRunway * 10) / 10,
        burnRate: Math.round(monthlyBurnRate),
        recommendations: this.generateRecommendations(weeklyNetFlow, currentRunway)
      },
      categoryInsights,
      summary: {
        overallTrend: weeklyNetFlow > 0 ? 'positive' : weeklyNetFlow < 0 ? 'negative' : 'stable',
        keyInsights: [
          `Weekly net flow: ${weeklyNetFlow >= 0 ? '+' : ''}$${Math.round(weeklyNetFlow).toLocaleString()}`,
          `Current runway: ${Math.round(currentRunway * 10) / 10} months`,
          `Based on ${recentTransactions.length} recent transactions`
        ],
        actionItems: this.generateActionItems(weeklyNetFlow, currentRunway)
      }
    };
  }

  private generateCategoryInsights(transactions: any[]): Array<{
    category: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    projectedAmount: number;
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const categoryTotals: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'outflow') {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
      }
    });

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, total]) => ({
        category,
        trend: 'stable' as const,
        projectedAmount: Math.round(total),
        riskLevel: total > 10000 ? 'high' : total > 5000 ? 'medium' : 'low'
      }));
  }

  private generateRecommendations(weeklyNetFlow: number, runway: number): string[] {
    const recommendations: string[] = [];
    if (weeklyNetFlow < 0) {
      recommendations.push('Focus on increasing revenue or reducing expenses');
    }
    if (runway < 6) {
      recommendations.push('Critical: Runway below 6 months - immediate action needed');
    } else if (runway < 12) {
      recommendations.push('Monitor cash flow closely - runway below 12 months');
    }
    if (recommendations.length === 0) {
      recommendations.push('Maintain current financial discipline');
    }
    return recommendations;
  }

  private generateActionItems(weeklyNetFlow: number, runway: number): string[] {
    const actions: string[] = [];
    if (weeklyNetFlow < 0) {
      actions.push('Review and optimize major expense categories');
      actions.push('Explore revenue growth opportunities');
    }
    if (runway < 6) {
      actions.push('Secure additional funding or credit line');
    }
    actions.push('Set up AI API key for more detailed predictions');
    return actions;
  }
}

export default AICashFlowService;
export type { CashFlowPrediction };
