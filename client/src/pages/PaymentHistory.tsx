import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Calendar, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';
import { Transaction } from '../types/payment';
import { api } from '../services/api';

interface Props {
  onSelectTransaction: (tx: Transaction) => void;
}

export const PaymentHistory: React.FC<Props> = ({ onSelectTransaction }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getTransactions();
      setTransactions(data.transactions);
    } catch (err) {
      console.error('Failed to load transaction history', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.paypalOrderId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk = riskFilter === 'ALL' || tx.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <History className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">Payment History</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete log of verified PayPal Sandbox payments.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by recipient, purpose, or PayPal Order ID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs animate-pulse">
            Loading payment records...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No completed payments yet.</p>
            <p className="text-xs text-slate-500">Completed PayPal transactions will appear here automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filtered.map((tx) => (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="p-4 sm:p-5 hover:bg-slate-800/40 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 sm:mt-0">
                    {tx.recipient.charAt(0).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-white text-sm sm:text-base">{tx.recipient}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                        {tx.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{tx.purpose}</p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                  <div className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                    {tx.currency} {tx.amount.toFixed(2)}
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                    <ExternalLink className="w-3 h-3 text-blue-400 ml-1" />
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
