// src/services/OpenRouterService

interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class OpenRouterService {
    private apiKey: string;
    private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.REACT_APP_OPENROUTER_API_KEY || '';
    }

    isConfigured(): boolean {
        return !!this.apiKey && this.apiKey.length > 0;
    }

    async callAI(
        messages: AIChatMessage[],
        model: string = 'anthropic/claude-3.5-sonnet',
        temperature: number = 0.1,
        maxTokens: number = 1000
    ): Promise<string> {
        console.log('🤖 [OpenRouter] Making AI call with model:', model);
        console.log('   [OpenRouter] Messages:', messages.length);
        if (!this.isConfigured()) {
            throw new Error('OpenRouter API key is not configured. Cannot make AI call.');
        }

        const response = await fetch(this.baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Cash Flow Manager'
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ OpenRouter API Error:', response.status, response.statusText, errorData);
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const data: AIChatCompletionResponse = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('No content received from OpenRouter AI model');
        }
        
        return content;
    }
}

export default OpenRouterService;
