export interface StructuredPaymentIntent {
  recipient: string | null;
  amount: number | null;
  currency: string;
  purpose: string | null;
  notes?: string;
  missingFields: ('recipient' | 'amount' | 'purpose')[];
  confidence: number;
  clarificationMessage?: string;
  confirmationMessage?: string;
}

export interface PaymentDetails {
  recipient: string;
  amount: number;
  currency: string;
  purpose: string;
  notes?: string;
  confidenceScore: number;
  missingFields: string[];
}

export interface RiskFactor {
  code: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface HistoricalContext {
  recipientFound: boolean;
  previousPaymentCount: number;
  totalPaidToRecipient: number;
  averagePaymentToRecipient: number | null;
  largestPaymentToRecipient: number | null;
  userAveragePayment: number | null;
}

export interface RiskAnalysis {
  score?: number;
  level?: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons?: string[];
  recommendation?: string;
  historicalContext?: HistoricalContext;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  factors: RiskFactor[];
  isApprovedForPreview: boolean;
  recommendations: string[];
}

export interface ParsedAIResponse {
  paymentIntent?: StructuredPaymentIntent;
  paymentDetails: PaymentDetails;
  riskAnalysis: RiskAnalysis;
  rawPrompt: string;
  providerUsed: string;
}

export interface Transaction {
  id: string;
  paypalOrderId: string;
  paypalCaptureId?: string;
  recipient: string;
  amount: number;
  currency: string;
  purpose: string;
  notes?: string;
  status: 'CREATED' | 'APPROVED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  riskReasons: string[];
  aiSummary?: string;
  createdAt: string;
}

export interface TransactionStats {
  totalVolume: number | null;
  totalsByCurrency?: Record<string, number>;
  totalCount: number;
  completedCount: number;
  lowRiskCount: number;
  safetyRating: number;
}

export type AgentStepStatus = 'pending' | 'active' | 'completed' | 'waiting' | 'failed';

export interface AgentStep {
  id: string;
  title: string;
  description: string;
  status: AgentStepStatus;
  metadata?: string;
}
