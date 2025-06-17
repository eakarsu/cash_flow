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

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const category = transaction.category;

      // Monthly aggregation
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { inflows: 0, outflows: 0, netFlow: 0 };
      }
      
      if (transaction.amount > 0) {
        monthlyData[monthKey].inflows += transaction.amount;
      } else {
        monthlyData[monthKey].outflows += Math.abs(transaction.amount);
      }
      monthlyData[monthKey].netFlow = monthlyData[monthKey].inflows - monthlyData[monthKey].outflows;

      // Category aggregation
      if (!categoryData[category]) {
        categoryData[category] = { total: 0, count: 0, avgAmount: 0 };
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

  async getPredictions(transactions: any[], currentBalance: number): Promise<CashFlowPrediction> {
    try {
      const prompt = this.createPrompt(transactions, currentBalance);
      
      console.log('🤖 AI Cash Flow Service: Making API call to OpenRouter');
      console.log('📊 Transaction count:', transactions.length);
      console.log('💰 Current balance:', currentBalance);
      console.log('🔑 API Key configured:', !!this.apiKey);
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
      return this.generateFallbackPrediction(transactions, currentBalance);
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

  private generateFallbackPrediction(transactions: any[], currentBalance: number): CashFlowPrediction {
    // Generate basic predictions based on historical averages
    const recentTransactions = transactions.slice(-30); // Last 30 transactions
    const avgInflows = recentTransactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0) / Math.max(1, recentTransactions.filter(t => t.amount > 0).length);
    const avgOutflows = recentTransactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) / Math.max(1, recentTransactions.filter(t => t.amount < 0).length);

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
