import axios from 'axios';
import { ParsedAIResponse, PaymentDetails, Transaction, TransactionStats } from '../types/payment';

const API_BASE = '/api';

export const api = {
  // Parse AI Prompt
  async parsePaymentPrompt(prompt: string): Promise<ParsedAIResponse> {
    const res = await axios.post(`${API_BASE}/ai/parse-payment`, { prompt });
    return res.data;
  },

  // AI Payment Memory query (POST /api/ai/payment-memory)
  async askPaymentMemory(question: string): Promise<{
    question: string;
    answer: string;
    matchingTransactions: Transaction[];
    totalMatches: number;
    totalCompletedTransactions: number;
    providerUsed: string;
  }> {
    const res = await axios.post(`${API_BASE}/ai/payment-memory`, { question });
    return res.data;
  },

  // Create PayPal Sandbox Order (via POST /api/payments/create-order)
  async createPayPalOrder(paymentDetails: PaymentDetails): Promise<{ orderId: string; status: string; approveUrl?: string; raw: any }> {
    const res = await axios.post(`${API_BASE}/payments/create-order`, { paymentDetails });
    return res.data;
  },

  // Capture PayPal Sandbox Order (via POST /api/payments/capture-order)
  async capturePayPalOrder(orderId: string, paymentDetails: PaymentDetails): Promise<{ success: boolean; transaction: Transaction; capture: any }> {
    const res = await axios.post(`${API_BASE}/payments/capture-order`, { orderId, paymentDetails });
    return res.data;
  },

  // Fetch Transactions & Stats (GET /api/transactions)
  async getTransactions(): Promise<{ transactions: Transaction[]; stats: TransactionStats; databaseMode: string }> {
    const res = await axios.get(`${API_BASE}/transactions`);
    return res.data;
  },

  // Fetch single Transaction
  async getTransactionById(id: string): Promise<Transaction> {
    const res = await axios.get(`${API_BASE}/transactions/${id}`);
    return res.data;
  },

  // Fetch backend health & config
  async getHealthStatus(): Promise<{
    app: string;
    status: string;
    env: string;
    paypalMode: string;
    hasPayPalCredentials: boolean;
    aiProvider: string;
    timestamp: string;
  }> {
    const res = await axios.get(`${API_BASE}/health`);
    return res.data;
  }
};
