import React, { useState, useEffect } from 'react';
import type {
  AppSettings,
  ActivityLog,
  ChatThread,
  BotStatus,
  BotMode,
} from '../../types';
import {
  getSettings,
  saveSettings,
  getLogs,
  getCurrentThread,
  getBotStatus,
  getPendingDraft,
  DEFAULT_SETTINGS,
} from '../../utils/storage';
import { Header } from './components/Header';
import { MonitorTab } from './components/MonitorTab';
import { PersonaTab } from './components/PersonaTab';
import { SettingsTab } from './components/SettingsTab';
import { LogsTab } from './components/LogsTab';
import { Activity, Sparkles, SlidersHorizontal, ListFilter } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<BotStatus>('idle');
  const [currentThread, setCurrentThreadState] = useState<ChatThread | null>(null);
  const [pendingDraft, setPendingDraftState] = useState<{
    threadId: string;
    text: string;
    threadName: string;
  } | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<'monitor' | 'persona' | 'settings' | 'logs'>('monitor');

  // Load initial state
  const refreshAllState = async () => {
    try {
      const [loadedSettings, loadedStatus, loadedThread, loadedDraft, loadedLogs] =
        await Promise.all([
          getSettings(),
          getBotStatus(),
          getCurrentThread(),
          getPendingDraft(),
          getLogs(),
        ]);
      setSettings(loadedSettings);
      setStatus(loadedStatus);
      setCurrentThreadState(loadedThread);
      setPendingDraftState(loadedDraft);
      setLogs(loadedLogs);
    } catch (err) {
      console.error('Failed to load storage state:', err);
    }
  };

  useEffect(() => {
    refreshAllState();

    // Listen for storage changes in real-time
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.social_chatbot_settings) {
        setSettings(changes.social_chatbot_settings.newValue);
      }
      if (changes.social_chatbot_bot_status) {
        setStatus(changes.social_chatbot_bot_status.newValue);
      }
      if (changes.social_chatbot_current_thread) {
        setCurrentThreadState(changes.social_chatbot_current_thread.newValue);
      }
      if (changes.social_chatbot_pending_draft) {
        setPendingDraftState(changes.social_chatbot_pending_draft.newValue);
      }
      if (changes.social_chatbot_logs) {
        setLogs(changes.social_chatbot_logs.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const handleUpdateSettings = async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await saveSettings(partial);
  };

  const handleModeChange = async (mode: BotMode) => {
    await handleUpdateSettings({ botMode: mode });
  };

  const handleApproveDraft = async (text: string) => {
    if (!pendingDraft) return;
    try {
      chrome.runtime.sendMessage({
        type: 'APPROVE_AND_SEND',
        threadId: pendingDraft.threadId,
        text: text,
      });
      setPendingDraftState(null);
    } catch (err) {
      console.error('Failed to approve draft:', err);
    }
  };

  const handleRejectDraft = async () => {
    if (!pendingDraft) return;
    try {
      chrome.runtime.sendMessage({
        type: 'REJECT_DRAFT',
        threadId: pendingDraft.threadId,
      });
      setPendingDraftState(null);
    } catch (err) {
      console.error('Failed to reject draft:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Sticky Header with Status and Master Mode Toggle */}
      <Header
        status={status}
        botMode={settings.botMode}
        onModeChange={handleModeChange}
      />

      {/* Navigation Tabs */}
      <nav className="flex items-center justify-around px-2 py-1.5 bg-slate-900/60 border-b border-slate-800/80 text-xs font-medium">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all ${
            activeTab === 'monitor'
              ? 'bg-slate-800 text-cyan-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Monitor
        </button>

        <button
          onClick={() => setActiveTab('persona')}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all ${
            activeTab === 'persona'
              ? 'bg-slate-800 text-indigo-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Persona & Lang
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all ${
            activeTab === 'settings'
              ? 'bg-slate-800 text-emerald-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Settings
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all ${
            activeTab === 'logs'
              ? 'bg-slate-800 text-amber-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          Logs
          {logs.length > 0 && (
            <span className="text-[10px] bg-slate-700 px-1.5 py-0.2 rounded-full text-slate-300">
              {logs.length}
            </span>
          )}
        </button>
      </nav>

      {/* Main Tab Content */}
      <main className="flex-1 p-3.5 overflow-y-auto">
        {activeTab === 'monitor' && (
          <MonitorTab
            currentThread={currentThread}
            settings={settings}
            pendingDraft={pendingDraft}
            logs={logs}
            onUpdateSettings={handleUpdateSettings}
            onApproveDraft={handleApproveDraft}
            onRejectDraft={handleRejectDraft}
          />
        )}

        {activeTab === 'persona' && (
          <PersonaTab
            persona={settings.persona}
            onChange={(updatedPersona) =>
              handleUpdateSettings({
                persona: { ...settings.persona, ...updatedPersona },
              })
            }
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            router={settings.router}
            safety={settings.safety}
            onUpdateRouter={(updatedRouter) =>
              handleUpdateSettings({
                router: { ...settings.router, ...updatedRouter },
              })
            }
            onUpdateSafety={(updatedSafety) =>
              handleUpdateSettings({
                safety: { ...settings.safety, ...updatedSafety },
              })
            }
          />
        )}

        {activeTab === 'logs' && (
          <LogsTab logs={logs} onLogsCleared={() => setLogs([])} />
        )}
      </main>
    </div>
  );
}
