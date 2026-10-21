import type { AppSettings, ActivityLog, ChatThread, BotStatus, DiscoveredContact } from '../types';

export const DEFAULT_AGENTROUTER_MODELS = [
  'gpt-6.1-sol',
  'deepseek-v4-flash',
  'gpt-6-astra',
  'claude-opus-5',
  'glm-5.3',
];

export const DEFAULT_SETTINGS: AppSettings = {
  router: {
    baseUrl: 'https://agentrouter.org/v1',
    apiKey: '',
    model: 'gpt-6.1-sol',
    temperature: 0.7,
    maxTokens: 250,
    availableModels: DEFAULT_AGENTROUTER_MODELS,
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
  botMode: 'manual_approval',
  targetContacts: [],
  targetAllContacts: true, // Default to true so it works immediately on active chat!
};

const STORAGE_KEYS = {
  SETTINGS: 'social_chatbot_settings',
  LOGS: 'social_chatbot_logs',
  CURRENT_THREAD: 'social_chatbot_current_thread',
  BOT_STATUS: 'social_chatbot_bot_status',
  PENDING_DRAFT: 'social_chatbot_pending_draft',
  CONTACTS: 'social_chatbot_contacts',
};

export async function getSettings(): Promise<AppSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  if (!result[STORAGE_KEYS.SETTINGS]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
    return DEFAULT_SETTINGS;
  }
  const stored = result[STORAGE_KEYS.SETTINGS];
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    router: { ...DEFAULT_SETTINGS.router, ...(stored.router || {}) },
    persona: { ...DEFAULT_SETTINGS.persona, ...(stored.persona || {}) },
    safety: { ...DEFAULT_SETTINGS.safety, ...(stored.safety || {}) },
  };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  const current = result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
  const updated: AppSettings = {
    ...current,
    ...settings,
    router: { ...current.router, ...(settings.router || {}) },
    persona: { ...current.persona, ...(settings.persona || {}) },
    safety: { ...current.safety, ...(settings.safety || {}) },
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
  return updated;
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

export async function getDiscoveredContacts(): Promise<DiscoveredContact[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CONTACTS);
  return result[STORAGE_KEYS.CONTACTS] || [];
}

export async function saveDiscoveredContacts(newContacts: DiscoveredContact[]): Promise<DiscoveredContact[]> {
  const existing = await getDiscoveredContacts();
  const contactMap = new Map<string, DiscoveredContact>();

  for (const c of existing) {
    contactMap.set(c.id, c);
  }
  for (const c of newContacts) {
    if (c.id && c.name) {
      const prev = contactMap.get(c.id);
      contactMap.set(c.id, {
        id: c.id,
        name: c.name,
        avatarUrl: c.avatarUrl || prev?.avatarUrl,
        snippet: c.snippet || prev?.snippet,
        lastSeen: Date.now(),
      });
    }
  }

  const merged = Array.from(contactMap.values()).sort((a, b) => b.lastSeen - a.lastSeen);
  await chrome.storage.local.set({ [STORAGE_KEYS.CONTACTS]: merged });
  return merged;
}
