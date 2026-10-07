import React, { useState } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { Shield, ArrowRight, Loader2, CheckCircle2, Lock, AlertCircle, RefreshCw, Key } from 'lucide-react';
import { PaymentDetails } from '../types/payment';
import { api } from '../services/api';

interface Props {
  paymentDetails: PaymentDetails;
  onSuccess: (result: { transaction: any; capture: any }) => void;
  onError: (errorMsg: string) => void;
  hasCredentials?: boolean;
  onStageChange?: (stage: 'idle' | 'creating' | 'approving' | 'capturing' | 'success' | 'failed') => void;
}

export const PayPalButtonContainer: React.FC<Props> = ({
  paymentDetails,
  onSuccess,
  onError,
  hasCredentials = false,
  onStageChange
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Server-side create order trigger
  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setStatusMessage('Preparing payment...');
      onStageChange?.('creating');
      const order = await api.createPayPalOrder(paymentDetails);
      setStatusMessage('Waiting for PayPal approval...');
      onStageChange?.('approving');
      return order.orderId;
    } catch (err: any) {
      console.error('[Create Order Error]', err);
      const msg = err.response?.data?.error || err.message || 'Payment could not be completed.';
      setErrorMessage(msg);
      onError(msg);
      onStageChange?.('failed');
      setLoading(false);
      throw err;
    }
  };

  // Server-side capture order trigger
  const handleApprove = async (data: { orderID: string }) => {
    try {
      setLoading(true);
      setStatusMessage('Capturing payment...');
      onStageChange?.('capturing');
      await new Promise(r => setTimeout(r, 400));
      setStatusMessage('Verifying payment...');

      const result = await api.capturePayPalOrder(data.orderID, paymentDetails);
      setStatusMessage('Payment completed.');
      onStageChange?.('success');
      onSuccess(result);
    } catch (err: any) {
      console.error('[Capture Order Error]', err);
      const msg = err.response?.data?.error || err.message || 'Payment could not be completed.';
      setErrorMessage(msg);
      onStageChange?.('failed');
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  // User cancellation handler
  const handleCancel = () => {
    setLoading(false);
    setStatusMessage(null);
    onStageChange?.('failed');
    setErrorMessage('Payment cancelled. No completed transaction was recorded.');
  };

  if (!hasCredentials) {
    return (
      <div className="p-5 rounded-2xl bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs space-y-3">
        <div className="flex items-center space-x-2 font-bold text-amber-300 text-sm">
          <Key className="w-5 h-5 text-amber-400" />
          <span>PayPal Sandbox Credentials Required</span>
        </div>

        <p className="text-slate-300 leading-relaxed">
          PayPal API keys are unconfigured. To execute real payments via PayPal Sandbox, add your credentials to <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono">server/.env</code>:
        </p>

        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto">
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
        </pre>

        <p className="text-[11px] text-slate-400">
          Get your Sandbox API credentials from <a href="https://developer.paypal.com/dashboard/applications/sandbox" target="_blank" rel="noreferrer" className="text-blue-400 underline">PayPal Developer Dashboard</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {statusMessage && (
        <div className="flex items-center space-x-2 p-3.5 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400 flex-shrink-0" />
          <span className="font-semibold">{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setErrorMessage(null); setStatusMessage(null); }}
              className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-white font-semibold text-xs flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Payment</span>
            </button>
          </div>
        </div>
      )}

      <div className="p-1 rounded-xl bg-slate-900 border border-slate-800">
        <PayPalButtons
          style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
          createOrder={handleCreateOrder}
          onApprove={handleApprove}
          onCancel={handleCancel}
          onError={(err) => {
            setLoading(false);
            const msg = err.toString();
            setErrorMessage('Payment could not be completed.');
            onError(msg);
          }}
        />
      </div>

      <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 pt-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Authentic PayPal Sandbox API execution • Orders v2</span>
      </div>
    </div>
  );
};
