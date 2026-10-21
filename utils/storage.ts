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
    userPersona: 'Casual, friendly, authentic, and responsive. Chat like a real person in quick natural messages.',
    customInstructions: 'Be warm, responsive, and match the vibe and closeness of the conversation.',
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

// In-memory cache and sequential atomic queue to prevent race conditions during typing/saving
let cachedSettings: AppSettings | null = null;
let savePromiseChain: Promise<AppSettings> = Promise.resolve(DEFAULT_SETTINGS);

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes[STORAGE_KEYS.SETTINGS]?.newValue) {
      cachedSettings = changes[STORAGE_KEYS.SETTINGS].newValue;
    }
  });
}

export async function getSettings(): Promise<AppSettings> {
  if (cachedSettings) {
    return cachedSettings;
  }
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  if (!result[STORAGE_KEYS.SETTINGS]) {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
    cachedSettings = DEFAULT_SETTINGS;
    return DEFAULT_SETTINGS;
  }
  const stored = result[STORAGE_KEYS.SETTINGS];
  cachedSettings = {
    ...DEFAULT_SETTINGS,
    ...stored,
    router: { ...DEFAULT_SETTINGS.router, ...(stored.router || {}) },
    persona: { ...DEFAULT_SETTINGS.persona, ...(stored.persona || {}) },
    safety: { ...DEFAULT_SETTINGS.safety, ...(stored.safety || {}) },
  };
  return cachedSettings;
}

export function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  savePromiseChain = savePromiseChain.then(async () => {
    const current = await getSettings();
    const updated: AppSettings = {
      ...current,
      ...partial,
      router: { ...current.router, ...(partial.router || {}) },
      persona: { ...current.persona, ...(partial.persona || {}) },
      safety: { ...current.safety, ...(partial.safety || {}) },
    };
    cachedSettings = updated;
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
    return updated;
  });
  return savePromiseChain;
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
