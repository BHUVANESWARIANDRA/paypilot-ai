import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, ShieldCheck, Key, Database, Bot, RefreshCw, CheckCircle2, AlertCircle, Terminal } from 'lucide-react';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await api.getHealthStatus();
      setHealth(data);
    } catch (e) {
      console.error('Failed to load system status', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">System Settings & Integration Status</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitor PayPal Sandbox credentials, AI provider abstraction status, and Supabase connection settings.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh System Health</span>
        </button>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* PayPal Sandbox Status */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">PayPal Sandbox</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>

          <div>
            <div className="text-lg font-bold text-white">
              {health?.paypalMode?.toUpperCase() || 'SANDBOX'}
            </div>
            <span className="text-[11px] text-slate-400">Orders v2 REST API</span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center space-x-1.5 text-xs">
            {health?.hasPayPalCredentials ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Live Client Secret Loaded</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-300">Simulated Sandbox Active</span>
              </>
            )}
          </div>
        </div>

        {/* AI Provider Status */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Provider</span>
            <Bot className="w-4 h-4 text-blue-400" />
          </div>

          <div>
            <div className="text-lg font-bold text-blue-300">
              {health?.aiProvider?.toUpperCase() || 'FALLBACK'}
            </div>
            <span className="text-[11px] text-slate-400">Configured via AI_PROVIDER</span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center space-x-1.5 text-xs text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Abstraction Layer Ready</span>
          </div>
        </div>

        {/* Database Status */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Layer</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>

          <div>
            <div className="text-lg font-bold text-emerald-400">
              Supabase / Memory
            </div>
            <span className="text-[11px] text-slate-400">PostgreSQL Schema Ready</span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center space-x-1.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Schema DDL Available</span>
          </div>
        </div>

      </div>

      {/* Environment Variable Setup Instructions */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span>Environment Variable Guide (.env)</span>
        </h3>

        <p className="text-xs text-slate-300">
          PayPilot AI separates backend server configuration securely. Never commit secrets to frontend code.
        </p>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`# Backend Server Port
PORT=5000

# PayPal Sandbox Credentials (Orders v2 API)
PAYPAL_CLIENT_ID=your_paypal_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_paypal_sandbox_client_secret
PAYPAL_MODE=sandbox

# AI Provider Configuration ('gemini', 'openai', or 'fallback')
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Supabase Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key`}
        </pre>
      </div>

    </div>
  );
};
