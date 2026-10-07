import { StructuredPaymentIntent } from './paymentIntentSchema';
import { PaymentIntentDetails, TransactionRecord } from '../../types';

export interface AIProvider {
  name: string;
  parsePaymentPrompt(prompt: string): Promise<StructuredPaymentIntent>;
  generateSummary(paymentDetails: PaymentIntentDetails, paypalOrderId: string, status: string): Promise<string>;
  answerPaymentMemory(question: string, transactions: TransactionRecord[]): Promise<string>;
}
