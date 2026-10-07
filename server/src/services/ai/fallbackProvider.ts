import { AIProvider } from './aiProvider.interface';
import { StructuredPaymentIntent, validateAndSanitizePaymentIntent } from './paymentIntentSchema';
import { PaymentIntentDetails, TransactionRecord } from '../../types';

export class FallbackProvider implements AIProvider {
  name = 'Rule-based Payment Understanding Engine';

  async parsePaymentPrompt(prompt: string): Promise<StructuredPaymentIntent> {
    const cleanPrompt = prompt.trim();

    let rawAmount: number | null = null;
    let rawCurrency = 'USD';

    const currencySymbols: Record<string, string> = {
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '₹': 'INR',
      'C$': 'CAD',
      'A$': 'AUD'
    };

    const symbolMatch = cleanPrompt.match(/([\$€£₹])\s*(\d+(?:\.\d{1,2})?)/);
    if (symbolMatch) {
      rawCurrency = currencySymbols[symbolMatch[1]] || 'USD';
      rawAmount = parseFloat(symbolMatch[2]);
    } else {
      const codeMatch = cleanPrompt.match(/(\d+(?:\.\d{1,2})?)\s*(USD|EUR|GBP|CAD|AUD|INR|dollars|euros|pounds)/i);
      if (codeMatch) {
        rawAmount = parseFloat(codeMatch[1]);
        const matchedCurr = codeMatch[2].toUpperCase();
        if (matchedCurr === 'DOLLARS') rawCurrency = 'USD';
        else if (matchedCurr === 'EUROS') rawCurrency = 'EUR';
        else if (matchedCurr === 'POUNDS') rawCurrency = 'GBP';
        else rawCurrency = matchedCurr;
      }
    }

    let rawRecipient: string | null = null;
    const toMatch = cleanPrompt.match(/to\s+([A-Z0-9\s._-]+?)(?=\s+for|\s+notes|\s+with|\s+via|\$|\d|$)/i);
    if (toMatch) {
      rawRecipient = toMatch[1].trim();
    } else {
      const payMatch = cleanPrompt.match(/(?:pay|send|transfer|remit)\s+([A-Za-z0-9._-]+)(?=\s+\$|\s+\d|\s+for|$)/i);
      if (payMatch) {
        const candidate = payMatch[1].trim();
        if (!['dollars', 'usd', 'eur', 'gbp', 'euros', 'pounds'].includes(candidate.toLowerCase()) && isNaN(Number(candidate))) {
          rawRecipient = candidate;
        }
      }
    }

    let rawPurpose: string | null = null;
    const purposeMatch = cleanPrompt.match(/for\s+([^,.]+?)(?=\s+with|\s+notes|$)/i);
    if (purposeMatch) {
      rawPurpose = purposeMatch[1].trim();
    }

    let rawNotes: string | undefined = undefined;
    const notesMatch = cleanPrompt.match(/(?:with\s+notes?|notes?:?)\s+(.+)$/i);
    if (notesMatch) {
      rawNotes = notesMatch[1].trim();
    }

    const rawObject = {
      recipient: rawRecipient,
      amount: rawAmount,
      currency: rawCurrency,
      purpose: rawPurpose,
      notes: rawNotes,
      confidence: 0.95
    };

    return validateAndSanitizePaymentIntent(rawObject, cleanPrompt);
  }

  async generateSummary(paymentDetails: PaymentIntentDetails, paypalOrderId: string, status: string): Promise<string> {
    return `PayPilot AI safely completed your ${paymentDetails.currency} ${paymentDetails.amount.toFixed(2)} payment to ${paymentDetails.recipient} for "${paymentDetails.purpose}". PayPal Sandbox Order ID: ${paypalOrderId}. Status: ${status.toUpperCase()}.`;
  }

  // Helper for currency-safe formatting of payment memory totals
  private formatTotalsByCurrency(transactions: TransactionRecord[]): string {
    const totals: Record<string, number> = {};
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      CAD: 'C$',
      AUD: 'A$'
    };

    transactions.forEach(t => {
      const curr = (t.currency || 'USD').toUpperCase();
      totals[curr] = Math.round(((totals[curr] || 0) + t.amount) * 100) / 100;
    });

    const parts = Object.entries(totals).map(([curr, sum]) => {
      const sym = currencySymbols[curr] || '';
      return `${sym}${sum.toFixed(2)} ${curr}`;
    });

    if (parts.length === 0) return '$0.00 USD';
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
  }

  // AI Payment Memory engine
  async answerPaymentMemory(question: string, transactions: TransactionRecord[]): Promise<string> {
    // 1. Strict filtering: ONLY include transactions with status === 'COMPLETED'
    const completed = transactions.filter(t => t.status === 'COMPLETED');

    if (completed.length === 0) {
      return "I couldn't find any completed transactions in your payment history.";
    }

    const q = question.toLowerCase().trim();

    // Pattern 1: Largest / Highest payment
    if (q.includes('largest') || q.includes('highest') || q.includes('biggest') || q.includes('maximum')) {
      const sorted = [...completed].sort((a, b) => b.amount - a.amount);
      const top = sorted[0];
      const currencySymbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'C$', AUD: 'A$' };
      const sym = currencySymbols[top.currency] || '';
      return `Your largest payment was ${sym}${top.amount.toFixed(2)} ${top.currency} to ${top.recipient} for "${top.purpose}".`;
    }

    // Pattern 2: Recent payments / latest transactions
    if (q.includes('recent') || q.includes('latest') || q.includes('show my payments') || q.includes('show payments')) {
      const recent = completed.slice(0, 3);
      const currencySymbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'C$', AUD: 'A$' };
      const listStr = recent.map((t, i) => `${i + 1}. ${currencySymbols[t.currency] || ''}${t.amount.toFixed(2)} ${t.currency} to ${t.recipient} for "${t.purpose}"`).join('; ');
      return `Here are your recent completed payments: ${listStr}.`;
    }

    // Pattern 3: Total spending across all completed payments / this month
    if (q.includes('this month') || q.includes('total spend') || q.includes('total spent') || q.includes('how much did i spend total')) {
      const formattedTotals = this.formatTotalsByCurrency(completed);
      return `You have spent a total of ${formattedTotals} across ${completed.length} completed payment(s).`;
    }

    // Pattern 4: Recipient specific search ("How much did I pay Rahul?", "payments to Maria")
    const words = q.split(/\s+/).filter(w => !['how', 'much', 'did', 'i', 'pay', 'to', 'show', 'my', 'the', 'what', 'for', 'spend', 'spent', 'on'].includes(w));
    
    // Check if recipient matches
    for (const word of words) {
      const matches = completed.filter(t => t.recipient.toLowerCase().includes(word));
      if (matches.length > 0) {
        const recipientName = matches[0].recipient;
        const formattedTotals = this.formatTotalsByCurrency(matches);
        if (matches.length === 1) {
          return `You paid ${recipientName} ${formattedTotals} for "${matches[0].purpose}".`;
        } else {
          return `You have made ${matches.length} completed payments to ${recipientName} totaling ${formattedTotals}.`;
        }
      }
    }

    // Pattern 5: Purpose / Category specific search ("What did I spend on food?", "laptop repair", "dinner", "hosting")
    for (const word of words) {
      const matches = completed.filter(t => t.purpose.toLowerCase().includes(word));
      if (matches.length > 0) {
        const formattedTotals = this.formatTotalsByCurrency(matches);
        return `You have spent ${formattedTotals} across ${matches.length} transaction(s) matching "${word}".`;
      }
    }

    // Security Rule: Never invent transactions. Return standard no-match message.
    return "I couldn't find a matching transaction in your payment history.";
  }
}
