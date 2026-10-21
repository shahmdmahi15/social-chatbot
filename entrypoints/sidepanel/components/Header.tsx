import React from 'react';
import type { BotMode, BotStatus } from '../../../types';
import { StatusBadge } from './StatusBadge';
import { MessageSquareText, Zap, ShieldCheck, PowerOff } from 'lucide-react';

interface Props {
  status: BotStatus;
  botMode: BotMode;
  onModeChange: (mode: BotMode) => void;
}

export const Header: React.FC<Props> = ({ status, botMode, onModeChange }) => {
  return (
    <header className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <MessageSquareText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold bg-gradient-to-r from-cyan-300 via-indigo-200 to-white bg-clip-text text-transparent">
              Social Auto-Chat AI
            </h1>
            <p className="text-[10px] text-slate-400">Messenger Agent</p>
          </div>
        </div>

        <StatusBadge status={status} />
      </div>

      {/* Mode Selector Pill Buttons */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/70 rounded-lg border border-slate-800 text-xs">
        <button
          onClick={() => onModeChange('autopilot')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-all ${
            botMode === 'autopilot'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm shadow-cyan-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Auto-Pilot
        </button>

        <button
          onClick={() => onModeChange('manual_approval')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-all ${
            botMode === 'manual_approval'
              ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-sm shadow-amber-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Review First
        </button>

        <button
          onClick={() => onModeChange('disabled')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-all ${
            botMode === 'disabled'
              ? 'bg-rose-900/60 text-rose-300 border border-rose-700/60 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <PowerOff className="w-3.5 h-3.5" />
          Off
        </button>
      </div>
    </header>
  );
};
