import { AIProvider } from './aiProvider.interface';
import { FallbackProvider } from './fallbackProvider';
import { GeminiProvider } from './geminiProvider';
import { OpenAIProvider } from './openaiProvider';
import { ENV } from '../../config/env';
import { StructuredPaymentIntent } from './paymentIntentSchema';
import { PaymentIntentDetails, TransactionRecord } from '../../types';

export class AIService {
  private provider: AIProvider;

  constructor() {
    this.provider = this.initProvider();
  }

  private initProvider(): AIProvider {
    const selectedProvider = ENV.AI_PROVIDER;

    if (selectedProvider === 'gemini') {
      console.log('🤖 PayPilot AI Provider initialized: Google Gemini');
      return new GeminiProvider(ENV.GEMINI_API_KEY);
    } else if (selectedProvider === 'openai') {
      console.log('🤖 PayPilot AI Provider initialized: OpenAI GPT');
      return new OpenAIProvider(ENV.OPENAI_API_KEY);
    } else {
      console.log('🤖 PayPilot AI Provider initialized: Rule-based Payment Engine');
      return new FallbackProvider();
    }
  }

  public getProviderName(): string {
    return this.provider.name;
  }

  public async parsePrompt(prompt: string): Promise<StructuredPaymentIntent> {
    return this.provider.parsePaymentPrompt(prompt);
  }

  public async generateSummary(paymentDetails: PaymentIntentDetails, paypalOrderId: string, status: string): Promise<string> {
    return this.provider.generateSummary(paymentDetails, paypalOrderId, status);
  }

  public async answerPaymentMemory(question: string, transactions: TransactionRecord[]): Promise<string> {
    return this.provider.answerPaymentMemory(question, transactions);
  }
}

export const aiService = new AIService();
