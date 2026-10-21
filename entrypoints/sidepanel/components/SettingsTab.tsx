import React, { useState } from 'react';
import type { AgentRouterConfig, SafetySettings } from '../../../types';
import { testConnection, fetchAvailableModels, normalizeBaseUrl } from '../../../utils/agent-router';
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
} from 'lucide-react';

interface Props {
  router: AgentRouterConfig;
  safety: SafetySettings;
  onUpdateRouter: (router: Partial<AgentRouterConfig>) => void;
  onUpdateSafety: (safety: Partial<SafetySettings>) => void;
}

export const SettingsTab: React.FC<Props> = ({
  router,
  safety,
  onUpdateRouter,
  onUpdateSafety,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchMessage, setFetchMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Curated AgentRouter primary models
  const PRIMARY_MODELS = [
    { id: 'gpt-6.1-sol', label: 'gpt-6.1-sol (OpenAI Flagship)' },
    { id: 'deepseek-v4-flash', label: 'deepseek-v4-flash (DeepSeek Fast)' },
    { id: 'gpt-6-astra', label: 'gpt-6-astra (OpenAI Astra)' },
    { id: 'claude-opus-5', label: 'claude-opus-5 (Anthropic Opus)' },
    { id: 'glm-5.3', label: 'glm-5.3 (Zhipu AI)' },
  ];

  // Combine primary models with any dynamically fetched models from API
  const availableModelsList = Array.from(
    new Set([
      'gpt-6.1-sol',
      'deepseek-v4-flash',
      'gpt-6-astra',
      'claude-opus-5',
      'glm-5.3',
      ...(router.availableModels || []),
    ])
  );

  const handleFetchModels = async () => {
    if (!router.apiKey) {
      setFetchMessage({ success: false, text: 'Please enter your Agent Router API Key first.' });
      return;
    }

    setFetchingModels(true);
    setFetchMessage(null);

    try {
      const fetched = await fetchAvailableModels(router);
      if (fetched.length > 0) {
        onUpdateRouter({ availableModels: fetched });
        setFetchMessage({
          success: true,
          text: `Successfully fetched ${fetched.length} active models from your AgentRouter account!`,
        });
      } else {
        setFetchMessage({
          success: true,
          text: 'Connected, but no custom models returned. Using default AgentRouter models.',
        });
      }
    } catch (err: any) {
      setFetchMessage({ success: false, text: err.message || 'Failed to fetch models.' });
    } finally {
      setFetchingModels(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(router);
      setTestResult(res);
      // If we got model count, also update available models list
      if (res.modelsCount && res.modelsCount > 0) {
        const fetched = await fetchAvailableModels(router);
        onUpdateRouter({ availableModels: fetched });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleResetUrl = () => {
    onUpdateRouter({ baseUrl: 'https://agentrouter.org/v1' });
  };

  return (
    <div className="space-y-4">
      {/* 1. Agent Router API Configuration */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-cyan-400" />
            AgentRouter Configuration
          </label>
          <a
            href="https://agentrouter.org/docs/"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
          >
            Docs <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Base URL */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <label className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              API Base URL
            </label>
            {router.baseUrl !== 'https://agentrouter.org/v1' && (
              <button
                type="button"
                onClick={handleResetUrl}
                className="text-cyan-400 hover:underline text-[10px]"
              >
                Reset to agentrouter.org/v1
              </button>
            )}
          </div>
          <input
            type="text"
            value={router.baseUrl}
            onChange={(e) => onUpdateRouter({ baseUrl: e.target.value })}
            onBlur={() => onUpdateRouter({ baseUrl: normalizeBaseUrl(router.baseUrl) })}
            placeholder="https://agentrouter.org/v1"
            className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
          <p className="text-[10px] text-slate-500">
            Endpoint: <span className="text-slate-400 font-mono">https://agentrouter.org/v1</span> (OpenAI compatible)
          </p>
        </div>

        {/* API Key */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <label className="flex items-center gap-1">
              <Key className="w-3 h-3" />
              AgentRouter API Key
            </label>
            <div className="flex items-center gap-2">
              <a
                href="https://ps.air-outer.com/console/token"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline text-[10px] flex items-center gap-0.5"
              >
                Get Key <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 text-[10px]"
              >
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            value={router.apiKey}
            onChange={(e) => onUpdateRouter({ apiKey: e.target.value })}
            placeholder="Paste your AgentRouter API token..."
            className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Model Selection & Fetcher */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <label className="flex items-center gap-1">
              <Cpu className="w-3 h-3" />
              Selected LLM Model
            </label>
            <button
              type="button"
              onClick={handleFetchModels}
              disabled={fetchingModels || !router.apiKey}
              className="text-cyan-400 hover:text-cyan-300 disabled:opacity-50 flex items-center gap-1 text-[10px] font-medium transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${fetchingModels ? 'animate-spin' : ''}`} />
              Fetch Available Models
            </button>
          </div>

          <select
            value={router.model}
            onChange={(e) => onUpdateRouter({ model: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <optgroup label="AgentRouter Recommended Models">
              {PRIMARY_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </optgroup>

            {router.availableModels && router.availableModels.length > 0 && (
              <optgroup label={`Fetched from Your Account (${router.availableModels.length})`}>
                {router.availableModels
                  .filter((id) => !PRIMARY_MODELS.some((pm) => pm.id === id))
                  .map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>

          {/* Or enter custom model ID */}
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="text"
              value={router.model}
              onChange={(e) => onUpdateRouter({ model: e.target.value })}
              placeholder="Or type exact model name (e.g. gpt-6.1-sol)..."
              className="flex-1 px-2.5 py-1 text-[11px] bg-slate-950/60 border border-slate-800/80 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          {fetchMessage && (
            <p
              className={`text-[10px] p-1.5 rounded-md ${
                fetchMessage.success
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/80'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800/80'
              }`}
            >
              {fetchMessage.text}
            </p>
          )}
        </div>

        {/* Test Connection Button */}
        <button
          onClick={handleTestConnection}
          disabled={testing || !router.apiKey}
          className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          {testing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              Verifying AgentRouter Connection...
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Test AgentRouter API Key
            </>
          )}
        </button>

        {testResult && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
              testResult.success
                ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-800 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            )}
            <div className="text-[11px] leading-relaxed break-words space-y-1">
              <p className="font-semibold">{testResult.success ? 'Success!' : 'Connection Failed'}</p>
              <p>{testResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* 2. Coalescing & Typing Simulation */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          Anti-Detection & Human Simulation
        </label>

        {/* Coalesce Delay */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Coalescing Buffer:
            </span>
            <span className="text-cyan-400 font-mono">
              {(safety.coalesceDelayMs / 1000).toFixed(1)}s
            </span>
          </div>
          <input
            type="range"
            min="2000"
            max="10000"
            step="500"
            value={safety.coalesceDelayMs}
            onChange={(e) => onUpdateSafety({ coalesceDelayMs: Number(e.target.value) })}
            className="w-full accent-cyan-500"
          />
          <p className="text-[10px] text-slate-500">
            Waits this long after friend sends a message in case they type multiple short messages in a row.
          </p>
        </div>

        {/* Typing Speed */}
        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Simulated Typing Speed:</span>
            <span className="text-cyan-400 font-mono">{safety.typingSpeedWpm} WPM</span>
          </div>
          <input
            type="range"
            min="35"
            max="95"
            step="5"
            value={safety.typingSpeedWpm}
            onChange={(e) => onUpdateSafety({ typingSpeedWpm: Number(e.target.value) })}
            className="w-full accent-cyan-500"
          />
          <p className="text-[10px] text-slate-500">
            Types character-by-character into Messenger to realistically trigger Facebook&apos;s typing status.
          </p>
        </div>

        {/* Human Jitter */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-300">Natural Keystroke Jitter (Variance)</span>
          <input
            type="checkbox"
            checked={safety.humanJitter}
            onChange={(e) => onUpdateSafety({ humanJitter: e.target.checked })}
            className="w-4 h-4 rounded text-cyan-600 bg-slate-950 border-slate-700"
          />
        </div>
      </div>
    </div>
  );
};
