import axios from 'axios';
import { ENV } from '../../config/env';
import { PaymentIntentDetails } from '../../types';

export interface PayPalOrderResponse {
  orderId: string;
  status: string;
  approveUrl?: string;
  raw: any;
}

export interface PayPalCaptureResponse {
  captureId: string;
  status: string;
  payerEmail?: string;
  payerName?: string;
  raw: any;
}

export class PayPalService {
  private baseURL: string;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.baseURL = ENV.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
  }

  public isCredentialsConfigured(): boolean {
    return Boolean(
      ENV.PAYPAL_CLIENT_ID &&
      ENV.PAYPAL_CLIENT_SECRET &&
      !ENV.PAYPAL_CLIENT_ID.startsWith('your_') &&
      !ENV.PAYPAL_CLIENT_SECRET.startsWith('your_')
    );
  }

  // Server-side Input Validation
  public validatePaymentInput(details: Partial<PaymentIntentDetails>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!details.amount || typeof details.amount !== 'number' || details.amount <= 0 || isNaN(details.amount)) {
      errors.push('Payment amount must be a positive number greater than zero.');
    }

    if (!details.currency || typeof details.currency !== 'string' || !['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR'].includes(details.currency.toUpperCase())) {
      errors.push('Currency must be a valid supported 3-letter ISO code (USD, EUR, GBP, CAD, AUD, INR).');
    }

    if (!details.recipient || typeof details.recipient !== 'string' || !details.recipient.trim()) {
      errors.push('Recipient handle or name is required.');
    }

    if (!details.purpose || typeof details.purpose !== 'string' || !details.purpose.trim()) {
      errors.push('Payment purpose is required.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // OAuth 2.0 Access Token Generation
  public async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    if (!this.isCredentialsConfigured()) {
      throw new Error('PayPal Sandbox credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are missing or unconfigured in server/.env. Please add your PayPal Sandbox API credentials to server/.env file.');
    }

    try {
      const auth = Buffer.from(`${ENV.PAYPAL_CLIENT_ID}:${ENV.PAYPAL_CLIENT_SECRET}`).toString('base64');
      const response = await axios.post(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      this.cachedToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      return this.cachedToken!;
    } catch (err: any) {
      console.error('[PayPal OAuth Error]', err.response?.data || err.message);
      throw new Error(`PayPal OAuth authentication failed: ${err.response?.data?.error_description || err.message}`);
    }
  }

  // Orders v2 API - Create Order
  public async createOrder(details: PaymentIntentDetails): Promise<PayPalOrderResponse> {
    // 1. Check Credentials Configuration
    if (!this.isCredentialsConfigured()) {
      throw new Error('PayPal Sandbox credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are unconfigured in server/.env. Please set your real PayPal Sandbox credentials to process payments.');
    }

    // 2. Strict Server-side Input Validation
    const validation = this.validatePaymentInput(details);
    if (!validation.valid) {
      throw new Error(`Invalid payment request: ${validation.errors.join(' ')}`);
    }

    const currency = details.currency.toUpperCase();
    const amountStr = details.amount.toFixed(2);
    const sanitizedPurpose = details.purpose.trim().substring(0, 127);
    const sanitizedRecipient = details.recipient.trim().substring(0, 127);

    console.log(`[PayPal Orders v2 API] Creating Order at ${this.baseURL}: ${currency} ${amountStr} for "${sanitizedPurpose}" to ${sanitizedRecipient}`);

    try {
      const accessToken = await this.getAccessToken();
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders`,
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: amountStr
              },
              description: `PayPilot Payment for: ${sanitizedPurpose} to ${sanitizedRecipient}`,
              custom_id: `RECIPIENT:${sanitizedRecipient}`
            }
          ],
          application_context: {
            brand_name: 'PayPilot AI',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            return_url: 'http://localhost:3000/payment-success',
            cancel_url: 'http://localhost:3000/payment-cancel'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          timeout: 10000
        }
      );

      const links = response.data.links || [];
      const approveLinkObj = links.find((l: any) => l.rel === 'approve');

      return {
        orderId: response.data.id,
        status: response.data.status,
        approveUrl: approveLinkObj?.href,
        raw: response.data
      };
    } catch (err: any) {
      console.error('[PayPal Create Order Error]', err.response?.data || err.message);
      const msg = err.response?.data?.details?.[0]?.issue || err.response?.data?.message || err.message;
      throw new Error(`PayPal Order creation failed: ${msg}`);
    }
  }

  // Orders v2 API - Capture Order
  public async captureOrder(orderId: string): Promise<PayPalCaptureResponse> {
    if (!orderId || typeof orderId !== 'string' || !orderId.trim()) {
      throw new Error('Order ID is required to capture PayPal payment.');
    }

    if (!this.isCredentialsConfigured()) {
      throw new Error('PayPal Sandbox credentials (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET) are missing or unconfigured in server/.env.');
    }

    console.log(`[PayPal Orders v2 API] Capturing Order at ${this.baseURL}: ${orderId}`);

    try {
      const accessToken = await this.getAccessToken();
      const response = await axios.post(
        `${this.baseURL}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          timeout: 10000
        }
      );

      const captureObj = response.data.purchase_units?.[0]?.payments?.captures?.[0];
      const captureStatus = captureObj?.status || response.data.status;

      if (captureStatus !== 'COMPLETED') {
        throw new Error(`PayPal payment capture not completed. PayPal status returned: ${captureStatus}`);
      }

      return {
        captureId: captureObj?.id || response.data.id,
        status: captureStatus,
        payerEmail: response.data.payer?.email_address,
        payerName: response.data.payer?.name ? `${response.data.payer.name.given_name} ${response.data.payer.name.surname}` : undefined,
        raw: response.data
      };
    } catch (err: any) {
      console.error('[PayPal Capture Order Error]', err.response?.data || err.message);
      const msg = err.response?.data?.details?.[0]?.issue || err.response?.data?.message || err.message;
      throw new Error(`PayPal Order capture failed: ${msg}`);
    }
  }
}

export const paypalService = new PayPalService();
