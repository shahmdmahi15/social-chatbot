import type { AppSettings, ActivityLog, ChatThread, BotStatus } from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  router: {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    model: 'google/gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 250,
  },
  persona: {
    userPersona: 'You are me, chatting casually on Facebook Messenger with friends and acquaintances. Sound completely natural, authentic, and human.',
    customInstructions: 'Keep replies concise and authentic. If asked what I am doing, act busy but friendly.',
    languagePreference: 'auto',
    slangStyle: 'natural_match',
    replyLength: 'short',
    useEmojis: true,
  },
  safety: {
    coalesceDelayMs: 4500, // 4.5 seconds to wait for consecutive bubbles
    typingSpeedWpm: 60,
    humanJitter: true,
    maxAutoRepliesPerSession: 30,
    requireConfirmationForSensitiveWords: true,
  },
  botMode: 'manual_approval', // Safe default so user can test before turning on full auto-pilot
  targetContacts: [],
  targetAllContacts: false,
};

const STORAGE_KEYS = {
  SETTINGS: 'social_chatbot_settings',
  LOGS: 'social_chatbot_logs',
  CURRENT_THREAD: 'social_chatbot_current_thread',
  BOT_STATUS: 'social_chatbot_bot_status',
  PENDING_DRAFT: 'social_chatbot_pending_draft',
};

export async function getSettings(): Promise<AppSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  if (!result[STORAGE_KEYS.SETTINGS]) {
    await saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  }
  return {
    ...DEFAULT_SETTINGS,
    ...result[STORAGE_KEYS.SETTINGS],
    router: { ...DEFAULT_SETTINGS.router, ...result[STORAGE_KEYS.SETTINGS]?.router },
    persona: { ...DEFAULT_SETTINGS.persona, ...result[STORAGE_KEYS.SETTINGS]?.persona },
    safety: { ...DEFAULT_SETTINGS.safety, ...result[STORAGE_KEYS.SETTINGS]?.safety },
  };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  const updated: AppSettings = {
    ...current,
    ...settings,
    router: { ...current.router, ...(settings.router || {}) },
    persona: { ...current.persona, ...(settings.persona || {}) },
    safety: { ...current.safety, ...(settings.safety || {}) },
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
}

export async function getLogs(): Promise<ActivityLog[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.LOGS);
  return result[STORAGE_KEYS.LOGS] || [];
}

export async function addLog(log: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ActivityLog> {
  const logs = await getLogs();
  const newLog: ActivityLog = {
    ...log,
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };
  const trimmedLogs = [newLog, ...logs].slice(0, 100); // keep last 100 logs
  await chrome.storage.local.set({ [STORAGE_KEYS.LOGS]: trimmedLogs });
  return newLog;
}

export async function clearLogs(): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.LOGS]: [] });
}

export async function getCurrentThread(): Promise<ChatThread | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CURRENT_THREAD);
  return result[STORAGE_KEYS.CURRENT_THREAD] || null;
}

export async function setCurrentThread(thread: ChatThread | null): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.CURRENT_THREAD]: thread });
}

export async function getBotStatus(): Promise<BotStatus> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.BOT_STATUS);
  return result[STORAGE_KEYS.BOT_STATUS] || 'idle';
}

export async function setBotStatus(status: BotStatus): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.BOT_STATUS]: status });
}

export async function getPendingDraft(): Promise<{ threadId: string; text: string; threadName: string } | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.PENDING_DRAFT);
  return result[STORAGE_KEYS.PENDING_DRAFT] || null;
}

export async function setPendingDraft(draft: { threadId: string; text: string; threadName: string } | null): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.PENDING_DRAFT]: draft });
}
