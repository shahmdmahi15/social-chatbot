import React, { useState } from 'react';
import type { ActivityLog } from '../../../types';
import { clearLogs } from '../../../utils/storage';
import {
  Trash2,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Keyboard,
  Send,
  Eye,
} from 'lucide-react';

interface Props {
  logs: ActivityLog[];
  onLogsCleared: () => void;
}

export const LogsTab: React.FC<Props> = ({ logs, onLogsCleared }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.toLowerCase();
    return (
      log.message.toLowerCase().includes(q) ||
      log.threadName.toLowerCase().includes(q) ||
      log.type.toLowerCase().includes(q)
    );
  });

  const handleClear = async () => {
    if (confirm('Clear all activity logs?')) {
      await clearLogs();
      onLogsCleared();
    }
  };

  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'incoming':
        return <Clock className="w-3.5 h-3.5 text-blue-400" />;
      case 'coalescing':
        return <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
      case 'thinking':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-spin" />;
      case 'typing':
        return <Keyboard className="w-3.5 h-3.5 text-cyan-400" />;
      case 'sent':
        return <Send className="w-3.5 h-3.5 text-emerald-400" />;
      case 'approval_required':
        return <Eye className="w-3.5 h-3.5 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <CheckCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search activity logs..."
            className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>
        <button
          onClick={handleClear}
          title="Clear all logs"
          className="p-2 rounded-lg bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1.5 max-h-[460px] overflow-y-auto">
        {filteredLogs.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            {searchTerm ? 'No matching logs found.' : 'No activity recorded yet.'}
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs flex flex-col gap-1.5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  {getLogIcon(log.type)}
                  <span className="truncate max-w-[150px]">{log.threadName || 'Messenger'}</span>
                </span>
                <span className="text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-slate-200 text-[11px] leading-relaxed break-words bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/50">
                {log.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
