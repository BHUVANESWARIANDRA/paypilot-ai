import axios from 'axios';
import { AIProvider } from './aiProvider.interface';
import { StructuredPaymentIntent, validateAndSanitizePaymentIntent } from './paymentIntentSchema';
import { PaymentIntentDetails, TransactionRecord } from '../../types';
import { FallbackProvider } from './fallbackProvider';

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI GPT';
  private apiKey: string;
  private fallback: FallbackProvider;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.fallback = new FallbackProvider();
  }

  async parsePaymentPrompt(prompt: string): Promise<StructuredPaymentIntent> {
    if (!this.apiKey) {
      return this.fallback.parsePaymentPrompt(prompt);
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Output JSON matching fields: recipient (string|null), amount (number|null), currency (string), purpose (string|null), notes (string|null), confidence (number).'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty response from OpenAI');

      const parsed = JSON.parse(content);
      return validateAndSanitizePaymentIntent(parsed, prompt);
    } catch (err: any) {
      console.error('[OpenAIProvider Error]', err.message || err);
      return this.fallback.parsePaymentPrompt(prompt);
    }
  }

  async generateSummary(paymentDetails: PaymentIntentDetails, paypalOrderId: string, status: string): Promise<string> {
    if (!this.apiKey) {
      return this.fallback.generateSummary(paymentDetails, paypalOrderId, status);
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Summarize payment result in a concise, friendly style.'
            },
            {
              role: 'user',
              content: `Payment of ${paymentDetails.currency} ${paymentDetails.amount} to ${paymentDetails.recipient} for ${paymentDetails.purpose}. Order ID: ${paypalOrderId}. Status: ${status}.`
            }
          ]
        },
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: 5000
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content) return content.trim();
    } catch (e) {
      // ignore
    }

    return this.fallback.generateSummary(paymentDetails, paypalOrderId, status);
  }

  async answerPaymentMemory(question: string, transactions: TransactionRecord[]): Promise<string> {
    if (!this.apiKey) {
      return this.fallback.answerPaymentMemory(question, transactions);
    }

    const completed = transactions.filter(t => t.status === 'COMPLETED');
    if (completed.length === 0) {
      return "I couldn't find any completed transactions in your payment history.";
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are PayPilot AI Payment Memory Assistant. Answer the question based ONLY on provided completed transactions. Never invent transactions. Never convert currencies or sum across different currencies; report totals separately per currency. If not found, say: "I couldn\'t find a matching transaction in your payment history."'
            },
            {
              role: 'user',
              content: `Transactions: ${JSON.stringify(completed, ['recipient', 'amount', 'currency', 'purpose', 'createdAt'])}\n\nQuestion: "${question}"`
            }
          ]
        },
        {
          headers: { Authorization: `Bearer ${this.apiKey}` },
          timeout: 8000
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content) return content.trim();
    } catch (e) {
      console.warn('[OpenAI Memory Error, falling back to rule engine]');
    }

    return this.fallback.answerPaymentMemory(question, transactions);
  }
}
