import React, { useState } from 'react';
import { Brain, Sparkles, Loader2, AlertCircle, Bot, History, CheckCircle2, Copy, Info } from 'lucide-react';
import { Transaction } from '../types/payment';
import { api } from '../services/api';

interface Props {
  onSelectTransaction: (tx: Transaction) => void;
}

export const AIPaymentMemory: React.FC<Props> = ({ onSelectTransaction }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [matchingTx, setMatchingTx] = useState<Transaction[]>([]);
  const [providerUsed, setProviderUsed] = useState('');
  const [copied, setCopied] = useState(false);

  const exampleQuestions = [
    "How much did I pay Rahul?",
    "Show my recent payments",
    "What was my largest payment?",
    "How much did I spend on food?"
  ];

  const handleAskMemory = async (qText?: string) => {
    const textToAsk = qText || question;
    if (!textToAsk.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await api.askPaymentMemory(textToAsk);
      setAnswer(res.answer);
      setMatchingTx(res.matchingTransactions || []);
      setProviderUsed(res.providerUsed || 'AI Engine');
    } catch (err: any) {
      console.error('[AI Payment Memory Error]', err);
      setError(err.response?.data?.error || err.message || 'Failed to query AI payment memory');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnswer = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Ask About Your Payments</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ask questions about your completed payment history.
          </p>
        </div>

        {providerUsed && (
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Engine: <strong>{providerUsed}</strong></span>
          </div>
        )}
      </div>

      {/* Input Card */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          Enter Your Question:
        </label>

        <div className="relative flex items-center">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskMemory()}
            placeholder="e.g. How much did I pay Rahul?"
            className="w-full pl-4 pr-36 py-4 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
          />
          <button
            onClick={() => handleAskMemory()}
            disabled={loading || !question.trim()}
            className="absolute right-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 via-blue-600 to-amber-500 hover:brightness-110 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md disabled:opacity-40 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Ask AI</span>
              </>
            )}
          </button>
        </div>

        {/* Example Chips */}
        <div className="pt-2 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
            Example Questions:
          </span>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(ex);
                  handleAskMemory(ex);
                }}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/80 hover:border-indigo-500/40 border border-slate-700/80 text-slate-300 hover:text-indigo-300 transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>"{ex}"</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Answer Area */}
      {answer && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="glass-panel rounded-2xl p-6 border border-indigo-500/30 space-y-4 glow-blue">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-indigo-400">
                <Bot className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">AI Payment Memory Insight</h3>
              </div>
              
              <button
                onClick={handleCopyAnswer}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Answer'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm sm:text-base font-medium leading-relaxed">
              "{answer}"
            </div>

            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 pt-1">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Answers are based strictly on recorded COMPLETED transactions in your database.</span>
            </div>
          </div>

          {/* Matching Transactions */}
          {matchingTx.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
                <History className="w-4 h-4 text-blue-400" />
                <span>Matching Completed Transactions ({matchingTx.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchingTx.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="glass-card rounded-xl p-4 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-white text-sm">{tx.recipient}</h4>
                        <p className="text-xs text-slate-400">{tx.purpose}</p>
                      </div>
                      <span className="font-extrabold text-emerald-400 text-sm font-mono">
                        {tx.currency} {tx.amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/20 font-bold">
                        {tx.status}
                      </span>
                      <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
