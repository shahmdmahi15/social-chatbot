import React, { useState } from 'react';
import type { AgentRouterConfig, SafetySettings } from '../../../types';
import { testConnection } from '../../../utils/agent-router';
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
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(router);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const POPULAR_MODELS = [
    { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (Fast & Low Cost)' },
    { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)' },
    { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Nuanced Vibe)' },
    { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. Agent Router API Configuration */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
          <Key className="w-4 h-4 text-cyan-400" />
          Agent Router / OpenRouter API
        </label>

        {/* Base URL */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            API Base URL
          </label>
          <input
            type="text"
            value={router.baseUrl}
            onChange={(e) => onUpdateRouter({ baseUrl: e.target.value })}
            placeholder="https://openrouter.ai/api/v1"
            className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* API Key */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Key className="w-3 h-3" />
              API Key
            </span>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 text-[10px]"
            >
              {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showKey ? 'Hide' : 'Show'}
            </button>
          </label>
          <input
            type={showKey ? 'text' : 'password'}
            value={router.apiKey}
            onChange={(e) => onUpdateRouter({ apiKey: e.target.value })}
            placeholder="sk-or-v1-..."
            className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Model Selection */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            LLM Model
          </label>
          <select
            value={router.model}
            onChange={(e) => onUpdateRouter({ model: e.target.value })}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {POPULAR_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Or custom model string */}
          <input
            type="text"
            value={router.model}
            onChange={(e) => onUpdateRouter({ model: e.target.value })}
            placeholder="Or enter custom model ID..."
            className="w-full mt-1 px-2.5 py-1 text-[11px] bg-slate-950/60 border border-slate-800/80 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Test Connection Button */}
        <button
          onClick={handleTestConnection}
          disabled={testing || !router.apiKey}
          className="w-full py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
        >
          {testing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              Testing Connection...
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Test API Key Connection
            </>
          )}
        </button>

        {testResult && (
          <div
            className={`p-2 rounded-lg text-xs flex items-start gap-1.5 ${
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
            <p className="text-[11px] break-words">{testResult.message}</p>
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
