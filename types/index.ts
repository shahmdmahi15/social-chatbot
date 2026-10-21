export type ChatLanguage = 'auto' | 'banglish' | 'bangla' | 'english' | 'mixed';

export type BotMode = 'autopilot' | 'manual_approval' | 'disabled';

export type BotStatus = 'idle' | 'observing' | 'coalescing' | 'thinking' | 'typing' | 'waiting_approval' | 'error';

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  senderName: string;
  text: string;
  timestamp: number;
}

export interface ChatThread {
  id: string;
  name: string;
  avatarUrl?: string;
  lastActive: number;
  isTargeted: boolean;
  languageDetected?: ChatLanguage;
}

export interface PersonaConfig {
  userPersona: string; // "Pretend you are [Name], casual, friendly, busy..."
  customInstructions: string; // Specific temporary instruction e.g. "Say I will meet him at 8 PM"
  languagePreference: ChatLanguage;
  slangStyle: 'casual_banglish' | 'standard_bangla' | 'formal_english' | 'slang_chill' | 'natural_match';
  replyLength: 'short' | 'medium' | 'detailed';
  useEmojis: boolean;
}

export interface AgentRouterConfig {
  baseUrl: string; // e.g., 'https://openrouter.ai/api/v1' or custom router
  apiKey: string;
  model: string; // e.g., 'google/gemini-2.5-flash', 'openai/gpt-4o-mini'
  temperature: number;
  maxTokens: number;
}

export interface SafetySettings {
  coalesceDelayMs: number; // 3000 to 10000 ms (wait for consecutive messages)
  typingSpeedWpm: number; // 40 - 80 WPM
  humanJitter: boolean; // Add random variance to typing
  maxAutoRepliesPerSession: number; // Prevent infinite loops (e.g. 20)
  requireConfirmationForSensitiveWords: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  type: 'incoming' | 'coalescing' | 'thinking' | 'generated' | 'sent' | 'error' | 'approval_required';
  threadName: string;
  message: string;
  metadata?: any;
}

export interface AppSettings {
  router: AgentRouterConfig;
  persona: PersonaConfig;
  safety: SafetySettings;
  botMode: BotMode;
  targetContacts: string[]; // List of contact names or thread IDs targeted
  targetAllContacts: boolean; // If true, replies to any active chat
}

// Runtime messaging contract
export type ExtensionMessage =
  | { type: 'NEW_MESSAGES_DETECTED'; thread: ChatThread; messages: ChatMessage[] }
  | { type: 'CHAT_SWITCHED'; thread: ChatThread }
  | { type: 'TRIGGER_GENERATION'; thread: ChatThread; messages: ChatMessage[] }
  | { type: 'RESPONSE_GENERATED'; thread: ChatThread; replyText: string; mode: BotMode }
  | { type: 'APPROVE_AND_SEND'; threadId: string; text: string }
  | { type: 'REJECT_DRAFT'; threadId: string }
  | { type: 'INJECT_TYPING_PAYLOAD'; text: string; autoSend: boolean }
  | { type: 'LOG_EVENT'; log: ActivityLog }
  | { type: 'STATUS_UPDATE'; status: BotStatus; statusDetail?: string }
  | { type: 'GET_STATE' }
  | { type: 'STATE_UPDATE'; settings: AppSettings; status: BotStatus; currentThread?: ChatThread };
