import React, { useState } from 'react';
import type { ChatThread, AppSettings, ActivityLog, DiscoveredContact } from '../../../types';
import {
  UserCheck,
  UserPlus,
  Users,
  Check,
  X,
  Send,
  Trash2,
  Sparkles,
  MessageCircle,
  Clock,
  RefreshCw,
  Search,
  MessageSquare,
} from 'lucide-react';

interface Props {
  currentThread: ChatThread | null;
  discoveredContacts: DiscoveredContact[];
  settings: AppSettings;
  pendingDraft: { threadId: string; text: string; threadName: string } | null;
  logs: ActivityLog[];
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onApproveDraft: (text: string) => void;
  onRejectDraft: () => void;
  onScanChats: () => void;
  onTriggerReplyNow?: () => void;
}

export const MonitorTab: React.FC<Props> = ({
  currentThread,
  discoveredContacts,
  settings,
  pendingDraft,
  logs,
  onUpdateSettings,
  onApproveDraft,
  onRejectDraft,
  onScanChats,
  onTriggerReplyNow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newContactInput, setNewContactInput] = useState('');
  const [editedDraft, setEditedDraft] = useState('');
  const [scanning, setScanning] = useState(false);

  // Sync draft text when draft changes
  React.useEffect(() => {
    if (pendingDraft) {
      setEditedDraft(pendingDraft.text);
    }
  }, [pendingDraft]);

  const isCurrentTargeted = currentThread
    ? settings.targetContacts.includes(currentThread.id) ||
      settings.targetContacts.some((c) =>
        currentThread.name.toLowerCase().includes(c.toLowerCase())
      )
    : false;

  const toggleTarget = (name: string, id: string) => {
    const isTargeted =
      settings.targetContacts.includes(id) ||
      settings.targetContacts.some((c) => c.toLowerCase() === name.toLowerCase());

    if (isTargeted) {
      onUpdateSettings({
        targetContacts: settings.targetContacts.filter(
          (c) => c !== id && c.toLowerCase() !== name.toLowerCase()
        ),
      });
    } else {
      onUpdateSettings({
        targetContacts: [...settings.targetContacts, name],
      });
    }
  };

  const isContactTargeted = (name: string, id: string): boolean => {
    return (
      settings.targetContacts.includes(id) ||
      settings.targetContacts.some((c) => c.toLowerCase() === name.toLowerCase())
    );
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newContactInput.trim();
    if (!trimmed) return;
    if (!settings.targetContacts.includes(trimmed)) {
      onUpdateSettings({
        targetContacts: [...settings.targetContacts, trimmed],
      });
    }
    setNewContactInput('');
  };

  const handleScanClick = async () => {
    setScanning(true);
    await onScanChats();
    setTimeout(() => setScanning(false), 800);
  };

  const filteredContacts = discoveredContacts.filter((c) => {
    const q = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.snippet && c.snippet.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4">
      {/* 1. Active Detected Messenger Conversation */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
            Active Open Chat
          </span>
          {currentThread && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                settings.targetAllContacts || isCurrentTargeted
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.targetAllContacts
                ? 'Targeted (All enabled)'
                : isCurrentTargeted
                ? 'Targeted'
                : 'Not Targeted'}
            </span>
          )}
        </div>

        {currentThread ? (
          <>
            <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-semibold text-white truncate">{currentThread.name}</p>
                <p className="text-[11px] text-slate-500 truncate">Thread ID: {currentThread.id}</p>
              </div>

              {!settings.targetAllContacts && (
                <button
                  onClick={() => toggleTarget(currentThread.name, currentThread.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                    isCurrentTargeted
                      ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                  }`}
                >
                  {isCurrentTargeted ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      Untarget
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Target Chat
                    </>
                  )}
                </button>
              )}
            </div>

            {onTriggerReplyNow && (
              <button
                onClick={onTriggerReplyNow}
                className="w-full mt-2.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/20"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-200" />
                ⚡ Reply to this chat now
              </button>
            )}
          </>
        ) : (
          <div className="p-3 bg-slate-950/40 rounded-lg border border-dashed border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Open a chat on <span className="text-cyan-400">messenger.com</span> or{' '}
              <span className="text-cyan-400">facebook.com/messages</span>
            </p>
          </div>
        )}
      </div>

      {/* 2. Auto-Extracted Chat List (Select with Whom to Chat without manual typing) */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              Messenger Chat List ({discoveredContacts.length})
            </label>
            <p className="text-[10px] text-slate-500 mt-0.5">Click any person below to target their chat</p>
          </div>

          <button
            onClick={handleScanClick}
            disabled={scanning}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg transition-colors border border-slate-700/60"
            title="Scan conversation list from Messenger"
          >
            <RefreshCw className={`w-3 h-3 ${scanning ? 'animate-spin' : ''}`} />
            Scan Chats
          </button>
        </div>

        {/* Master Target All Toggle */}
        <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
          <span className="text-xs text-slate-300 font-medium">Target ALL Chats (Chat with anyone)</span>
          <input
            type="checkbox"
            checked={settings.targetAllContacts}
            onChange={(e) => onUpdateSettings({ targetAllContacts: e.target.checked })}
            className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 accent-cyan-500"
          />
        </div>

        {!settings.targetAllContacts && (
          <div className="space-y-2">
            {/* Search Filter Box */}
            {discoveredContacts.length > 0 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter friends by name..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            {/* Extracted Contacts Scroll Area */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {discoveredContacts.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-1.5">
                  <p className="text-xs text-slate-400">No chats extracted yet.</p>
                  <p className="text-[11px] text-slate-500">
                    Open <span className="text-cyan-400">messenger.com</span> in a tab and click &quot;Scan Chats&quot; above to automatically load all your friends!
                  </p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">No matching friends found.</p>
              ) : (
                filteredContacts.map((contact) => {
                  const targeted = isContactTargeted(contact.name, contact.id);
                  return (
                    <div
                      key={contact.id}
                      className={`p-2 rounded-lg flex items-center justify-between gap-2 transition-all border ${
                        targeted
                          ? 'bg-cyan-950/40 border-cyan-800/80'
                          : 'bg-slate-950/60 border-slate-800/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {contact.avatarUrl ? (
                          <img
                            src={contact.avatarUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-700"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">{contact.name}</p>
                          {contact.snippet && (
                            <p className="text-[10px] text-slate-500 truncate max-w-[170px]">
                              {contact.snippet}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleTarget(contact.name, contact.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 transition-all flex items-center gap-1 ${
                          targeted
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800'
                            : 'bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white border border-slate-700'
                        }`}
                      >
                        {targeted ? (
                          <>
                            <Check className="w-3 h-3" />
                            Targeted
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            Target
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Currently Targeted Summary Tags */}
            {settings.targetContacts.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Currently Whitelisted ({settings.targetContacts.length}):
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {settings.targetContacts.map((contact) => (
                    <span
                      key={contact}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-200 border border-cyan-800"
                    >
                      <span className="max-w-[120px] truncate">{contact}</span>
                      <button
                        onClick={() => toggleTarget(contact, contact)}
                        className="hover:text-rose-400 transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Manual Add Box */}
            <form onSubmit={handleManualAdd} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={newContactInput}
                onChange={(e) => setNewContactInput(e.target.value)}
                placeholder="Or type custom friend name..."
                className="flex-1 px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 3. Pending Approval Draft Card (Manual Review Mode) */}
      {pendingDraft && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 shadow-lg space-y-2.5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Draft Reply for {pendingDraft.threadName}
            </span>
            <span className="text-[10px] text-amber-400/80 bg-amber-900/40 px-2 py-0.5 rounded-full border border-amber-800">
              Review Required
            </span>
          </div>

          <textarea
            value={editedDraft}
            onChange={(e) => setEditedDraft(e.target.value)}
            rows={3}
            className="w-full p-2.5 text-xs bg-slate-950 border border-amber-900/60 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onRejectDraft}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Discard
            </button>
            <button
              onClick={() => onApproveDraft(editedDraft)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white shadow-md shadow-amber-500/20 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Approve & Send
            </button>
          </div>
        </div>
      )}

      {/* 4. Live Activity Stream (Recent 4 items) */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Recent Activity
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-3">No activity recorded yet.</p>
          ) : (
            logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-medium text-slate-400 truncate max-w-[140px]">
                    {log.threadName || 'System'}
                  </span>
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed break-words">{log.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
