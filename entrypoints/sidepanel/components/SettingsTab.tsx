import React, { useState } from 'react';
import type {
  AppSettings,
  AgentRouterConfig,
  SafetySettings,
  LLMProviderType,
  ProviderConfig,
} from '../../../types';
import {
  testConnection,
  fetchAvailableModels,
  normalizeBaseUrl,
} from '../../../utils/agent-router';
import {
  DEFAULT_PROVIDERS,
  DEFAULT_AGENTROUTER_MODELS,
  DEFAULT_OPENROUTER_MODELS,
  DEFAULT_HUGGINGFACE_MODELS,
  DEFAULT_PAWAN_MODELS,
  DEFAULT_CUSTOM_MODELS,
} from '../../../utils/storage';
import {
  Key,
  Globe,
  Cpu,
  Clock,
  Zap,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Server,
  Layers,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface Props {
  settings?: AppSettings;
  router?: AgentRouterConfig;
  safety?: SafetySettings;
  onUpdateSettings?: (settings: Partial<AppSettings>) => void;
  onUpdateRouter?: (router: Partial<AgentRouterConfig>) => void;
  onUpdateSafety?: (safety: Partial<SafetySettings>) => void;
}

interface ProviderMeta {
  id: LLMProviderType;
  name: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultUrl: string;
  docsUrl: string;
  keyHelp: string;
  presetModels: { id: string; label: string }[];
}

const PROVIDER_METAS: ProviderMeta[] = [
  {
    id: 'agentrouter',
    name: 'AgentRouter',
    tagline: 'High-speed OpenAI / Responses Gateway',
    icon: Zap,
    defaultUrl: 'https://agentrouter.org/v1',
    docsUrl: 'https://agentrouter.org/docs/index.html',
    keyHelp: 'Get your key at ps.air-outer.com or agentrouter.org',
    presetModels: [
      { id: 'gpt-6.1-sol', label: 'gpt-6.1-sol (OpenAI Responses API - Recommended)' },
      { id: 'gpt-6-astra', label: 'gpt-6-astra (OpenAI Astra - Responses API)' },
      { id: 'deepseek-v4-flash', label: 'deepseek-v4-flash (DeepSeek Fast)' },
      { id: 'claude-opus-5', label: 'claude-opus-5 (Anthropic Opus)' },
      { id: 'glm-5.3', label: 'glm-5.3 (Zhipu AI)' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    tagline: 'Hundreds of models with free & paid tiers',
    icon: Globe,
    defaultUrl: 'https://openrouter.ai/api/v1',
    docsUrl: 'https://openrouter.ai/keys',
    keyHelp: 'Create an API key at openrouter.ai/keys',
    presetModels: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B Instruct (Free)' },
      { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3 (Chat)' },
      { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (Free Reasoning)' },
      { id: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash (Free Fast)' },
      { id: 'openai/gpt-4o-mini', label: 'OpenAI GPT-4o Mini' },
      { id: 'anthropic/claude-3.5-sonnet', label: 'Anthropic Claude 3.5 Sonnet' },
    ],
  },
  {
    id: 'huggingface',
    name: 'Hugging Face',
    tagline: 'Serverless Router & Open Weights',
    icon: Sparkles,
    defaultUrl: 'https://router.huggingface.co/v1',
    docsUrl: 'https://huggingface.co/settings/tokens',
    keyHelp: 'Get User Access Token at huggingface.co/settings/tokens',
    presetModels: [
      { id: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B Instruct' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', label: 'Qwen 2.5 72B Instruct' },
      { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', label: 'DeepSeek R1 Distill Qwen 32B' },
      { id: 'mistralai/Mistral-7B-Instruct-v0.3', label: 'Mistral 7B Instruct v0.3' },
      { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
    ],
  },
  {
    id: 'pawan',
    name: 'Pawan.Krd',
    tagline: 'Free PAI-001 & CosmosRP Chat API',
    icon: Cpu,
    defaultUrl: 'https://api.pawan.krd/v1',
    docsUrl: 'https://pawan.krd',
    keyHelp: 'Join Discord (pawan.krd) & type /key to get free key',
    presetModels: [
      { id: 'pai-001-light', label: 'pai-001-light (Fast & Free)' },
      { id: 'pai-001', label: 'pai-001 (Standard)' },
      { id: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' },
      { id: 'gpt-4o', label: 'gpt-4o' },
      { id: 'cosmosrp', label: 'CosmosRP (Roleplay/Chat tuned)' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom / Local',
    tagline: 'Ollama, LMStudio, vLLM, or Custom proxy',
    icon: Server,
    defaultUrl: 'http://localhost:11434/v1',
    docsUrl: 'https://ollama.com',
    keyHelp: 'Optional for local Ollama. Set OLLAMA_ORIGINS="*"',
    presetModels: [
      { id: 'llama3.2', label: 'Llama 3.2 (Local)' },
      { id: 'mistral', label: 'Mistral 7B (Local)' },
      { id: 'qwen2.5', label: 'Qwen 2.5 (Local)' },
      { id: 'deepseek-r1', label: 'DeepSeek R1 (Local)' },
    ],
  },
];

export const SettingsTab: React.FC<Props> = ({
  settings,
  router: propRouter,
  safety: propSafety,
  onUpdateSettings,
  onUpdateRouter,
  onUpdateSafety,
}) => {
  // Provider resolution
  const activeProvider: LLMProviderType = settings?.activeProvider || 'agentrouter';

  // Get active provider config
  const activeConfig: ProviderConfig =
    settings?.providers?.[activeProvider] ||
    (DEFAULT_PROVIDERS[activeProvider] ? { ...DEFAULT_PROVIDERS[activeProvider] } : {
      id: 'agentrouter',
      name: 'AgentRouter',
      baseUrl: propRouter?.baseUrl || 'https://agentrouter.org/v1',
      apiKey: propRouter?.apiKey || '',
      model: propRouter?.model || 'gpt-6.1-sol',
      temperature: propRouter?.temperature ?? 0.7,
      maxTokens: propRouter?.maxTokens ?? 250,
      availableModels: propRouter?.availableModels || DEFAULT_AGENTROUTER_MODELS,
    });

  const activeSafety: SafetySettings = settings?.safety || propSafety || {
    coalesceDelayMs: 4500,
    typingSpeedWpm: 60,
    humanJitter: true,
    maxAutoRepliesPerSession: 30,
    requireConfirmationForSensitiveWords: true,
  };

  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchMessage, setFetchMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSettings, setSavedSettings] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const [showCustomModelInput, setShowCustomModelInput] = useState(false);

  // Active provider metadata
  const currentMeta: ProviderMeta = PROVIDER_METAS.find((m) => m.id === activeProvider) ?? PROVIDER_METAS[0]!;

  // Helper to update current provider configuration
  const handleUpdateActiveProviderConfig = (updates: Partial<ProviderConfig>) => {
    const updatedConfig: ProviderConfig = {
      ...activeConfig,
      ...updates,
    };

    if (onUpdateSettings && settings) {
      const updatedProviders = {
        ...settings.providers,
        [activeProvider]: updatedConfig,
      };

      // If active provider is agentrouter, keep legacy router object synchronized
      const updatedRouter: AgentRouterConfig =
        activeProvider === 'agentrouter'
          ? {
              baseUrl: updatedConfig.baseUrl,
              apiKey: updatedConfig.apiKey,
              model: updatedConfig.model,
              temperature: updatedConfig.temperature,
              maxTokens: updatedConfig.maxTokens,
              availableModels: updatedConfig.availableModels,
            }
          : settings.router;

      onUpdateSettings({
        providers: updatedProviders,
        router: updatedRouter,
      });
    } else if (onUpdateRouter) {
      onUpdateRouter({
        baseUrl: updatedConfig.baseUrl,
        apiKey: updatedConfig.apiKey,
        model: updatedConfig.model,
        temperature: updatedConfig.temperature,
        maxTokens: updatedConfig.maxTokens,
        availableModels: updatedConfig.availableModels,
      });
    }
  };

  const handleSelectProvider = (newProvider: LLMProviderType) => {
    if (newProvider === activeProvider) return;
    setTestResult(null);
    setFetchMessage(null);

    if (onUpdateSettings && settings) {
      const targetConfig = settings.providers?.[newProvider] || DEFAULT_PROVIDERS[newProvider];
      onUpdateSettings({
        activeProvider: newProvider,
        router:
          newProvider === 'agentrouter'
            ? {
                baseUrl: targetConfig.baseUrl,
                apiKey: targetConfig.apiKey,
                model: targetConfig.model,
                temperature: targetConfig.temperature,
                maxTokens: targetConfig.maxTokens,
                availableModels: targetConfig.availableModels,
              }
            : settings.router,
      });
    }
  };

  const handleUpdateSafetySettings = (updates: Partial<SafetySettings>) => {
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        safety: { ...activeSafety, ...updates },
      });
    } else if (onUpdateSafety) {
      onUpdateSafety(updates);
    }
  };

  const handleManualSave = () => {
    if (onUpdateSettings && settings) {
      onUpdateSettings({
        activeProvider,
        providers: {
          ...settings.providers,
          [activeProvider]: { ...activeConfig },
        },
        safety: { ...activeSafety },
      });
    }
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  // Build model selection options: Presets + Fetched available models
  const modelOptions = Array.from(
    new Set([
      ...currentMeta.presetModels.map((m) => m.id),
      ...(activeConfig.availableModels || []),
      activeConfig.model,
    ])
  ).filter(Boolean);

  const handleFetchModels = async () => {
    if (activeProvider !== 'custom' && !activeConfig.apiKey) {
      setFetchMessage({
        success: false,
        text: `Please enter your ${currentMeta.name} API Key first.`,
      });
      return;
    }

    setFetchingModels(true);
    setFetchMessage(null);

    try {
      const fetched = await fetchAvailableModels(activeConfig, activeProvider);
      if (fetched.length > 0) {
        handleUpdateActiveProviderConfig({ availableModels: fetched });
        setFetchMessage({
          success: true,
          text: `Fetched ${fetched.length} live models from ${currentMeta.name}!`,
        });
      } else {
        setFetchMessage({
          success: true,
          text: `Connected to ${currentMeta.name}, but 0 models returned. Using default presets.`,
        });
      }
    } catch (err: any) {
      setFetchMessage({
        success: false,
        text: err.message || `Failed to fetch models from ${currentMeta.name}.`,
      });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTestConnection = async () => {
    if (activeProvider !== 'custom' && !activeConfig.apiKey) {
      setTestResult({
        success: false,
        message: `Please enter your ${currentMeta.name} API Key first.`,
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await testConnection(activeConfig, activeProvider);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleAddCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customModelInput.trim();
    if (!trimmed) return;

    const currentModels = activeConfig.availableModels || [];
    const updated = Array.from(new Set([trimmed, ...currentModels]));
    handleUpdateActiveProviderConfig({
      model: trimmed,
      availableModels: updated,
    });
    setCustomModelInput('');
    setShowCustomModelInput(false);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Provider Selector Card */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              LLM Provider
            </h3>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-medium">
            Active: {currentMeta.name}
          </span>
        </div>

        {/* 5-Provider Tabs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {PROVIDER_METAS.map((meta) => {
            const Icon = meta.icon;
            const isSelected = activeProvider === meta.id;
            const hasKey = !!settings?.providers?.[meta.id]?.apiKey;

            return (
              <button
                key={meta.id}
                type="button"
                onClick={() => handleSelectProvider(meta.id)}
                className={`p-2 rounded-lg text-left transition-all border flex flex-col gap-1 relative ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-500 shadow-sm shadow-cyan-900/40 text-cyan-200'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-semibold truncate">{meta.name}</span>
                  </div>
                  {meta.id !== 'custom' && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        hasKey ? 'bg-emerald-400 shadow-sm shadow-emerald-500' : 'bg-slate-700'
                      }`}
                      title={hasKey ? 'API Key Configured' : 'No Key Set'}
                    />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 line-clamp-1 leading-tight">
                  {meta.tagline}
                </span>
              </button>
            );
          })}
        </div>

        {/* Provider Context Helper Banner */}
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-start justify-between gap-2 text-xs">
          <div className="space-y-0.5">
            <p className="font-medium text-slate-300 flex items-center gap-1.5">
              <span>{currentMeta.name}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                ({currentMeta.tagline})
              </span>
            </p>
            <p className="text-[11px] text-slate-400">{currentMeta.keyHelp}</p>
          </div>
          <a
            href={currentMeta.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium shrink-0 pt-0.5"
          >
            Docs <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Active Provider Configuration Card */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
              {currentMeta.name} Configuration
            </h3>
          </div>
          <button
            type="button"
            onClick={handleManualSave}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
              savedSettings
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {savedSettings ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>

        {/* Base URL */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Base URL Endpoint
            </label>
            {activeConfig.baseUrl !== currentMeta.defaultUrl && (
              <button
                type="button"
                onClick={() =>
                  handleUpdateActiveProviderConfig({ baseUrl: currentMeta.defaultUrl })
                }
                className="text-[10px] text-cyan-400 hover:underline"
              >
                Reset Default
              </button>
            )}
          </div>
          <input
            type="text"
            value={activeConfig.baseUrl}
            onChange={(e) =>
              handleUpdateActiveProviderConfig({ baseUrl: e.target.value })
            }
            placeholder={currentMeta.defaultUrl}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* API Key */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-slate-400" />
              API Key / Token
              {activeProvider === 'custom' && (
                <span className="text-[10px] text-slate-500">(Optional for local)</span>
              )}
            </label>
            <a
              href={currentMeta.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              Get Key <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={activeConfig.apiKey}
              onChange={(e) =>
                handleUpdateActiveProviderConfig({ apiKey: e.target.value })
              }
              placeholder={
                activeProvider === 'custom'
                  ? 'sk-... (optional for local)'
                  : `Enter ${currentMeta.name} API Key`
              }
              className="w-full pl-3 pr-9 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Model Selection & Live Fetching */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              Model Name
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCustomModelInput(!showCustomModelInput)}
                className="text-[11px] text-slate-400 hover:text-cyan-300"
              >
                {showCustomModelInput ? 'Select from list' : '+ Custom Model'}
              </button>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={fetchingModels}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                title="Fetch live active models from API"
              >
                <RefreshCw className={`w-3 h-3 ${fetchingModels ? 'animate-spin' : ''}`} />
                Fetch Live Models
              </button>
            </div>
          </div>

          {showCustomModelInput ? (
            <form onSubmit={handleAddCustomModel} className="flex gap-1.5">
              <input
                type="text"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                placeholder="e.g. meta-llama/llama-3.3-70b-instruct"
                className="flex-1 px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium rounded-lg border border-slate-700"
              >
                Apply
              </button>
            </form>
          ) : (
            <select
              value={activeConfig.model}
              onChange={(e) =>
                handleUpdateActiveProviderConfig({ model: e.target.value })
              }
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <optgroup label="Preset Models">
                {currentMeta.presetModels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
              {activeConfig.availableModels &&
                activeConfig.availableModels.filter(
                  (m) => !currentMeta.presetModels.some((p) => p.id === m)
                ).length > 0 && (
                  <optgroup label="Fetched / Custom Models">
                    {activeConfig.availableModels
                      .filter((m) => !currentMeta.presetModels.some((p) => p.id === m))
                      .map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                  </optgroup>
                )}
            </select>
          )}

          {/* Model Fetch Status Feedback */}
          {fetchMessage && (
            <p
              className={`text-[11px] ${
                fetchMessage.success ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {fetchMessage.text}
            </p>
          )}
        </div>

        {/* Sliders: Temperature & Max Tokens */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-slate-400" />
                Temperature
              </span>
              <span className="font-mono text-cyan-400">{activeConfig.temperature}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={activeConfig.temperature}
              onChange={(e) =>
                handleUpdateActiveProviderConfig({
                  temperature: parseFloat(e.target.value),
                })
              }
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Max Tokens
              </span>
              <span className="font-mono text-cyan-400">{activeConfig.maxTokens}</span>
            </div>
            <input
              type="number"
              min="50"
              max="2000"
              step="50"
              value={activeConfig.maxTokens}
              onChange={(e) =>
                handleUpdateActiveProviderConfig({
                  maxTokens: parseInt(e.target.value, 10) || 250,
                })
              }
              className="w-full px-2.5 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>~50 words</span>
              <span>~300 words</span>
            </div>
          </div>
        </div>

        {/* Test Connection Button & Result */}
        <div className="pt-1 border-t border-slate-800/80 space-y-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700/60"
          >
            {testing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Verifying {currentMeta.name}...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Test {currentMeta.name} Connection
              </>
            )}
          </button>

          {testResult && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="font-semibold">{testResult.success ? 'Success' : 'Connection Failed'}</p>
                <p className="text-[11px] opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Safety & Anti-Detection Settings Card */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-md">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider">
            Safety & Human Emulation
          </h3>
        </div>

        {/* Coalescing Delay Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Coalescing Debounce Delay</span>
            <span className="font-mono text-cyan-400">
              {activeSafety.coalesceDelayMs / 1000}s
            </span>
          </div>
          <input
            type="range"
            min="2000"
            max="12000"
            step="500"
            value={activeSafety.coalesceDelayMs}
            onChange={(e) =>
              handleUpdateSafetySettings({
                coalesceDelayMs: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-cyan-500"
          />
          <p className="text-[10px] text-slate-500">
            Wait time after receiving a message to catch multi-bubble sentences before generating a reply.
          </p>
        </div>

        {/* Typing Speed Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Human Typing Speed</span>
            <span className="font-mono text-cyan-400">
              ~{activeSafety.typingSpeedWpm} WPM
            </span>
          </div>
          <input
            type="range"
            min="30"
            max="100"
            step="5"
            value={activeSafety.typingSpeedWpm}
            onChange={(e) =>
              handleUpdateSafetySettings({
                typingSpeedWpm: parseInt(e.target.value, 10),
              })
            }
            className="w-full accent-cyan-500"
          />
          <p className="text-[10px] text-slate-500">
            Simulates keystroke intervals with natural human jitter to prevent bot detection.
          </p>
        </div>

        {/* Human Jitter Toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
          <div>
            <p className="text-xs font-medium text-slate-300">Human Typing Variance</p>
            <p className="text-[10px] text-slate-500">
              Adds random delays after punctuation (. , ? !)
            </p>
          </div>
          <input
            type="checkbox"
            checked={activeSafety.humanJitter}
            onChange={(e) =>
              handleUpdateSafetySettings({ humanJitter: e.target.checked })
            }
            className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 accent-cyan-500"
          />
        </div>

        {/* Sensitive Words Confirmation Toggle */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
          <div>
            <p className="text-xs font-medium text-slate-300">Require Approval for Sensitive Words</p>
            <p className="text-[10px] text-slate-500">
              Forces manual review if message contains passwords, money, or addresses
            </p>
          </div>
          <input
            type="checkbox"
            checked={activeSafety.requireConfirmationForSensitiveWords}
            onChange={(e) =>
              handleUpdateSafetySettings({
                requireConfirmationForSensitiveWords: e.target.checked,
              })
            }
            className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700 accent-cyan-500"
          />
        </div>
      </div>
    </div>
  );
};
