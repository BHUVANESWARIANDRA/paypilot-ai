export interface PaymentIntentDetails {
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

export interface RiskAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number; // 0 (safest) to 100 (highest risk)
  factors: RiskFactor[];
  isApprovedForPreview: boolean;
  recommendations: string[];
}

export interface ParsedPaymentResponse {
  paymentDetails: PaymentIntentDetails;
  riskAnalysis: RiskAnalysis;
  rawPrompt: string;
}

export interface TransactionRecord {
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
  rawPaypalResponse?: any;
  createdAt: string;
}
