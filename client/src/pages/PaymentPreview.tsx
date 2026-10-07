import React, { useState } from 'react';
import { Shield, ArrowLeft, AlertCircle, Lock, FileText, User, DollarSign, Tag, Info, CheckCircle2 } from 'lucide-react';
import { ParsedAIResponse, AgentStep } from '../types/payment';
import { RiskAnalysisBadge } from '../components/RiskAnalysisBadge';
import { PayPalButtonContainer } from '../components/PayPalButtonContainer';
import { AgentActivityStepper } from '../components/AgentActivityStepper';

interface Props {
  parsedData: ParsedAIResponse;
  onBack: () => void;
  onSuccess: (result: { transaction: any; capture: any }) => void;
  hasCredentials?: boolean;
}

export const PaymentPreview: React.FC<Props> = ({
  parsedData,
  onBack,
  onSuccess,
  hasCredentials = true
}) => {
  const { paymentDetails, riskAnalysis } = parsedData;
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [paypalStage, setPaypalStage] = useState<'idle' | 'creating' | 'approving' | 'capturing' | 'success' | 'failed'>('idle');

  const level = riskAnalysis.level ?? riskAnalysis.riskLevel ?? 'LOW';

  const hist = riskAnalysis?.historicalContext;
  let histDesc = 'No prior completed payment history found';
  if (hist && hist.recipientFound) {
    histDesc = `${hist.previousPaymentCount} previous completed payment(s) found (Avg: ${paymentDetails.currency} ${hist.averagePaymentToRecipient?.toFixed(2)})`;
  } else if (paymentDetails.recipient) {
    histDesc = `First-time payment to recipient '${paymentDetails.recipient}' (no prior history found)`;
  }

  const score = riskAnalysis?.score ?? riskAnalysis?.riskScore ?? 10;

  const agentSteps: AgentStep[] = [
    {
      id: 'intent',
      title: 'Payment Intent Understood',
      description: `${paymentDetails.recipient} · ${paymentDetails.currency} ${paymentDetails.amount.toFixed(2)} · ${paymentDetails.purpose}`,
      status: 'completed',
      metadata: `Confidence: ${Math.round((parsedData.paymentIntent?.confidence || 0.95) * 100)}%`
    },
    {
      id: 'history',
      title: 'Transaction History Retrieved',
      description: histDesc,
      status: 'completed',
      metadata: `Database Mode: ${hist?.recipientFound ? 'Known Recipient' : 'New Recipient'}`
    },
    {
      id: 'safety',
      title: 'Payment Safety Evaluated',
      description: riskAnalysis?.reasons?.[0] || 'No elevated risk signals detected.',
      status: 'completed',
      metadata: `Risk: ${level} (${score}/100)`
    },
    {
      id: 'approval',
      title: 'Waiting for User Approval',
      description: isConfirmed
        ? 'Explicit user authorization granted'
        : 'Review details and check authorization box below to unlock PayPal',
      status: isConfirmed ? 'completed' : 'waiting'
    },
    {
      id: 'paypal',
      title: 'PayPal Payment Executed',
      description:
        paypalStage === 'creating' ? 'Creating PayPal Sandbox order v2 on backend...' :
        paypalStage === 'approving' ? 'Waiting for buyer approval in PayPal Sandbox window...' :
        paypalStage === 'capturing' ? 'Capturing order & verifying status on backend...' :
        paypalStage === 'success' ? 'PayPal Sandbox order created and captured successfully' :
        paypalStage === 'failed' ? 'PayPal transaction error or cancellation' :
        'Create and capture order via PayPal Sandbox Orders v2 API',
      status:
        paypalStage === 'creating' || paypalStage === 'approving' || paypalStage === 'capturing' ? 'active' :
        paypalStage === 'success' ? 'completed' :
        paypalStage === 'failed' ? 'failed' :
        isConfirmed ? 'waiting' : 'pending'
    },
    {
      id: 'confirmation',
      title: 'Payment Confirmed',
      description:
        paypalStage === 'success' ? 'Transaction recorded in database with Order ID & Capture ID' :
        paypalStage === 'capturing' ? 'Awaiting server capture verification...' :
        'Record completed transaction and generate AI receipt summary',
      status: paypalStage === 'success' ? 'completed' : (paypalStage === 'capturing' ? 'active' : 'pending')
    }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      
      {/* Top Navigation Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assistant / Edit Parameters</span>
      </button>

      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-amber-500/30 glow-gold space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Payment Preview</h1>
              <p className="text-xs text-slate-400">Review parameters & safety explanations before explicit confirmation.</p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-amber-300">
            SANDBOX ORDER
          </span>
        </div>
      </div>

      {/* AI Agent Activity Stepper */}
      <AgentActivityStepper steps={agentSteps} title="PayPilot AI Agent Execution Stepper" />

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Breakdown Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
          Payment Details Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Recipient</span>
            </span>
            <div className="text-lg font-bold text-white">{paymentDetails.recipient}</div>
            <span className="text-[11px] text-slate-500">PayPal Sandbox Recipient</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payment Amount & Currency</span>
            </span>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {paymentDetails.currency} {paymentDetails.amount.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500">Orders v2 payload</span>
          </div>

          <div className="sm:col-span-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>Purpose</span>
            </span>
            <div className="text-sm font-semibold text-slate-200">{paymentDetails.purpose}</div>
          </div>

          {paymentDetails.notes && (
            <div className="sm:col-span-2 p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Notes & Metadata</span>
              </span>
              <div className="text-xs text-slate-300 italic">{paymentDetails.notes}</div>
            </div>
          )}

        </div>
      </div>

      {/* AI Payment Safety */}
      <RiskAnalysisBadge riskAnalysis={riskAnalysis} />

      {/* Explicit User Confirmation Box */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        
        {level === 'HIGH' && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>High risk signals detected. Careful review required before confirming below.</span>
          </div>
        )}

        <label className="flex items-start space-x-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isConfirmed}
            onChange={(e) => setIsConfirmed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-950"
          />
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-slate-200 block">
              I have reviewed the payment details
            </span>
            <span className="text-slate-400 block">
              I explicitly authorize PayPilot AI to process {paymentDetails.currency} {paymentDetails.amount.toFixed(2)} to {paymentDetails.recipient} via PayPal Sandbox.
            </span>
          </div>
        </label>

        {/* PayPal Execution Section */}
        {isConfirmed ? (
          <div className="pt-2 border-t border-slate-800/80">
            <PayPalButtonContainer
              paymentDetails={paymentDetails}
              onSuccess={onSuccess}
              onError={(err) => setError(err)}
              hasCredentials={hasCredentials}
              onStageChange={setPaypalStage}
            />
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400/70" />
            <span>Check "I have reviewed the payment details" above to unlock "Continue with PayPal".</span>
          </div>
        )}
      </div>

    </div>
  );
};
