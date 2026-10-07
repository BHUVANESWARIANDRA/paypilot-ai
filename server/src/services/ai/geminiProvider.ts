import axios from 'axios';
import { AIProvider } from './aiProvider.interface';
import { StructuredPaymentIntent, validateAndSanitizePaymentIntent } from './paymentIntentSchema';
import { PaymentIntentDetails, TransactionRecord } from '../../types';
import { FallbackProvider } from './fallbackProvider';

export class GeminiProvider implements AIProvider {
  name = 'Google Gemini AI';
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
      const systemInstruction = `You are PayPilot AI, a payment-intent parsing engine.
You MUST output a strict JSON object (NO markdown codeblocks) matching this exact schema:
{
  "recipient": string or null,
  "amount": number or null,
  "currency": string (e.g. "USD", "EUR", "GBP"),
  "purpose": string or null,
  "notes": string or null,
  "confidence": number between 0.0 and 1.0
}`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nUser Input: "${prompt}"` }]
            }
          ],
          generationConfig: { responseMimeType: 'application/json' }
        },
        { timeout: 8000 }
      );

      const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini API');

      const parsed = JSON.parse(rawText);
      return validateAndSanitizePaymentIntent(parsed, prompt);
    } catch (err: any) {
      console.error('[GeminiProvider Error]', err.message || err);
      return this.fallback.parsePaymentPrompt(prompt);
    }
  }

  async generateSummary(paymentDetails: PaymentIntentDetails, paypalOrderId: string, status: string): Promise<string> {
    if (!this.apiKey) {
      return this.fallback.generateSummary(paymentDetails, paypalOrderId, status);
    }

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Generate a polite, 2-sentence payment receipt summary for a payment of ${paymentDetails.currency} ${paymentDetails.amount} to ${paymentDetails.recipient} for ${paymentDetails.purpose}. Order ID: ${paypalOrderId}. Status: ${status}.`
                }
              ]
            }
          ]
        },
        { timeout: 5000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
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
      const promptText = `System: You are PayPilot AI Payment Memory Assistant. Answer the user's question based strictly on the provided list of completed transactions below.
IMPORTANT SECURITY RULE: Never invent, guess, or assume any transaction not present in the data. If no matching transaction is found, respond exactly: "I couldn't find a matching transaction in your payment history."
IMPORTANT CURRENCY RULE: Never convert currencies or sum across different currencies. Report totals separately for each currency (e.g. "$125.00 USD and €100.00 EUR").

Completed Transactions:
${JSON.stringify(completed, ['recipient', 'amount', 'currency', 'purpose', 'createdAt'], 2)}

User Question: "${question}"`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          contents: [{ role: 'user', parts: [{ text: promptText }] }]
        },
        { timeout: 8000 }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    } catch (e) {
      console.warn('[Gemini Memory Error, falling back to rule engine]');
    }

    return this.fallback.answerPaymentMemory(question, transactions);
  }
}
