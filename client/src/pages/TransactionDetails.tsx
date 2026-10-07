import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, CheckCircle2, Copy, Code, Calendar, DollarSign, User, Tag } from 'lucide-react';
import { Transaction } from '../types/payment';

interface Props {
  transaction: Transaction;
  onBack: () => void;
}

export const TransactionDetails: React.FC<Props> = ({ transaction, onBack }) => {
  const [showRawJson, setShowRawJson] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(transaction.paypalOrderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Transaction History</span>
      </button>

      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-extrabold text-lg">
              {transaction.recipient.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{transaction.recipient}</h1>
              <p className="text-xs text-slate-400">Transaction ID: {transaction.id}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              {transaction.currency} {transaction.amount.toFixed(2)}
            </div>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              {transaction.status}
            </span>
          </div>
        </div>
      </div>

      {/* AI Summary Card */}
      {transaction.aiSummary && (
        <div className="glass-panel rounded-2xl p-6 border border-blue-500/30 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
            <FileText className="w-4 h-4" />
            <span>PayPilot AI Summary</span>
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed italic bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
            "{transaction.aiSummary}"
          </p>
        </div>
      )}

      {/* Main Breakdown Grid */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-3">
          Payment Attributes & PayPal Metadata
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">PayPal Order ID</span>
            <div className="flex items-center space-x-2 font-mono text-slate-200 font-semibold">
              <span className="truncate">{transaction.paypalOrderId}</span>
              <button onClick={handleCopyId} className="text-slate-400 hover:text-white">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">PayPal Capture ID</span>
            <div className="font-mono text-slate-200 font-semibold">
              {transaction.paypalCaptureId || 'CAP-SANDBOX-SUCCESS'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">Purpose / Description</span>
            <div className="text-slate-200 font-semibold">{transaction.purpose}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[11px] block">Created Date</span>
            <div className="text-slate-200 font-semibold">{new Date(transaction.createdAt).toLocaleString()}</div>
          </div>

          {transaction.notes && (
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[11px] block">Notes</span>
              <div className="text-slate-300 italic">{transaction.notes}</div>
            </div>
          )}

        </div>
      </div>

      {/* Safety Analysis Rating Box */}
      <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">AI Context Security Rating</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
            {transaction.riskLevel} RISK ({transaction.riskScore}/100)
          </span>
        </div>

        <p className="text-xs text-slate-300">
          This payment was evaluated prior to execution. PayPilot AI checked recipient patterns, currency consistency, and amount limits.
        </p>

        {transaction.riskReasons && transaction.riskReasons.length > 0 && (
          <div className="pt-2 border-t border-slate-800 text-xs">
            <span className="font-semibold text-slate-400 block mb-1">Risk Factors Evaluated:</span>
            <ul className="list-disc list-inside text-slate-300 space-y-0.5">
              {transaction.riskReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Developer Raw Payload Inspector */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3">
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200"
        >
          <div className="flex items-center space-x-2">
            <Code className="w-4 h-4 text-blue-400" />
            <span>Developer Payload Inspector (PayPal Orders v2 Schema)</span>
          </div>
          <span>{showRawJson ? 'Hide JSON' : 'Show JSON'}</span>
        </button>

        {showRawJson && (
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-blue-300 overflow-x-auto">
            {JSON.stringify(transaction, null, 2)}
          </pre>
        )}
      </div>

    </div>
  );
};
