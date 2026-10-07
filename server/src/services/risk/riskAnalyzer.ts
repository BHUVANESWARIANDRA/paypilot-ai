import { StructuredPaymentIntent } from '../ai/paymentIntentSchema';
import { ENV } from '../../config/env';
import { TransactionRecord } from '../../types';

export interface HistoricalContext {
  recipientFound: boolean;
  previousPaymentCount: number;
  totalPaidToRecipient: number;
  averagePaymentToRecipient: number | null;
  largestPaymentToRecipient: number | null;
  userAveragePayment: number | null;
}

export interface ExplainableRiskAnalysis {
  score: number; // 0 (safest) to 100 (highest risk)
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  recommendation: string;
  historicalContext: HistoricalContext;
  // Backward compatibility fields for legacy views
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: { code: string; message: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }[];
  isApprovedForPreview: boolean;
  recommendations: string[];
}

export class RiskAnalyzer {
  public analyzePayment(
    intent: Partial<StructuredPaymentIntent>,
    history?: TransactionRecord[]
  ): ExplainableRiskAnalysis {
    const reasons: string[] = [];
    const factors: { code: string; message: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }[] = [];
    let score = 5; // Baseline score

    const amount = typeof intent.amount === 'number' ? intent.amount : 0;
    const recipient = intent.recipient || '';
    const currency = (intent.currency || 'USD').toUpperCase();
    const purpose = intent.purpose || '';
    const missingFields = intent.missingFields || [];
    const confidence = typeof intent.confidence === 'number' ? intent.confidence : 0.95;

    const mediumThreshold = ENV.RISK_MEDIUM_THRESHOLD || 500;
    const highThreshold = ENV.RISK_HIGH_THRESHOLD || 2000;

    // 1. Configurable Amount Threshold Check
    if (amount > highThreshold) {
      score += 45;
      const msg = `Payment amount (${currency} ${amount.toFixed(2)}) is above the configured high-value review threshold (${currency} ${highThreshold.toFixed(2)}).`;
      reasons.push(msg);
      factors.push({ code: 'HIGH_AMOUNT', message: msg, severity: 'HIGH' });
    } else if (amount > mediumThreshold) {
      score += 25;
      const msg = `Payment amount (${currency} ${amount.toFixed(2)}) is above the standard review threshold (${currency} ${mediumThreshold.toFixed(2)}).`;
      reasons.push(msg);
      factors.push({ code: 'MODERATE_AMOUNT', message: msg, severity: 'MEDIUM' });
    }

    // 2. Missing Required Parameter Check
    if (missingFields.length > 0) {
      score += missingFields.length * 25;
      const msg = `Required payment parameter missing: ${missingFields.join(', ')}.`;
      reasons.push(msg);
      factors.push({ code: 'MISSING_FIELDS', message: msg, severity: 'HIGH' });
    }

    // 3. Recipient Sanity Check
    if (!recipient || recipient.trim().length < 2) {
      score += 30;
      const msg = 'Recipient identifier is short or unverified.';
      reasons.push(msg);
      factors.push({ code: 'INVALID_RECIPIENT', message: msg, severity: 'HIGH' });
    }

    // 4. Currency Validity Check
    const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'];
    if (!validCurrencies.includes(currency)) {
      score += 25;
      const msg = `Unrecognized or non-standard currency code: '${currency}'.`;
      reasons.push(msg);
      factors.push({ code: 'INVALID_CURRENCY', message: msg, severity: 'MEDIUM' });
    }

    // 5. Sensitive Category Keyword Check
    const sensitiveKeywords = ['gift card', 'bitcoin', 'crypto', 'wire transfer', 'urgent', 'casino', 'lottery', 'electronics', 'anonymous'];
    const lowerPurpose = purpose.toLowerCase();
    const matchedKeywords = sensitiveKeywords.filter(kw => lowerPurpose.includes(kw));

    if (matchedKeywords.length > 0) {
      score += 25;
      const msg = `Purpose mentions sensitive or high-risk category keyword(s): "${matchedKeywords.join(', ')}".`;
      reasons.push(msg);
      factors.push({ code: 'SENSITIVE_CATEGORY', message: msg, severity: 'MEDIUM' });
    }

    // 6. AI Confidence Level Check
    if (confidence < 0.6) {
      score += 20;
      const msg = `AI prompt extraction confidence is lower than average (${Math.round(confidence * 100)}%). Please review extracted details.`;
      reasons.push(msg);
      factors.push({ code: 'LOW_CONFIDENCE', message: msg, severity: 'MEDIUM' });
    }

    // -------------------------------------------------------------
    // 7. Database-Grounded Historical Context & Pattern Analysis (Currency-Safe)
    // -------------------------------------------------------------
    const completedHistory = (history || []).filter(t => t.status === 'COMPLETED');
    const recipientClean = recipient.trim().toLowerCase();

    let recipientFound = false;
    let previousPaymentCount = 0;
    let totalPaidToRecipient = 0;
    let averagePaymentToRecipient: number | null = null;
    let largestPaymentToRecipient: number | null = null;
    let userAveragePayment: number | null = null;

    if (completedHistory.length > 0 && recipientClean) {
      const recipientTxAnyCurrency = completedHistory.filter(t => t.recipient.trim().toLowerCase() === recipientClean);

      if (recipientTxAnyCurrency.length > 0) {
        recipientFound = true;
        previousPaymentCount = recipientTxAnyCurrency.length;

        // Currency-Safe Filtering: Only evaluate recipient transactions matching the current payment currency
        const recipientTxSameCurrency = recipientTxAnyCurrency.filter(t => (t.currency || 'USD').toUpperCase() === currency);

        if (recipientTxSameCurrency.length > 0) {
          totalPaidToRecipient = recipientTxSameCurrency.reduce((sum, t) => sum + t.amount, 0);
          averagePaymentToRecipient = Math.round((totalPaidToRecipient / recipientTxSameCurrency.length) * 100) / 100;
          largestPaymentToRecipient = Math.max(...recipientTxSameCurrency.map(t => t.amount));

          // Check for unusual amount compared to recipient same-currency history
          if (amount >= 2.5 * averagePaymentToRecipient && (amount - averagePaymentToRecipient) >= 25) {
            score += 25;
            const msg = `Payment amount (${currency} ${amount.toFixed(2)}) is significantly higher than your historical average payment to ${recipient.trim()} (${currency} ${averagePaymentToRecipient.toFixed(2)}).`;
            reasons.push(msg);
            factors.push({ code: 'UNUSUAL_RECIPIENT_AMOUNT', message: msg, severity: 'MEDIUM' });
          }
        }
      } else {
        // First-time recipient detection
        score += 15;
        const msg = `First-time payment to recipient '${recipient.trim()}' (no prior completed payment history found).`;
        reasons.push(msg);
        factors.push({ code: 'FIRST_TIME_RECIPIENT', message: msg, severity: 'MEDIUM' });
      }
    }

    // Currency-Safe User-Level Spending Pattern (Requires >= 3 same-currency completed payments)
    const sameCurrencyUserHistory = completedHistory.filter(t => (t.currency || 'USD').toUpperCase() === currency);
    if (sameCurrencyUserHistory.length >= 3) {
      const userTotal = sameCurrencyUserHistory.reduce((sum, t) => sum + t.amount, 0);
      userAveragePayment = Math.round((userTotal / sameCurrencyUserHistory.length) * 100) / 100;

      if (amount >= 3.0 * userAveragePayment && (amount - userAveragePayment) >= 100) {
        score += 15;
        const msg = `Payment amount (${currency} ${amount.toFixed(2)}) is unusually higher than your overall average ${currency} payment activity (${currency} ${userAveragePayment.toFixed(2)}).`;
        reasons.push(msg);
        factors.push({ code: 'UNUSUAL_USER_ACTIVITY', message: msg, severity: 'MEDIUM' });
      }
    }

    // Clamp score strictly between 0 and 100
    const finalScore = Math.min(100, Math.max(0, Math.round(score)));

    // Determine Risk Level
    let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (finalScore >= 65) {
      level = 'HIGH';
    } else if (finalScore >= 35) {
      level = 'MEDIUM';
    }

    // Generate Objective, Human-Readable Recommendation
    let recommendation = '';
    if (level === 'HIGH') {
      recommendation = '🚨 High-value or unusual parameter signals detected. Please carefully verify the recipient and purpose before confirming.';
    } else if (level === 'MEDIUM') {
      recommendation = '⚠️ Potential risk signal detected. Please review the recipient and amount carefully before confirming.';
    } else {
      recommendation = '✅ Low risk signals detected. Payment parameters are within standard review boundaries.';
    }

    const historicalContext: HistoricalContext = {
      recipientFound,
      previousPaymentCount,
      totalPaidToRecipient,
      averagePaymentToRecipient,
      largestPaymentToRecipient,
      userAveragePayment
    };

    return {
      score: finalScore,
      level,
      reasons: reasons.length > 0 ? reasons : ['No elevated risk signals detected. Standard peer transfer pattern.'],
      recommendation,
      historicalContext,
      // Backward compatibility mapping
      riskScore: finalScore,
      riskLevel: level,
      factors,
      isApprovedForPreview: missingFields.length === 0,
      recommendations: [recommendation]
    };
  }
}

export const riskAnalyzer = new RiskAnalyzer();
