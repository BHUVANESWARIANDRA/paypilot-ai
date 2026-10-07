import React from 'react';
import { Check, Clock, AlertCircle, Loader2, Circle, X, Bot } from 'lucide-react';
import { AgentStep, AgentStepStatus } from '../types/payment';

interface Props {
  steps: AgentStep[];
  className?: string;
  title?: string;
}

export const AgentActivityStepper: React.FC<Props> = ({
  steps,
  className = '',
  title = 'PayPilot AI Agent Execution Trace'
}) => {
  const getStepBadge = (status: AgentStepStatus) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
        );
      case 'active':
        return (
          <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 flex items-center justify-center flex-shrink-0 relative">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          </div>
        );
      case 'waiting':
        return (
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'failed':
        return (
          <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center flex-shrink-0">
            <X className="w-4 h-4 stroke-[3]" />
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-700 text-slate-500 flex items-center justify-center flex-shrink-0">
            <Circle className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  const getStatusTextClass = (status: AgentStepStatus) => {
    switch (status) {
      case 'completed':
        return 'text-white font-semibold';
      case 'active':
        return 'text-blue-300 font-bold';
      case 'waiting':
        return 'text-amber-300 font-semibold';
      case 'failed':
        return 'text-rose-300 font-semibold';
      case 'pending':
      default:
        return 'text-slate-500 font-normal';
    }
  };

  const getStatusBadgeLabel = (status: AgentStepStatus) => {
    switch (status) {
      case 'completed':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 uppercase font-bold">COMPLETED</span>;
      case 'active':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/30 uppercase font-bold animate-pulse">RUNNING</span>;
      case 'waiting':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 uppercase font-bold">WAITING</span>;
      case 'failed':
        return <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-500/30 uppercase font-bold">FAILED</span>;
      case 'pending':
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 uppercase font-medium">PENDING</span>;
    }
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 border border-slate-800 space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
          Real Backend States
        </span>
      </div>

      <div className="space-y-3 relative">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start space-x-3.5 group">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-[13px] top-7 bottom-0 w-[2px] -mb-3 transition-colors ${
                    step.status === 'completed'
                      ? 'bg-emerald-500/40'
                      : step.status === 'active'
                      ? 'bg-blue-500/40'
                      : 'bg-slate-800'
                  }`}
                />
              )}

              {/* Icon Badge */}
              <div className="z-10 bg-[#090d16] rounded-full">
                {getStepBadge(step.status)}
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0 pt-0.5 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs sm:text-sm tracking-tight ${getStatusTextClass(step.status)}`}>
                    {step.title}
                  </h4>
                  {getStatusBadgeLabel(step.status)}
                </div>

                {step.description && (
                  <p className={`text-xs leading-relaxed ${step.status === 'pending' ? 'text-slate-600' : 'text-slate-300'}`}>
                    {step.description}
                  </p>
                )}

                {step.metadata && (
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 inline-block mt-1">
                    {step.metadata}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
