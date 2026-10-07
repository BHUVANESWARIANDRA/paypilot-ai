import React from 'react';
import { CheckCircle2, Bot, ExternalLink, ArrowRight, RotateCcw, Brain, Copy, FileText, Calendar, User, DollarSign } from 'lucide-react';
import { Transaction } from '../types/payment';

interface Props {
  transaction: Transaction;
  onNewPayment: () => void;
  onViewHistory: () => void;
  onAskMemory?: (question: string) => void;
}

export const PaymentResult: React.FC<Props> = ({
  transaction,
  onNewPayment,
  onViewHistory,
  onAskMemory
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(transaction.paypalOrderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskAboutPayment = () => {
    if (onAskMemory) {
      onAskMemory(`How much did I pay ${transaction.recipient}?`);
    } else {
      onViewHistory();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
      
      {/* Success Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 p-8 sm:p-10 text-center space-y-4 shadow-2xl">
        
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            PAYPAL SANDBOX VERIFIED
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
            ✓ Payment Completed
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Order captured & confirmed via PayPal Sandbox Orders v2 API.
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
          <span>Order ID: <strong>{transaction.paypalOrderId}</strong></span>
          <button onClick={handleCopyId} className="text-slate-400 hover:text-white transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
          {copied && <span className="text-emerald-400 text-[10px]">Copied!</span>}
        </div>

      </div>

      {/* AI Payment Summary */}
      {transaction.aiSummary && (
        <div className="glass-panel rounded-2xl p-6 border border-blue-500/30 space-y-3 glow-blue">
          <div className="flex items-center space-x-2 text-blue-400">
            <Bot className="w-5 h-5" />
            <h3 className="font-bold text-sm text-white">AI Receipt Summary</h3>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed italic bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            "{transaction.aiSummary}"
          </p>
        </div>
      )}

      {/* Transaction Details Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3 flex items-center space-x-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Completed Transaction Receipt</span>
        </h3>

        <div className="divide-y divide-slate-800/80 text-xs">
          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-400">Recipient</span>
            <span className="font-semibold text-white">{transaction.recipient}</span>
          </div>

          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-400">Amount</span>
            <span className="font-bold text-emerald-400 text-sm font-mono">
              {transaction.currency} {transaction.amount.toFixed(2)}
            </span>
          </div>

          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-400">Purpose</span>
            <span className="font-medium text-slate-200">{transaction.purpose}</span>
          </div>

          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-400">PayPal Order ID</span>
            <span className="font-mono text-slate-300">{transaction.paypalOrderId}</span>
          </div>

          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-400">PayPal Capture ID</span>
            <span className="font-mono text-slate-300">{transaction.paypalCaptureId || 'CAP-SANDBOX-SUCCESS'}</span>
          </div>

          <div className="py-3 flex justify-between items-center">
            <span className="text-slate-400">Date/Time</span>
            <span className="text-slate-300">{new Date(transaction.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <button
          onClick={onViewHistory}
          className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors border border-slate-700"
        >
          <ExternalLink className="w-4 h-4 text-blue-400" />
          <span>View Transaction</span>
        </button>

        <button
          onClick={handleAskAboutPayment}
          className="px-4 py-3 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 text-indigo-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors border border-indigo-500/30"
        >
          <Brain className="w-4 h-4 text-indigo-400" />
          <span>Ask AI About This Payment</span>
        </button>

        <button
          onClick={onNewPayment}
          className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/25 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Make Another Payment</span>
        </button>
      </div>

    </div>
  );
};
