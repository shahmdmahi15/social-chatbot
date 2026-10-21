import React from 'react';
import type { BotStatus } from '../../../types';
import { Bot, Eye, Loader2, Sparkles, Keyboard, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  status: BotStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  switch (status) {
    case 'idle':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          <Bot className="w-3.5 h-3.5 text-slate-400" />
          Idle
        </span>
      );
    case 'observing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          Observing Chat
        </span>
      );
    case 'coalescing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          Coalescing...
        </span>
      );
    case 'thinking':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-950/60 text-indigo-300 border border-indigo-800">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
          Thinking (AI)
        </span>
      );
    case 'typing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-800">
          <Keyboard className="w-3.5 h-3.5 animate-bounce text-cyan-400" />
          Typing...
        </span>
      );
    case 'waiting_approval':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-950/60 text-yellow-300 border border-yellow-700 animate-pulse">
          <Eye className="w-3.5 h-3.5 text-yellow-400" />
          Needs Approval
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-800">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          Error
        </span>
      );
    default:
      return null;
  }
};
