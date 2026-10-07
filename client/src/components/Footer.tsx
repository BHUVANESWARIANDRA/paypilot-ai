import React from 'react';
import { ShieldCheck, Lock, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
        
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200 text-sm">PayPilot AI</span>
            <span className="text-slate-400">• Built for PayPal AI Hackathon</span>
          </div>
          <p className="text-slate-400">
            "Your intelligent assistant for safer, simpler payments."
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <div className="flex items-center space-x-1.5 text-emerald-400/90">
            <Lock className="w-3.5 h-3.5" />
            <span>Strict Server-Side Credentials</span>
          </div>
          <div className="flex items-center space-x-1.5 text-blue-400/90">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PayPal Orders v2 API</span>
          </div>
          <a 
            href="https://developer.paypal.com/docs/api/orders/v2/" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center space-x-1 hover:text-slate-200 transition-colors"
          >
            <span>PayPal Sandbox Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

      </div>
    </footer>
  );
};
