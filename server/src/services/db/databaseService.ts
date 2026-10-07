import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '../../config/env';
import { TransactionRecord } from '../../types';

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private memoryStore: TransactionRecord[] = [
    {
      id: 'tx-001',
      paypalOrderId: 'PAYPAL-SANDBOX-ORD-1700000001',
      paypalCaptureId: 'CAP-98712365',
      recipient: 'Rahul',
      amount: 50.00,
      currency: 'USD',
      purpose: 'Laptop repair service',
      notes: 'Initial deposit for diagnostic',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 10,
      riskReasons: [],
      aiSummary: 'PayPilot AI safely completed your USD 50.00 payment to Rahul for laptop repair service.',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'tx-002',
      paypalOrderId: 'PAYPAL-SANDBOX-ORD-1700000002',
      paypalCaptureId: 'CAP-98712366',
      recipient: 'Maria',
      amount: 25.00,
      currency: 'USD',
      purpose: 'Dinner split',
      notes: 'Italian restaurant split',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 5,
      riskReasons: [],
      aiSummary: 'PayPilot AI safely completed your USD 25.00 payment to Maria for dinner split.',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'tx-003',
      paypalOrderId: 'PAYPAL-SANDBOX-ORD-1700000003',
      paypalCaptureId: 'CAP-98712367',
      recipient: 'ABC Services',
      amount: 120.00,
      currency: 'USD',
      purpose: 'Website hosting annual plan',
      notes: 'Cloud server hosting',
      status: 'COMPLETED',
      riskLevel: 'LOW',
      riskScore: 15,
      riskReasons: [],
      aiSummary: 'PayPilot AI safely completed your USD 120.00 payment to ABC Services for website hosting.',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ];

  constructor() {
    if (ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY && !ENV.SUPABASE_URL.includes('your-project')) {
      try {
        this.supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
        console.log('⚡ Connected to Supabase Database');
      } catch (err) {
        console.warn('⚠️ Supabase connection failed, using in-memory store.');
      }
    } else {
      console.log('⚡ Using In-Memory Transaction Store (Supabase credentials optional)');
    }
  }

  public isSupabaseConnected(): boolean {
    return this.supabase !== null;
  }

  public async saveTransaction(record: Omit<TransactionRecord, 'id' | 'createdAt'>): Promise<TransactionRecord> {
    const fullRecord: TransactionRecord = {
      ...record,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    if (this.supabase) {
      try {
        const { data, error } = await this.supabase.from('transactions').insert([
          {
            paypal_order_id: record.paypalOrderId,
            paypal_capture_id: record.paypalCaptureId,
            recipient: record.recipient,
            amount: record.amount,
            currency: record.currency,
            purpose: record.purpose,
            notes: record.notes,
            status: record.status,
            risk_level: record.riskLevel,
            risk_score: record.riskScore,
            risk_reasons: record.riskReasons,
            ai_summary: record.aiSummary,
            raw_paypal_response: record.rawPaypalResponse
          }
        ]).select().single();

        if (error) {
          console.error('[Supabase Insert Error]', error.message);
        } else if (data) {
          return {
            id: data.id,
            paypalOrderId: data.paypal_order_id,
            paypalCaptureId: data.paypal_capture_id,
            recipient: data.recipient,
            amount: Number(data.amount),
            currency: data.currency,
            purpose: data.purpose,
            notes: data.notes,
            status: data.status,
            riskLevel: data.risk_level,
            riskScore: data.risk_score,
            riskReasons: data.risk_reasons || [],
            aiSummary: data.ai_summary,
            createdAt: data.created_at
          };
        }
      } catch (err) {
        console.error('[Supabase Error]', err);
      }
    }

    // Memory fallback
    this.memoryStore.unshift(fullRecord);
    return fullRecord;
  }

  public async getTransactions(): Promise<TransactionRecord[]> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((d: any) => ({
            id: d.id,
            paypalOrderId: d.paypal_order_id,
            paypalCaptureId: d.paypal_capture_id,
            recipient: d.recipient,
            amount: Number(d.amount),
            currency: d.currency,
            purpose: d.purpose,
            notes: d.notes,
            status: d.status,
            riskLevel: d.risk_level,
            riskScore: d.risk_score,
            riskReasons: d.risk_reasons || [],
            aiSummary: d.ai_summary,
            createdAt: d.created_at
          }));
        }
      } catch (err) {
        console.error('[Supabase Query Error]', err);
      }
    }

    return this.memoryStore;
  }

  public async getTransactionById(id: string): Promise<TransactionRecord | null> {
    const list = await this.getTransactions();
    return list.find(tx => tx.id === id || tx.paypalOrderId === id) || null;
  }
}

export const databaseService = new DatabaseService();
