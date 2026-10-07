import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Loader2, AlertCircle, ArrowRight, RefreshCw, CheckCircle2, ShieldCheck, MessageSquareText, Send } from 'lucide-react';
import { ParsedAIResponse, PaymentDetails, AgentStep } from '../types/payment';
import { api } from '../services/api';
import { RiskAnalysisBadge } from '../components/RiskAnalysisBadge';
import { AgentActivityStepper } from '../components/AgentActivityStepper';

interface Props {
  initialPrompt?: string;
  onProceedToPreview: (parsedData: ParsedAIResponse) => void;
}

export const AIAssistant: React.FC<Props> = ({ initialPrompt = '', onProceedToPreview }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedAIResponse | null>(null);

  // Editable payment fields state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState('USD');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Agent Activity Stepper State
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([
    { id: 'intent', title: 'Payment Intent Understood', description: 'Extract recipient, amount, currency, and purpose from request', status: 'pending' },
    { id: 'history', title: 'Transaction History Retrieved', description: 'Search database for recipient payment records and average spending', status: 'pending' },
    { id: 'safety', title: 'Payment Safety Evaluated', description: 'Evaluate parameter signals, amount limits, and category risks', status: 'pending' },
    { id: 'approval', title: 'Waiting for User Approval', description: 'Review preview breakdown and explicitly authorize before payment', status: 'pending' },
    { id: 'paypal', title: 'PayPal Payment Executed', description: 'Create and capture order via PayPal Sandbox Orders v2 API', status: 'pending' },
    { id: 'confirmation', title: 'Payment Confirmed', description: 'Record completed transaction and generate AI receipt summary', status: 'pending' },
  ]);

  useEffect(() => {
    if (initialPrompt) {
      handleAnalyze(initialPrompt);
    }
  }, [initialPrompt]);

  const handleAnalyze = async (textToParse?: string) => {
    const text = textToParse || prompt;
    if (!text.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Mark Step 1 Active
      setAgentSteps(prev => prev.map(s => {
        if (s.id === 'intent') return { ...s, status: 'active', description: 'Parsing natural language request into structured fields...' };
        return { ...s, status: 'pending' };
      }));

      const res = await api.parsePaymentPrompt(text);
      setResult(res);

      const intent = res.paymentIntent;
      const parsedRecipient = intent?.recipient || res.paymentDetails.recipient || '';
      const parsedAmount = intent?.amount !== null && intent?.amount !== undefined ? intent.amount : (res.paymentDetails.amount || '');
      const parsedCurrency = intent?.currency || res.paymentDetails.currency || 'USD';
      const parsedPurpose = intent?.purpose || res.paymentDetails.purpose || '';
      const parsedNotes = intent?.notes || res.paymentDetails.notes || '';

      setRecipient(parsedRecipient);
      setAmount(parsedAmount);
      setCurrency(parsedCurrency);
      setPurpose(parsedPurpose);
      setNotes(parsedNotes);

      // Build real step metadata from actual backend response
      const missing = res.paymentDetails.missingFields || [];
      const isCompleteIntent = missing.length === 0;

      const hist = res.riskAnalysis?.historicalContext;
      let histDesc = 'No prior completed payment history found';
      if (hist && hist.recipientFound) {
        histDesc = `${hist.previousPaymentCount} previous completed payment(s) found (Avg: ${parsedCurrency} ${hist.averagePaymentToRecipient?.toFixed(2)})`;
      } else if (parsedRecipient) {
        histDesc = `First-time payment to recipient '${parsedRecipient}' (no prior history found)`;
      }

      const score = res.riskAnalysis?.score ?? res.riskAnalysis?.riskScore ?? 10;
      const level = res.riskAnalysis?.level ?? res.riskAnalysis?.riskLevel ?? 'LOW';

      // 2. Update Stepper with real API state
      setAgentSteps([
        {
          id: 'intent',
          title: 'Payment Intent Understood',
          description: isCompleteIntent
            ? `${parsedRecipient} · ${parsedCurrency} ${Number(parsedAmount).toFixed(2)} · ${parsedPurpose}`
            : `Missing required info: ${missing.join(', ')}`,
          status: isCompleteIntent ? 'completed' : 'failed',
          metadata: `Confidence: ${res.paymentDetails.confidenceScore}%`
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
          description: res.riskAnalysis?.reasons?.[0] || 'No elevated risk signals detected.',
          status: 'completed',
          metadata: `Risk: ${level} (${score}/100)`
        },
        {
          id: 'approval',
          title: 'Waiting for User Approval',
          description: 'Review details and explicitly authorize in Payment Preview before PayPal execution',
          status: isCompleteIntent ? 'waiting' : 'pending'
        },
        {
          id: 'paypal',
          title: 'PayPal Payment Executed',
          description: 'Create and capture order via PayPal Sandbox Orders v2 API',
          status: 'pending'
        },
        {
          id: 'confirmation',
          title: 'Payment Confirmed',
          description: 'Record completed transaction and generate AI receipt summary',
          status: 'pending'
        }
      ]);

    } catch (err: any) {
      console.error('[AI Parse Error]', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to process payment request';
      setError(errorMsg);

      setAgentSteps(prev => prev.map((s, idx) => {
        if (idx === 0) return { ...s, status: 'failed', description: `Parsing failed: ${errorMsg}` };
        return { ...s, status: 'pending' };
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (!result) return;

    const updatedDetails: PaymentDetails = {
      ...result.paymentDetails,
      recipient: recipient || 'Unspecified Recipient',
      amount: Number(amount) || 0,
      currency,
      purpose: purpose || 'Payment',
      notes,
      missingFields: []
    };

    if (!updatedDetails.recipient || updatedDetails.recipient === 'Unspecified Recipient') {
      updatedDetails.missingFields.push('recipient');
    }
    if (!updatedDetails.amount || updatedDetails.amount <= 0) {
      updatedDetails.missingFields.push('amount');
    }
    if (!updatedDetails.purpose) {
      updatedDetails.missingFields.push('purpose');
    }

    onProceedToPreview({
      ...result,
      paymentDetails: updatedDetails
    });
  };

  const examplePrompts = [
    "Pay $50 to Rahul for laptop repair",
    "Send $25 to Maria for dinner",
    "Pay $100 to ABC Services for equipment"
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Send className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">How can I help with your payment?</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Describe a payment in natural language. PayPilot AI extracts parameters and evaluates context safety.
          </p>
        </div>

        {result && (
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Engine: <strong>{result.providerUsed}</strong></span>
          </div>
        )}
      </div>

      {/* Input Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Natural Language Payment Request:
        </label>
        
        <div className="relative">
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Pay $50 to Rahul for laptop repair"
            className="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none shadow-inner"
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !prompt.trim()}
            className="absolute bottom-4 right-4 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-md disabled:opacity-40 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Understanding your payment...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Understand Payment</span>
              </>
            )}
          </button>
        </div>

        {/* Example Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
          <span className="font-semibold text-slate-500">Try example requests:</span>
          {examplePrompts.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(ex);
                handleAnalyze(ex);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-blue-950/80 hover:text-blue-300 text-slate-300 transition-colors border border-slate-700/60"
            >
              "{ex}"
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Agent Activity Stepper (Rendered during parsing & upon result) */}
      {(loading || result) && (
        <AgentActivityStepper steps={agentSteps} title="PayPilot AI Agent Workflow Stepper" />
      )}

      {/* AI Extraction & Safety Analysis */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Clarification or Confirmation Message Box */}
          {result.paymentIntent?.clarificationMessage && (
            <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-200 text-xs space-y-1 shadow-md">
              <div className="flex items-center space-x-2 font-bold text-amber-300">
                <MessageSquareText className="w-4 h-4 text-amber-400" />
                <span>AI Information Request:</span>
              </div>
              <p className="text-slate-200">{result.paymentIntent.clarificationMessage}</p>
            </div>
          )}

          {result.paymentIntent?.confirmationMessage && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs space-y-1 shadow-md">
              <div className="flex items-center space-x-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Structured Intent Confirmation Preview:</span>
              </div>
              <p className="text-slate-200">{result.paymentIntent.confirmationMessage}</p>
            </div>
          )}

          {/* Structured Information */}
          <div className="glass-panel rounded-2xl p-6 border border-blue-500/30 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Structured Payment Information</h3>
              </div>
              <div className="text-xs text-slate-400">
                Confidence: <strong className="text-blue-400">{Math.round((result.paymentIntent?.confidence || 0.95) * 100)}%</strong>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Recipient <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. Rahul, Maria, ABC Services"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Amount <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="50.00"
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Purpose <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Laptop repair"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Optional Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Service deposit"
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Safety */}
          <RiskAnalysisBadge riskAnalysis={result.riskAnalysis} />

          {/* Action to Generate Payment Preview */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400">
              * Payments are never executed automatically. Explicit preview confirmation is required.
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleAnalyze()}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-analyze</span>
              </button>

              <button
                onClick={handleProceed}
                disabled={!recipient || !amount || amount <= 0 || !purpose}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-blue-600/20 flex items-center space-x-2 disabled:opacity-40 transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>Generate Payment Preview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
