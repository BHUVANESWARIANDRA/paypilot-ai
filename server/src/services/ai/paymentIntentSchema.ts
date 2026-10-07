export interface StructuredPaymentIntent {
  recipient: string | null;
  amount: number | null;
  currency: string;
  purpose: string | null;
  notes?: string;
  missingFields: ('recipient' | 'amount' | 'purpose')[];
  confidence: number; // 0.00 to 1.00
  clarificationMessage?: string;
  confirmationMessage?: string;
}

export function validateAndSanitizePaymentIntent(raw: any, rawPrompt: string): StructuredPaymentIntent {
  const missingFields: ('recipient' | 'amount' | 'purpose')[] = [];

  // 1. Recipient extraction & validation
  let recipient: string | null = null;
  if (raw && typeof raw.recipient === 'string' && raw.recipient.trim() && !['unspecified', 'unknown', 'none', 'null'].includes(raw.recipient.trim().toLowerCase())) {
    recipient = raw.recipient.trim();
  } else {
    missingFields.push('recipient');
  }

  // 2. Amount extraction & validation
  let amount: number | null = null;
  if (raw && typeof raw.amount === 'number' && !isNaN(raw.amount) && raw.amount > 0) {
    amount = Math.round(raw.amount * 100) / 100;
  } else if (raw && typeof raw.amount === 'string' && !isNaN(parseFloat(raw.amount)) && parseFloat(raw.amount) > 0) {
    amount = Math.round(parseFloat(raw.amount) * 100) / 100;
  } else {
    missingFields.push('amount');
  }

  // 3. Currency extraction & validation
  let currency = 'USD';
  if (raw && typeof raw.currency === 'string' && raw.currency.trim()) {
    const curCandidate = raw.currency.trim().toUpperCase();
    if (['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR', 'JPY'].includes(curCandidate)) {
      currency = curCandidate;
    }
  }

  // 4. Purpose extraction & validation
  let purpose: string | null = null;
  if (raw && typeof raw.purpose === 'string' && raw.purpose.trim() && !['unspecified', 'general payment', 'none', 'null'].includes(raw.purpose.trim().toLowerCase())) {
    purpose = raw.purpose.trim();
  } else {
    missingFields.push('purpose');
  }

  // 5. Notes
  const notes = raw && typeof raw.notes === 'string' ? raw.notes.trim() : undefined;

  // 6. Confidence score calculation (0.0 - 1.0)
  let confidence = 0.95;
  if (raw && typeof raw.confidence === 'number') {
    confidence = Math.min(1.0, Math.max(0.0, raw.confidence));
  } else if (raw && typeof raw.confidenceScore === 'number') {
    confidence = Math.min(1.0, Math.max(0.0, raw.confidenceScore / 100));
  }
  
  // Deduct confidence for missing fields
  if (missingFields.length > 0) {
    confidence = Math.max(0.2, confidence - missingFields.length * 0.25);
    confidence = Math.round(confidence * 100) / 100;
  }

  // 7. Natural-language messages
  let clarificationMessage: string | undefined = undefined;
  let confirmationMessage: string | undefined = undefined;

  if (missingFields.length > 0) {
    const missingList = missingFields.map(f => f === 'amount' ? 'payment amount' : f === 'recipient' ? 'recipient name' : 'payment purpose').join(' and ');
    if (recipient && !amount) {
      clarificationMessage = `To pay ${recipient}, please specify the amount and purpose of the payment.`;
    } else if (amount && !recipient) {
      clarificationMessage = `Please specify who you would like to send ${currency} ${amount.toFixed(2)} to.`;
    } else {
      clarificationMessage = `Could you please provide the missing ${missingList} for this payment request?`;
    }
  } else {
    confirmationMessage = `Parsed Intent: You are preparing to pay ${currency} ${amount!.toFixed(2)} to ${recipient} for "${purpose}". Please review the payment preview to confirm.`;
  }

  return {
    recipient,
    amount,
    currency,
    purpose,
    notes,
    missingFields,
    confidence,
    clarificationMessage,
    confirmationMessage
  };
}
