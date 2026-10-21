import type {
  AppSettings,
  ActivityLog,
  ChatThread,
  BotStatus,
  DiscoveredContact,
  LLMProviderType,
  ProviderConfig,
  AgentRouterConfig,
} from '../types';

export const DEFAULT_AGENTROUTER_MODELS = [
  'gpt-6.1-sol',
  'deepseek-v4-flash',
  'gpt-6-astra',
  'claude-opus-5',
  'glm-5.3',
];

export const DEFAULT_OPENROUTER_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat',
  'deepseek/deepseek-r1:free',
  'google/gemini-2.0-flash-exp:free',
  'openai/gpt-4o-mini',
  'anthropic/claude-3.5-sonnet',
];

export const DEFAULT_HUGGINGFACE_MODELS = [
  'meta-llama/Llama-3.3-70B-Instruct',
  'Qwen/Qwen2.5-72B-Instruct',
  'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
  'mistralai/Mistral-7B-Instruct-v0.3',
  'openai/gpt-oss-120b',
];

export const DEFAULT_PAWAN_MODELS = [
  'pai-001-light',
  'pai-001',
  'gpt-3.5-turbo',
  'gpt-4o',
  'cosmosrp',
];

export const DEFAULT_CUSTOM_MODELS = [
  'llama3.2',
  'mistral',
  'qwen2.5',
  'deepseek-r1',
];

export const DEFAULT_PROVIDERS: Record<LLMProviderType, ProviderConfig> = {
  agentrouter: {
    id: 'agentrouter',
    name: 'AgentRouter',
    baseUrl: 'https://agentrouter.org/v1',
    apiKey: '',
    model: 'gpt-6.1-sol',
    temperature: 0.7,
    maxTokens: 250,
    availableModels: DEFAULT_AGENTROUTER_MODELS,
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: '',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    temperature: 0.7,
    maxTokens: 250,
    availableModels: DEFAULT_OPENROUTER_MODELS,
  },
  huggingface: {
    id: 'huggingface',
    name: 'Hugging Face Router',
    baseUrl: 'https://router.huggingface.co/v1',
    apiKey: '',
    model: 'meta-llama/Llama-3.3-70B-Instruct',
    temperature: 0.7,
    maxTokens: 250,
    availableModels: DEFAULT_HUGGINGFACE_MODELS,
  },
  pawan: {
    id: 'pawan',
    name: 'Pawan.Krd',
    baseUrl: 'https://api.pawan.krd/v1',
    apiKey: '',
    model: 'pai-001-light',
    temperature: 0.7,
    maxTokens: 250,
    availableModels: DEFAULT_PAWAN_MODELS,
  },
  custom: {
    id: 'custom',
    name: 'Custom / Local API',
    baseUrl: 'http://localhost:11434/v1',
    apiKey: '',
    model: 'llama3.2',
    temperature: 0.7,
    maxTokens: 250,
    availableModels: DEFAULT_CUSTOM_MODELS,
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  activeProvider: 'agentrouter',
  providers: DEFAULT_PROVIDERS,
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

export function isContextValid(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id && !!chrome.storage?.local;
}

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEYS.SETTINGS]?.newValue) {
        cachedSettings = changes[STORAGE_KEYS.SETTINGS].newValue;
      }
    });
  } catch {
    // Ignore context invalidation
  }
}

/**
 * Normalizes stored settings and seamlessly migrates legacy settings
 */
function normalizeLoadedSettings(stored: any): AppSettings {
  if (!stored) return DEFAULT_SETTINGS;

  const activeProvider: LLMProviderType = stored.activeProvider || 'agentrouter';

  // Merge each provider config with defaults
  const providers: Record<LLMProviderType, ProviderConfig> = {
    agentrouter: {
      ...DEFAULT_PROVIDERS.agentrouter,
      ...(stored.providers?.agentrouter || {}),
    },
    openrouter: {
      ...DEFAULT_PROVIDERS.openrouter,
      ...(stored.providers?.openrouter || {}),
    },
    huggingface: {
      ...DEFAULT_PROVIDERS.huggingface,
      ...(stored.providers?.huggingface || {}),
    },
    pawan: {
      ...DEFAULT_PROVIDERS.pawan,
      ...(stored.providers?.pawan || {}),
    },
    custom: {
      ...DEFAULT_PROVIDERS.custom,
      ...(stored.providers?.custom || {}),
    },
  };

  // If legacy stored.router exists and providers.agentrouter is empty, migrate it
  if (stored.router?.apiKey && !providers.agentrouter.apiKey) {
    providers.agentrouter.apiKey = stored.router.apiKey;
    providers.agentrouter.baseUrl = stored.router.baseUrl || providers.agentrouter.baseUrl;
    providers.agentrouter.model = stored.router.model || providers.agentrouter.model;
    providers.agentrouter.temperature = stored.router.temperature ?? providers.agentrouter.temperature;
    providers.agentrouter.maxTokens = stored.router.maxTokens ?? providers.agentrouter.maxTokens;
    if (stored.router.availableModels?.length) {
      providers.agentrouter.availableModels = stored.router.availableModels;
    }
  }

  // Ensure router object mirrors active agentrouter provider for backward compatibility
  const router: AgentRouterConfig = {
    baseUrl: providers.agentrouter.baseUrl,
    apiKey: providers.agentrouter.apiKey,
    model: providers.agentrouter.model,
    temperature: providers.agentrouter.temperature,
    maxTokens: providers.agentrouter.maxTokens,
    availableModels: providers.agentrouter.availableModels,
  };

  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    activeProvider,
    providers,
    router,
    persona: { ...DEFAULT_SETTINGS.persona, ...(stored.persona || {}) },
    safety: { ...DEFAULT_SETTINGS.safety, ...(stored.safety || {}) },
  };
}

export async function getSettings(): Promise<AppSettings> {
  if (cachedSettings) {
    return cachedSettings;
  }
  if (!isContextValid()) {
    return DEFAULT_SETTINGS;
  }
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    if (!result[STORAGE_KEYS.SETTINGS]) {
      await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
      cachedSettings = DEFAULT_SETTINGS;
      return DEFAULT_SETTINGS;
    }
    const normalized = normalizeLoadedSettings(result[STORAGE_KEYS.SETTINGS]);
    cachedSettings = normalized;
    return normalized;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  savePromiseChain = savePromiseChain.then(async () => {
    if (!isContextValid()) {
      return cachedSettings || DEFAULT_SETTINGS;
    }
    try {
      const current = await getSettings();

      // Merge providers carefully
      const updatedProviders: Record<LLMProviderType, ProviderConfig> = {
        agentrouter: {
          ...current.providers.agentrouter,
          ...(partial.providers?.agentrouter || {}),
        },
        openrouter: {
          ...current.providers.openrouter,
          ...(partial.providers?.openrouter || {}),
        },
        huggingface: {
          ...current.providers.huggingface,
          ...(partial.providers?.huggingface || {}),
        },
        pawan: {
          ...current.providers.pawan,
          ...(partial.providers?.pawan || {}),
        },
        custom: {
          ...current.providers.custom,
          ...(partial.providers?.custom || {}),
        },
      };

      // If partial has legacy router updates, keep providers.agentrouter in sync
      if (partial.router) {
        updatedProviders.agentrouter = {
          ...updatedProviders.agentrouter,
          ...partial.router,
        };
      }

      // Backward compatible router object mirroring providers.agentrouter
      const updatedRouter: AgentRouterConfig = {
        baseUrl: updatedProviders.agentrouter.baseUrl,
        apiKey: updatedProviders.agentrouter.apiKey,
        model: updatedProviders.agentrouter.model,
        temperature: updatedProviders.agentrouter.temperature,
        maxTokens: updatedProviders.agentrouter.maxTokens,
        availableModels: updatedProviders.agentrouter.availableModels,
      };

      const updated: AppSettings = {
        ...current,
        ...partial,
        activeProvider: partial.activeProvider || current.activeProvider || 'agentrouter',
        providers: updatedProviders,
        router: updatedRouter,
        persona: { ...current.persona, ...(partial.persona || {}) },
        safety: { ...current.safety, ...(partial.safety || {}) },
      };

      cachedSettings = updated;
      await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: updated });
      return updated;
    } catch {
      return cachedSettings || DEFAULT_SETTINGS;
    }
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
  if (!isContextValid()) return [];
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.CONTACTS);
    return result[STORAGE_KEYS.CONTACTS] || [];
  } catch {
    return [];
  }
}

export async function saveDiscoveredContacts(newContacts: DiscoveredContact[]): Promise<DiscoveredContact[]> {
  if (!isContextValid()) return [];
  try {
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
  } catch {
    return [];
  }
}
