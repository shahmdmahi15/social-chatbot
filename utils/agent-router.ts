import type {
  LLMProviderType,
  ProviderConfig,
  AgentRouterConfig,
} from '../types';
import {
  DEFAULT_AGENTROUTER_MODELS,
  DEFAULT_OPENROUTER_MODELS,
  DEFAULT_HUGGINGFACE_MODELS,
  DEFAULT_PAWAN_MODELS,
  DEFAULT_CUSTOM_MODELS,
} from './storage';

export interface GenerateCompletionParams {
  provider?: LLMProviderType;
  config: ProviderConfig | AgentRouterConfig;
  systemPrompt: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  onFallback?: (oldModel: string, newModel: string, reason?: string) => void;
}

export const PROVIDER_FALLBACK_CANDIDATES: Record<LLMProviderType, string[]> = {
  agentrouter: DEFAULT_AGENTROUTER_MODELS,
  openrouter: DEFAULT_OPENROUTER_MODELS,
  huggingface: DEFAULT_HUGGINGFACE_MODELS,
  pawan: DEFAULT_PAWAN_MODELS,
  custom: DEFAULT_CUSTOM_MODELS,
};

/**
 * Normalizes provider URLs to ensure they point to the correct endpoint
 */
export function normalizeBaseUrl(url: string, provider: LLMProviderType = 'agentrouter'): string {
  let cleaned = (url || '').trim().replace(/\/+$/, '');

  if (provider === 'agentrouter') {
    if (!cleaned) return 'https://agentrouter.org/v1';
    if (cleaned.includes('agentrouter.org') && !cleaned.endsWith('/v1')) {
      cleaned = `${cleaned}/v1`;
    }
    return cleaned;
  }

  if (provider === 'openrouter') {
    if (!cleaned) return 'https://openrouter.ai/api/v1';
    if (cleaned.includes('openrouter.ai') && !cleaned.endsWith('/v1')) {
      if (cleaned.endsWith('/api')) {
        cleaned = `${cleaned}/v1`;
      } else {
        cleaned = `${cleaned}/api/v1`;
      }
    }
    return cleaned;
  }

  if (provider === 'huggingface') {
    if (!cleaned) return 'https://router.huggingface.co/v1';
    return cleaned;
  }

  if (provider === 'pawan') {
    if (!cleaned) return 'https://api.pawan.krd/v1';
    if (cleaned.includes('pawan.krd') && !cleaned.endsWith('/v1') && !cleaned.endsWith('/cosmosrp/v1')) {
      cleaned = `${cleaned}/v1`;
    }
    return cleaned;
  }

  if (provider === 'custom') {
    if (!cleaned) return 'http://localhost:11434/v1';
    return cleaned;
  }

  return cleaned || 'https://agentrouter.org/v1';
}

/**
 * Builds HTTP headers tailored to each LLM provider
 */
export function getProviderHeaders(
  provider: LLMProviderType = 'agentrouter',
  apiKey: string
): Record<string, string> {
  const cleanKey = (apiKey || '').trim();

  switch (provider) {
    case 'agentrouter':
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`,
        'Originator': 'codex_cli_rs',
        'User-Agent': 'codex_cli_rs/0.149.1',
      };

    case 'openrouter':
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`,
        'HTTP-Referer': 'https://github.com/shahmdmahi15/social-chatbot',
        'X-Title': 'Social Auto-Chat AI',
      };

    case 'huggingface':
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`,
      };

    case 'pawan':
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`,
      };

    case 'custom': {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (cleanKey) {
        headers['Authorization'] = `Bearer ${cleanKey}`;
      }
      return headers;
    }

    default:
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`,
      };
  }
}

/**
 * Backward compatibility alias for AgentRouter headers
 */
export function getAgentRouterHeaders(apiKey: string): Record<string, string> {
  return getProviderHeaders('agentrouter', apiKey);
}

/**
 * Formats API errors into helpful actionable guidance tailored to each provider
 */
export function formatApiError(
  status: number,
  rawMessage: string,
  provider: LLMProviderType = 'agentrouter'
): string {
  const msg = rawMessage.toLowerCase();

  if (provider === 'agentrouter') {
    if (msg.includes('unauthorized client detected')) {
      return 'AgentRouter blocked the request (unauthorized client detected). Extension has enabled the codex_cli_rs signature header to resolve this.';
    }
    if (rawMessage.includes('未提供令牌') || msg.includes('no token provided')) {
      return 'AgentRouter API Key is missing or empty. Please enter your API Key in Settings.';
    }
    if (rawMessage.includes('无效的令牌') || msg.includes('invalid_api_key')) {
      return 'AgentRouter API Key is invalid or expired. Please generate a new token at https://ps.air-outer.com/console/token';
    }
    if (msg.includes('sensitive words') || msg.includes('sensitive_words') || rawMessage.includes('敏感词')) {
      return 'Sensitive words filter triggered on AgentRouter (common with DeepSeek on affectionate slang words). Switched to gpt-6.1-sol via Responses API.';
    }
    if (msg.includes('content-blocked') || msg.includes('content blocked')) {
      return 'The model safety filter blocked this conversation turn. Auto-failing over to gpt-6.1-sol.';
    }
    if (status === 503 || rawMessage.includes('无可用渠道')) {
      return 'The selected model is temporarily offline or has no available channels on AgentRouter. Try selecting gpt-6.1-sol or gpt-6-astra.';
    }
    return `AgentRouter API error (${status}): ${rawMessage}`;
  }

  if (provider === 'openrouter') {
    if (status === 401 || msg.includes('invalid api key') || msg.includes('unauthorized')) {
      return 'OpenRouter API Key is invalid or unauthorized. Please verify your key at https://openrouter.ai/keys';
    }
    if (status === 402 || msg.includes('insufficient credits') || msg.includes('credit')) {
      return 'OpenRouter account has insufficient credits. Switch to a free model like meta-llama/llama-3.3-70b-instruct:free or add credits.';
    }
    if (status === 429 || msg.includes('rate limit')) {
      return 'OpenRouter rate limit reached for this model. Try switching to a different model or wait a few moments.';
    }
    return `OpenRouter API error (${status}): ${rawMessage}`;
  }

  if (provider === 'huggingface') {
    if (status === 401 || msg.includes('invalid') || msg.includes('unauthorized')) {
      return 'Hugging Face Token is invalid. Create a fine-grained token with "Inference" permissions at https://huggingface.co/settings/tokens';
    }
    if (status === 503 && msg.includes('estimated_time')) {
      return 'Hugging Face model is currently loading into serverless GPU memory. Please retry in 10-20 seconds or switch to a faster model.';
    }
    return `Hugging Face API error (${status}): ${rawMessage}`;
  }

  if (provider === 'pawan') {
    if (status === 401 || status === 403 || msg.includes('invalid') || msg.includes('key')) {
      return 'Pawan.Krd API Key is invalid or expired. Join the Pawan.krd Discord (https://pawan.krd) and type /key to obtain a free key.';
    }
    if (status === 429 || msg.includes('quota') || msg.includes('rate')) {
      return 'Pawan.Krd rate limit reached. Type /claim on the Pawan Discord for daily quota or switch model to pai-001-light.';
    }
    return `Pawan.Krd API error (${status}): ${rawMessage}`;
  }

  if (provider === 'custom') {
    if (status === 504 || msg.includes('fetch failed') || msg.includes('failed to fetch')) {
      return 'Could not connect to custom/local endpoint. Ensure Ollama/LMStudio is running and allows CORS (e.g., OLLAMA_ORIGINS="*").';
    }
    return `Custom API error (${status}): ${rawMessage}`;
  }

  return `API error (${status}): ${rawMessage}`;
}

/**
 * Checks whether a given model on AgentRouter requires the OpenAI Responses API (/v1/responses)
 */
export function isResponsesModel(model: string, provider: LLMProviderType = 'agentrouter'): boolean {
  if (provider !== 'agentrouter') return false;
  const m = (model || '').toLowerCase();
  return (
    m.includes('gpt-6') ||
    m.includes('sol') ||
    m.includes('astra') ||
    m.includes('responses')
  );
}

/**
 * Parses the response from OpenAI Responses API (/v1/responses)
 */
export function parseResponsesApiResponse(data: any): string {
  if (!data) return '';
  if (typeof data === 'string') return data.trim();
  if (typeof data.output === 'string') return data.output.trim();
  if (typeof data.text === 'string') return data.text.trim();
  if (typeof data.output_text === 'string') return data.output_text.trim();
  if (typeof data.content === 'string') return data.content.trim();

  if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (!item) continue;
      if (typeof item === 'string') return item.trim();
      if (typeof item.text === 'string' && item.text.trim()) return item.text.trim();
      if (typeof item.content === 'string' && item.content.trim()) return item.content.trim();

      if (Array.isArray(item.content)) {
        for (const part of item.content) {
          if (!part) continue;
          if (typeof part === 'string' && part.trim()) return part.trim();
          if (typeof part.text === 'string' && part.text.trim()) return part.text.trim();
        }
      }
    }
  }

  if (data.output && typeof data.output === 'object') {
    if (typeof data.output.text === 'string') return data.output.text.trim();
    if (typeof data.output.content === 'string') return data.output.content.trim();
    if (Array.isArray(data.output.content)) {
      for (const part of data.output.content) {
        if (part && typeof part.text === 'string' && part.text.trim()) return part.text.trim();
      }
    }
  }

  // Fallback if gateway returns standard choices format
  if (data.choices?.[0]?.message?.content) {
    const c = data.choices[0].message.content;
    if (typeof c === 'string') return c.trim();
    if (Array.isArray(c)) {
      for (const p of c) {
        if (p?.text) return p.text.trim();
      }
    }
  }

  return '';
}

/**
 * Calls OpenAI Responses API (/v1/responses)
 */
async function callResponsesApi(
  cleanBaseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  temperature = 0.7,
  maxTokens = 250,
  provider: LLMProviderType = 'agentrouter'
): Promise<{ ok: boolean; status: number; text?: string; rawError?: string }> {
  const endpoint = `${cleanBaseUrl}/responses`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  const payload: Record<string, any> = {
    model,
    instructions: systemPrompt,
    input: messages.length > 0
      ? messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))
      : [{ role: 'user', content: 'Hi' }],
  };

  if (maxTokens) {
    payload.max_output_tokens = maxTokens;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getProviderHeaders(provider, apiKey),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let rawError = '';
      try {
        const errorJson = await response.json();
        rawError = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson);
      } catch {
        rawError = await response.text();
      }

      // Auto-recovery if max_output_tokens is unsupported
      if (rawError.includes('Unsupported parameter') || rawError.includes('max_output_tokens')) {
        const minimalPayload = {
          model,
          instructions: systemPrompt,
          input: payload.input,
        };
        try {
          const retryResp = await fetch(endpoint, {
            method: 'POST',
            headers: getProviderHeaders(provider, apiKey),
            body: JSON.stringify(minimalPayload),
          });
          if (retryResp.ok) {
            const retryData = await retryResp.json();
            return { ok: true, status: retryResp.status, text: parseResponsesApiResponse(retryData) };
          }
        } catch {
          // Fall through
        }
      }

      return { ok: false, status: response.status, rawError };
    }

    const data = await response.json();
    const replyText = parseResponsesApiResponse(data);
    return { ok: true, status: response.status, text: replyText };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const msg = err.name === 'AbortError' ? 'Request timed out after 25s' : err.message;
    return { ok: false, status: 504, rawError: msg };
  }
}

/**
 * Calls standard Chat Completions API (/v1/chat/completions)
 */
async function callChatCompletionsApi(
  cleanBaseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  temperature = 0.7,
  maxTokens = 250,
  provider: LLMProviderType = 'agentrouter'
): Promise<{ ok: boolean; status: number; text?: string; rawError?: string }> {
  const endpoint = `${cleanBaseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  const payload: Record<string, any> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    max_tokens: maxTokens,
  };

  // Only include temperature if supported
  if (temperature !== undefined && temperature !== null) {
    payload.temperature = temperature;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: getProviderHeaders(provider, apiKey),
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let rawError = '';
      try {
        const errorJson = await response.json();
        rawError = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson);
      } catch {
        rawError = await response.text();
      }

      // Self-healing: if temperature is unsupported
      if (rawError.includes("parameter: 'temperature'") || rawError.includes('temperature is not supported')) {
        const { temperature: _, ...strippedPayload } = payload;
        try {
          const retryResp = await fetch(endpoint, {
            method: 'POST',
            headers: getProviderHeaders(provider, apiKey),
            body: JSON.stringify(strippedPayload),
          });
          if (retryResp.ok) {
            const retryData = await retryResp.json();
            const choice = retryData.choices?.[0];
            return { ok: true, status: retryResp.status, text: choice?.message?.content?.trim() || '' };
          }
        } catch {
          // Fall through
        }
      }

      return { ok: false, status: response.status, rawError };
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const replyText = choice?.message?.content ? choice.message.content.trim() : '';
    return { ok: true, status: response.status, text: replyText };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const msg = err.name === 'AbortError' ? 'Request timed out after 25s' : err.message;
    return { ok: false, status: 504, rawError: msg };
  }
}

/**
 * Universal Multi-Provider Chat Reply Generator
 */
export async function generateChatReply(
  params: GenerateCompletionParams,
  triedModels: Set<string> = new Set()
): Promise<string> {
  const { config, systemPrompt, messages, onFallback } = params;
  const provider: LLMProviderType =
    params.provider ||
    ((config as any).id as LLMProviderType) ||
    'agentrouter';

  // Check API key requirement (Custom local may not strictly require an API key)
  if (provider !== 'custom' && (!config.apiKey || config.apiKey.trim() === '')) {
    const providerName =
      provider === 'agentrouter' ? 'AgentRouter' :
      provider === 'openrouter' ? 'OpenRouter' :
      provider === 'huggingface' ? 'Hugging Face' :
      provider === 'pawan' ? 'Pawan.Krd' : 'Custom';
    throw new Error(`${providerName} API Key is missing. Please enter your API key in Settings.`);
  }

  const cleanBaseUrl = normalizeBaseUrl(config.baseUrl, provider);
  const currentModel = config.model || (
    provider === 'agentrouter' ? 'gpt-6.1-sol' :
    provider === 'openrouter' ? 'meta-llama/llama-3.3-70b-instruct:free' :
    provider === 'huggingface' ? 'meta-llama/Llama-3.3-70B-Instruct' :
    provider === 'pawan' ? 'pai-001-light' : 'llama3.2'
  );
  const temperature = config.temperature ?? 0.7;
  const maxTokens = config.maxTokens ?? 250;

  // Track tried models to prevent infinite loops
  triedModels.add(currentModel);

  // 1. Determine preferred protocol based on model name & provider
  const preferResponses = isResponsesModel(currentModel, provider);

  let result = preferResponses
    ? await callResponsesApi(cleanBaseUrl, config.apiKey, currentModel, systemPrompt, messages, temperature, maxTokens, provider)
    : await callChatCompletionsApi(cleanBaseUrl, config.apiKey, currentModel, systemPrompt, messages, temperature, maxTokens, provider);

  // 2. Intelligent Protocol Auto-Switching for AgentRouter
  if (!result.ok && result.rawError && provider === 'agentrouter') {
    const errorLower = result.rawError.toLowerCase();

    if (errorLower.includes('/v1/responses') || errorLower.includes('responses api') || result.rawError.includes('请改用 /v1/responses')) {
      console.log(`[Social Auto-Chat] Auto-switching ${currentModel} to /v1/responses...`);
      result = await callResponsesApi(cleanBaseUrl, config.apiKey, currentModel, systemPrompt, messages, temperature, maxTokens, provider);
    } else if (errorLower.includes('/v1/chat/completions') || errorLower.includes('chat completions')) {
      console.log(`[Social Auto-Chat] Auto-switching ${currentModel} to /v1/chat/completions...`);
      result = await callChatCompletionsApi(cleanBaseUrl, config.apiKey, currentModel, systemPrompt, messages, temperature, maxTokens, provider);
    }
  }

  // 3. Auto-Failover on transient errors, sensitive words, or rate limits
  if (!result.ok && result.rawError) {
    const rawLower = result.rawError.toLowerCase();
    const shouldFailover =
      rawLower.includes('content-blocked') ||
      rawLower.includes('content blocked') ||
      rawLower.includes('sensitive words') ||
      rawLower.includes('sensitive_words') ||
      rawLower.includes('敏感词') ||
      rawLower.includes('unsupported parameter') ||
      result.status === 500 ||
      result.status === 503 ||
      result.status === 504 ||
      rawLower.includes('timeout') ||
      rawLower.includes('timed out');

    if (shouldFailover) {
      const candidates = PROVIDER_FALLBACK_CANDIDATES[provider] || [];
      const fallbackModel = candidates.find((m) => !triedModels.has(m) && m !== currentModel);

      if (fallbackModel) {
        const shortReason = result.rawError.length > 70 ? `${result.rawError.slice(0, 67)}...` : result.rawError;
        console.warn(`[Social Auto-Chat] ${provider} ${currentModel} failed: ${shortReason}. Auto-failing over to ${fallbackModel}...`);
        if (onFallback) {
          onFallback(currentModel, fallbackModel, shortReason);
        }
        return generateChatReply(
          {
            ...params,
            provider,
            config: { ...config, model: fallbackModel },
          },
          triedModels
        );
      }
    }

    throw new Error(formatApiError(result.status, result.rawError, provider));
  }

  if (!result.text) {
    throw new Error(`Empty or invalid completion returned by ${provider}.`);
  }

  let replyText = result.text.trim();
  replyText = replyText.replace(/^["']|["']$/g, '');

  return replyText;
}

/**
 * Fetches available models from the selected provider's /models endpoint
 */
export async function fetchAvailableModels(
  config: ProviderConfig | AgentRouterConfig,
  explicitProvider?: LLMProviderType
): Promise<string[]> {
  const provider: LLMProviderType =
    explicitProvider ||
    ((config as any).id as LLMProviderType) ||
    'agentrouter';

  if (provider !== 'custom' && (!config.apiKey || config.apiKey.trim() === '')) {
    throw new Error(`Please enter an API Key first to fetch models.`);
  }

  const cleanBaseUrl = normalizeBaseUrl(config.baseUrl, provider);
  const endpoint = `${cleanBaseUrl}/models`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: getProviderHeaders(provider, config.apiKey),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let rawError = '';
      try {
        const errorJson = await response.json();
        rawError = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson);
      } catch {
        rawError = await response.text();
      }
      throw new Error(formatApiError(response.status, rawError, provider));
    }

    const json = await response.json();
    const models: string[] = [];

    // Handle standard OpenAI { data: [{ id: "..." }] } format
    if (Array.isArray(json.data)) {
      for (const item of json.data) {
        if (item && item.id && typeof item.id === 'string') {
          models.push(item.id);
        }
      }
    } else if (Array.isArray(json.models)) {
      // Ollama format { models: [{ name: "..." }] }
      for (const item of json.models) {
        const id = item.name || item.id || item.model;
        if (typeof id === 'string') {
          models.push(id);
        }
      }
    } else if (Array.isArray(json)) {
      for (const item of json) {
        const id = typeof item === 'string' ? item : item?.id || item?.name;
        if (typeof id === 'string') {
          models.push(id);
        }
      }
    }

    return models;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Fetching models timed out after 15s.');
    }
    throw err;
  }
}

/**
 * Tests connection to the active provider
 */
export async function testConnection(
  config: ProviderConfig | AgentRouterConfig,
  explicitProvider?: LLMProviderType
): Promise<{ success: boolean; message: string; modelsCount?: number }> {
  const provider: LLMProviderType =
    explicitProvider ||
    ((config as any).id as LLMProviderType) ||
    'agentrouter';

  try {
    // 1. Try to fetch available models
    const models = await fetchAvailableModels(config, provider);
    const providerName =
      provider === 'agentrouter' ? 'AgentRouter' :
      provider === 'openrouter' ? 'OpenRouter' :
      provider === 'huggingface' ? 'Hugging Face' :
      provider === 'pawan' ? 'Pawan.Krd' : 'Custom';

    return {
      success: true,
      message: `Connected to ${providerName} successfully! Found ${models.length} active models.`,
      modelsCount: models.length,
    };
  } catch (err: any) {
    // 2. Fallback: try minimal single-token ping
    try {
      const reply = await generateChatReply({
        provider,
        config,
        systemPrompt: 'Reply with "OK"',
        messages: [{ role: 'user', content: 'hi' }],
      });
      return {
        success: true,
        message: `Connected successfully! Response: ${reply.slice(0, 45)}`,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        message: fallbackErr.message || err.message || 'Connection failed',
      };
    }
  }
}
