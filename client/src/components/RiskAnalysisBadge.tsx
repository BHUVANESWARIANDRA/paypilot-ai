import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Info, HelpCircle } from 'lucide-react';
import { RiskAnalysis } from '../types/payment';

interface Props {
  riskAnalysis: RiskAnalysis;
  showDetails?: boolean;
}

export const RiskAnalysisBadge: React.FC<Props> = ({ riskAnalysis, showDetails = true }) => {
  const score = riskAnalysis.score ?? riskAnalysis.riskScore ?? 10;
  const level = riskAnalysis.level ?? riskAnalysis.riskLevel ?? 'LOW';
  const reasons = riskAnalysis.reasons || (riskAnalysis.factors ? riskAnalysis.factors.map(f => f.message) : []);
  const recommendation = riskAnalysis.recommendation || (riskAnalysis.recommendations ? riskAnalysis.recommendations[0] : '');

  const isLow = level === 'LOW';
  const isMed = level === 'MEDIUM';

  const badgeTheme = isLow
    ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
    : isMed
    ? 'bg-amber-950/60 border-amber-500/30 text-amber-300'
    : 'bg-rose-950/60 border-rose-500/30 text-rose-300';

  const levelBadge = isLow
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : isMed
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

  const Icon = isLow ? ShieldCheck : isMed ? AlertTriangle : ShieldAlert;

  return (
    <div className={`rounded-2xl border p-5 transition-all space-y-4 ${badgeTheme}`}>
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border ${badgeTheme}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-base text-white">Explainable Payment Safety</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 font-semibold">
                AI Evaluated
              </span>
            </div>
            <p className="text-xs opacity-90 mt-0.5 text-slate-300">
              Objective contextual parameter analysis before payment authorization.
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-black font-mono tracking-tight text-white">
            {score}<span className="text-xs text-slate-400 font-sans">/100</span>
          </div>
          <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${levelBadge}`}>
            {level} RISK
          </span>
        </div>
      </div>

      {/* Explanations & Reasons List */}
      {showDetails && (
        <div className="pt-3 border-t border-slate-800/80 space-y-3">
          
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5 mb-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Safety Reasons & Parameter Signals:</span>
            </span>

            <ul className="space-y-1.5 pl-1">
              {reasons.map((reason, idx) => (
                <li key={idx} className="text-xs flex items-start space-x-2 text-slate-200">
                  <span className={`font-bold mt-0.5 ${isLow ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-rose-400'}`}>
                    •
                  </span>
                  <span className="leading-snug">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendation Box */}
          {recommendation && (
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 leading-relaxed">
              <strong className="text-amber-300 block mb-0.5">PayPilot Safety Recommendation:</strong>
              <span>{recommendation}</span>
            </div>
          )}

          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 italic pt-1">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>PayPilot AI evaluates parameters objectively. Final authorization remains with you.</span>
          </div>

        </div>
      )}

    </div>
  );
};
