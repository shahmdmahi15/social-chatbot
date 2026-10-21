import React, { useState } from 'react';
import type { ChatThread, AppSettings, ActivityLog } from '../../../types';
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
  ArrowRight,
} from 'lucide-react';

interface Props {
  currentThread: ChatThread | null;
  settings: AppSettings;
  pendingDraft: { threadId: string; text: string; threadName: string } | null;
  logs: ActivityLog[];
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onApproveDraft: (text: string) => void;
  onRejectDraft: () => void;
}

export const MonitorTab: React.FC<Props> = ({
  currentThread,
  settings,
  pendingDraft,
  logs,
  onUpdateSettings,
  onApproveDraft,
  onRejectDraft,
}) => {
  const [newContactInput, setNewContactInput] = useState('');
  const [editedDraft, setEditedDraft] = useState('');

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

  const toggleTargetCurrentThread = () => {
    if (!currentThread) return;
    if (isCurrentTargeted) {
      onUpdateSettings({
        targetContacts: settings.targetContacts.filter(
          (c) => c !== currentThread.id && c.toLowerCase() !== currentThread.name.toLowerCase()
        ),
      });
    } else {
      onUpdateSettings({
        targetContacts: [...settings.targetContacts, currentThread.name],
      });
    }
  };

  const handleAddManualContact = (e: React.FormEvent) => {
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

  const handleRemoveContact = (nameOrId: string) => {
    onUpdateSettings({
      targetContacts: settings.targetContacts.filter((c) => c !== nameOrId),
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Active Detected Messenger Conversation */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
            Detected Messenger Chat
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
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <div className="min-w-0 pr-2">
                <p className="text-sm font-semibold text-white truncate">{currentThread.name}</p>
                <p className="text-[11px] text-slate-500 truncate">Thread ID: {currentThread.id}</p>
              </div>

              {!settings.targetAllContacts && (
                <button
                  onClick={toggleTargetCurrentThread}
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
          </div>
        ) : (
          <div className="p-3 bg-slate-950/40 rounded-lg border border-dashed border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Open a chat tab on <span className="text-cyan-400">messenger.com</span> or{' '}
              <span className="text-cyan-400">facebook.com/messages</span>
            </p>
          </div>
        )}
      </div>

      {/* 2. Target Filter Selection (Select with whom to chat) */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-400" />
            Target Contacts Filter
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={settings.targetAllContacts}
              onChange={(e) => onUpdateSettings({ targetAllContacts: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-700"
            />
            Target ALL Chats
          </label>
        </div>

        {!settings.targetAllContacts && (
          <div className="space-y-2.5">
            {/* Add manual contact form */}
            <form onSubmit={handleAddManualContact} className="flex gap-1.5">
              <input
                type="text"
                value={newContactInput}
                onChange={(e) => setNewContactInput(e.target.value)}
                placeholder="Add friend's name or thread ID..."
                className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
              >
                Add
              </button>
            </form>

            {/* List of targeted contacts */}
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
              {settings.targetContacts.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">
                  No specific contacts added yet. Click &quot;Target Chat&quot; above or type a name to whitelist.
                </p>
              ) : (
                settings.targetContacts.map((contact) => (
                  <span
                    key={contact}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-indigo-950/70 text-indigo-200 border border-indigo-800/60"
                  >
                    <UserCheck className="w-3 h-3 text-indigo-400" />
                    <span className="max-w-[120px] truncate">{contact}</span>
                    <button
                      onClick={() => handleRemoveContact(contact)}
                      className="hover:text-rose-400 transition-colors"
                      title="Remove contact"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
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
