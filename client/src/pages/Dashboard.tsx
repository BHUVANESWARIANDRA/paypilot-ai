import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, TrendingUp, DollarSign, Activity, History, Zap, CheckCircle2, ChevronRight, AlertCircle, Bot, Brain, CreditCard, Send } from 'lucide-react';
import { Transaction, TransactionStats } from '../types/payment';
import { api } from '../services/api';

interface DashboardProps {
  onNavigate: (tab: string, initialPrompt?: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onSelectTransaction }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbMode, setDbMode] = useState('MEMORY');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.getTransactions();
      setTransactions(data.transactions);
      setStats(data.stats);
      setDbMode(data.databaseMode);
    } catch (e) {
      console.error('Failed to load dashboard transactions', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>PayPal AI Hackathon Entry</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            PayPilot <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300">AI</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-200 font-semibold">
            "Your intelligent assistant for safer, simpler payments."
          </p>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
            PayPilot AI parses payment requests in natural language, evaluates contextual risk parameters, presents a transparent preview, and executes payments securely via PayPal Sandbox Orders v2 API.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <button
              onClick={() => onNavigate('assistant')}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-blue-600/25 flex items-center space-x-2 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Make a Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('memory')}
              className="px-6 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 flex items-center space-x-2 transition-all"
            >
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Ask About My Payments</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Core Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Feature 1: Understand */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3 hover:border-blue-500/40 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xl">
            🤖
          </div>
          <h3 className="text-lg font-bold text-white">Understand</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Describe a payment naturally. AI extracts recipient, amount, currency, purpose, and detects missing information automatically.
          </p>
        </div>

        {/* Feature 2: Protect */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3 hover:border-amber-500/40 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-xl">
            🛡️
          </div>
          <h3 className="text-lg font-bold text-white">Protect</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Review explainable payment risk signals before authorizing. Always requires your explicit human-in-the-loop preview confirmation.
          </p>
        </div>

        {/* Feature 3: Pay */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-3 hover:border-emerald-500/40 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xl">
            💳
          </div>
          <h3 className="text-lg font-bold text-white">Pay</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Confirm and complete through authentic server-side PayPal Sandbox Orders v2 API without exposing secrets.
          </p>
        </div>

      </div>

      {/* Payment Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            {stats?.totalsByCurrency && Object.keys(stats.totalsByCurrency).length > 0 ? (
              Object.entries(stats.totalsByCurrency).map(([curr, sum]) => (
                <div key={curr} className="text-xl font-bold text-white font-mono">
                  {curr} {sum.toFixed(2)}
                </div>
              ))
            ) : (
              <div className="text-2xl font-bold text-white font-mono">$0.00</div>
            )}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">PayPal Sandbox Settled</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Completed Orders</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {stats ? stats.completedCount : 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Verified Orders v2</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Safety Rating</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            {stats ? stats.safetyRating : 100}%
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Low Risk Context Score</span>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Database Mode</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300">
            {dbMode}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {dbMode === 'SUPABASE' ? 'Supabase Postgres Connected' : 'Local Store Active'}
          </span>
        </div>
      </div>

      {/* Recent Completed Transactions List */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-bold text-white">Recent Completed Transactions</h3>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
            Loading completed transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No completed payments yet.</p>
            <p className="text-xs text-slate-500">Click "Make a Payment" above to describe and execute your first payment via PayPal Sandbox.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="py-3.5 px-3 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                    {tx.recipient.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{tx.recipient}</h4>
                    <p className="text-xs text-slate-400">{tx.purpose}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-white font-mono">
                    {tx.currency} {tx.amount.toFixed(2)}
                  </div>
                  <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold">
                      {tx.status}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
