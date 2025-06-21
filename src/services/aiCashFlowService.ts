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

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('🔑 API key updated:', !!apiKey);
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
    // Group transactions by category and month
    const monthlyData: Record<string, any> = {};
    const categoryData: Record<string, any> = {};

    console.log('📊 Summarizing transactions:', transactions.length);

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const category = transaction.category;

      // Monthly aggregation
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { inflows: 0, outflows: 0, netFlow: 0 };
      }
      
      // Use transaction type to determine if it's inflow or outflow
      if (transaction.type === 'inflow') {
        monthlyData[monthKey].inflows += Math.abs(transaction.amount);
      } else if (transaction.type === 'outflow') {
        monthlyData[monthKey].outflows += Math.abs(transaction.amount);
      }
      monthlyData[monthKey].netFlow = monthlyData[monthKey].inflows - monthlyData[monthKey].outflows;

      // Category aggregation
      if (!categoryData[category]) {
        categoryData[category] = { total: 0, count: 0, avgAmount: 0, type: transaction.type };
      }
      categoryData[category].total += Math.abs(transaction.amount);
      categoryData[category].count += 1;
      categoryData[category].avgAmount = categoryData[category].total / categoryData[category].count;
    });

    console.log('📊 Monthly trends:', Object.keys(monthlyData).length, 'months');
    console.log('📊 Categories:', Object.keys(categoryData).length, 'categories');

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
      
      // Check if API key is configured
      if (!this.isConfigured()) {
        console.warn('⚠️ No API key configured. Using fallback prediction.');
        const calculatedBalance = this.calculateCurrentBalance(transactions);
        const actualCurrentBalance = currentBalance && currentBalance !== 0 ? currentBalance : calculatedBalance;
        return this.generateFallbackPrediction(transactions, actualCurrentBalance);
      }
      
      // Debug: Log transaction sources
      if (transactions.length > 0) {
        const sampleIds = transactions.slice(0, 10).map(t => t.id);
        console.log('🔍 Sample transaction IDs:', sampleIds);
        
        const importedCount = transactions.filter(t => t.id.startsWith('imported-')).length;
        const sampleCount = transactions.filter(t => t.id.startsWith('sample-')).length;
        const otherCount = transactions.length - importedCount - sampleCount;
        
        console.log('📊 Transaction breakdown:');
        console.log('  - Imported:', importedCount);
        console.log('  - Sample:', sampleCount);
        console.log('  - Other:', otherCount);
        
        if (sampleCount > 0) {
          console.warn('⚠️ WARNING: Sample transactions detected! This should not happen after import.');
        }
      }
      
      // Calculate current balance from transactions if not provided or if it seems incorrect
      const calculatedBalance = this.calculateCurrentBalance(transactions);
      const actualCurrentBalance = currentBalance && currentBalance !== 0 ? currentBalance : calculatedBalance;
      
      const prompt = this.createPrompt(transactions, actualCurrentBalance);
      
      console.log('💰 Provided balance:', currentBalance);
      console.log('💰 Calculated balance:', calculatedBalance);
      console.log('💰 Using balance:', actualCurrentBalance);
      console.log('🔑 API Key configured:', !!this.apiKey);
      console.log('🔑 API Key length:', this.apiKey.length);
      console.log('📝 Prompt length:', prompt.length);
      
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
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        console.error('❌ OpenRouter API Error:', response.status, response.statusText);
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      console.log('✅ AI Response received:', data);
      
      const content = data.choices[0]?.message?.content;

      if (!content) {
        console.error('❌ No content in AI response');
        throw new Error('No content received from AI model');
      }

      console.log('📄 AI Response content length:', content.length);
      console.log('🔍 AI Response preview:', content.substring(0, 200) + '...');

      // Parse JSON response
      const prediction = JSON.parse(content) as CashFlowPrediction;
      console.log('✨ AI Prediction parsed successfully:', prediction);
      
      // Validate and sanitize the response
      return this.validatePrediction(prediction);
      
    } catch (error) {
      console.error('❌ AI prediction error:', error);
      console.log('🔄 Falling back to historical data prediction');
      // Return fallback prediction based on historical data
      const calculatedBalance = this.calculateCurrentBalance(transactions);
      const actualCurrentBalance = currentBalance && currentBalance !== 0 ? currentBalance : calculatedBalance;
      return this.generateFallbackPrediction(transactions, actualCurrentBalance);
    }
  }

  private validatePrediction(prediction: any): CashFlowPrediction {
    // Ensure all required fields exist and have reasonable values
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
    if (!transactions || transactions.length === 0) return 0;
    
    // Sort transactions by date to get chronological order
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // If transactions have balance field, use the most recent one
    const transactionsWithBalance = sortedTransactions.filter(t => t.balance && t.balance !== 0);
    if (transactionsWithBalance.length > 0) {
      const mostRecentWithBalance = transactionsWithBalance[transactionsWithBalance.length - 1];
      console.log('📊 Using balance from most recent transaction:', mostRecentWithBalance.balance);
      return mostRecentWithBalance.balance;
    }
    
    // Otherwise, calculate balance by summing all transactions
    // Assuming we start from 0 and add/subtract based on transaction type
    let balance = 0;
    for (const transaction of sortedTransactions) {
      if (transaction.type === 'inflow') {
        balance += Math.abs(transaction.amount);
      } else if (transaction.type === 'outflow') {
        balance -= Math.abs(transaction.amount);
      }
    }
    
    console.log('📊 Calculated balance from transaction flow:', balance);
    return balance;
  }

  private generateFallbackPrediction(transactions: any[], currentBalance: number): CashFlowPrediction {
    // Generate basic predictions based on historical averages
    const recentTransactions = transactions.slice(-30); // Last 30 transactions
    const inflowTransactions = recentTransactions.filter(t => t.type === 'inflow');
    const outflowTransactions = recentTransactions.filter(t => t.type === 'outflow');
    
    const avgInflows = inflowTransactions.length > 0 
      ? inflowTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / inflowTransactions.length
      : 0;
    const avgOutflows = outflowTransactions.length > 0
      ? outflowTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / outflowTransactions.length
      : 0;

    const weeklyForecasts = [];
    let balance = currentBalance;

    for (let i = 0; i < 13; i++) {
      const date = new Date();
      date.setDate(date.getDate() + (i * 7));
      
      balance += (avgInflows - avgOutflows);
      
      weeklyForecasts.push({
        week: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        projectedBalance: balance,
        inflows: avgInflows,
        outflows: avgOutflows,
        optimistic: balance * 1.15,
        realistic: balance,
        pessimistic: balance * 0.85
      });
    }

    return {
      weeklyForecasts,
      runwayAnalysis: {
        currentRunway: avgOutflows > 0 ? currentBalance / avgOutflows : 12,
        projectedRunway: avgOutflows > 0 ? balance / avgOutflows : 12,
        burnRate: avgOutflows,
        recommendations: ['Monitor cash flow closely', 'Consider cost optimization']
      },
      categoryInsights: [],
      summary: {
        overallTrend: balance > currentBalance ? 'positive' : 'negative',
        keyInsights: ['Using historical averages for prediction'],
        actionItems: ['Set up AI API key for better predictions']
      }
    };
  }
}

export default AICashFlowService;
export type { CashFlowPrediction };
